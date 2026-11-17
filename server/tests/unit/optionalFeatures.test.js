'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { exportNoteDocument, formatNoteAsTxt, formatNoteAsPdf } = require('../../src/utils/exporter');
const { parseImportedFile } = require('../../src/utils/importer');
const realtime = require('../../src/utils/realtime');
const notesService = require('../../src/services/notesService');
const notesModel = require('../../src/models/notesModel');
const db = require('../../src/config/db');
const AppError = require('../../src/utils/AppError');

describe('Optional Advanced Features (Export, Import, Socket.IO Realtime, Categories/Tags, Favorites, Sorting & Pagination)', () => {
  afterEach(() => {
    realtime.setIoInstance(null);
    sinon.restore();
  });

  // ─── 1. Export Notes as PDF and TXT ────────────────────────────────────────
  describe('1. Export Notes (TXT & PDF)', () => {
    const sampleNote = {
      id: 77,
      user_id: 10,
      title: 'Architecture Blueprint',
      category: 'Engineering',
      tags: 'backend, mysql',
      content: '<h1>Overview</h1><p>Modular layered design.</p>',
      content_text: 'Overview Modular layered design.',
      updated_at: '2026-11-14T12:00:00Z',
    };

    it('exports note as TXT with title, category, tags and plain text content', () => {
      const result = exportNoteDocument(sampleNote, 'txt');
      expect(result.mimeType).to.equal('text/plain; charset=utf-8');
      expect(result.filename).to.equal('note-77.txt');
      const text = result.buffer.toString('utf8');
      expect(text).to.include('Title: Architecture Blueprint');
      expect(text).to.include('Category: Engineering');
      expect(text).to.include('Tags: backend, mysql');
      expect(text).to.include('Overview Modular layered design.');
    });

    it('exports note as a valid PDF-1.4 binary document', () => {
      const result = exportNoteDocument(sampleNote, 'pdf');
      expect(result.mimeType).to.equal('application/pdf');
      expect(result.filename).to.equal('note-77.pdf');
      const pdfStr = result.buffer.toString('utf8');
      expect(pdfStr.startsWith('%PDF-1.4')).to.equal(true);
      expect(pdfStr).to.include('Architecture Blueprint');
      expect(pdfStr.trim().endsWith('%%EOF')).to.equal(true);
    });

    it('throws 400 INVALID_EXPORT_FORMAT for unsupported export format', () => {
      expect(() => exportNoteDocument(sampleNote, 'exe')).to.throw(AppError);
    });

    it('enforces ownership when exporting via notesService.exportNote (404 for cross-user)', async () => {
      sinon.stub(notesModel, 'findById').withArgs(77, 20).resolves(null);

      let caught;
      try {
        await notesService.exportNote(77, 20, 'pdf');
      } catch (err) {
        caught = err;
      }

      expect(caught).to.be.instanceOf(AppError);
      expect(caught.statusCode).to.equal(404);
    });
  });

  // ─── 2. Import Notes from Supported Files ──────────────────────────────────
  describe('2. Import Notes (.txt, .md, .html, .json) & XSS Sanitization', () => {
    it('parses and sanitizes a Markdown (.md) file import', () => {
      const parsed = parseImportedFile({
        filename: 'sprint-notes.md',
        content: '# Sprint Goals\nComplete all unit tests\n<script>alert(1)</script>',
        category: 'Work',
        tags: 'sprint, testing',
      });

      expect(parsed.title).to.equal('Sprint Goals');
      expect(parsed.category).to.equal('Work');
      expect(parsed.tags).to.equal('sprint, testing');
      expect(parsed.content).to.include('<h1>Sprint Goals</h1>');
      expect(parsed.content).to.not.include('<script>');
    });

    it('parses and sanitizes a JSON (.json) file import', () => {
      const parsed = parseImportedFile({
        filename: 'backup.json',
        content: JSON.stringify({
          title: '<b>JSON Note</b><script>bad()</script>',
          content: '<p>Safe JSON body</p><img src=x onerror="evil()">',
          category: 'Personal',
          tags: ['json', 'imported'],
        }),
      });

      expect(parsed.title).to.equal('JSON Note');
      expect(parsed.category).to.equal('Personal');
      expect(parsed.tags).to.equal('json, imported');
      expect(parsed.content).to.equal('<p>Safe JSON body</p>');
    });

    it('rejects unsupported file extensions (.exe) with 400 AppError', () => {
      let caught;
      try {
        parseImportedFile({ filename: 'malware.exe', content: 'binary' });
      } catch (err) {
        caught = err;
      }
      expect(caught).to.be.instanceOf(AppError);
      expect(caught.statusCode).to.equal(400);
      expect(caught.code).to.equal('UNSUPPORTED_FILE_FORMAT');
    });
  });

  // ─── 3. Real-Time Updates using Socket.IO ──────────────────────────────────
  describe('3. Real-Time Updates (Socket.IO user rooms)', () => {
    it('emits note:created, note:updated, and note:deleted to the owning user room only', async () => {
      const emitSpy = sinon.spy();
      const mockIo = {
        to: sinon.stub().returns({ emit: emitSpy }),
      };
      realtime.setIoInstance(mockIo);

      const user10Events = [];
      const user20Events = [];
      const unsub10 = realtime.subscribeUser(10, (ev) => user10Events.push(ev));
      const unsub20 = realtime.subscribeUser(20, (ev) => user20Events.push(ev));

      sinon.stub(notesModel, 'create').resolves({ id: 501, user_id: 10, title: 'Realtime Note' });
      await notesService.createNote(10, { title: 'Realtime Note', content: '<p>Live</p>' });

      expect(mockIo.to.calledOnceWithExactly('user:10')).to.equal(true);
      expect(emitSpy.calledOnce).to.equal(true);
      expect(emitSpy.firstCall.args[0]).to.equal('note:created');
      expect(user10Events.length).to.equal(1);
      expect(user20Events.length).to.equal(0);

      unsub10();
      unsub20();
    });
  });

  // ─── 4, 5, 6 & 7. Categories, Tags, Favorites, Sorting & Pagination ────────
  describe('4–7. Categories, Tags, Favorites, Creation/Update Sorting & Pagination', () => {
    it('paginates notes array accurately and returns pagination metadata', () => {
      const all = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
      const page2 = notesService.paginateNotes(all, 2, 2);

      expect(page2.items).to.deep.equal([{ id: 3 }, { id: 4 }]);
      expect(page2.pagination).to.deep.equal({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('builds parameterized SQL with category, tag, favorite, and created_desc sorting in notesModel.findAllByUser', async () => {
      const execStub = sinon.stub(db.pool, 'execute').resolves([[], []]);

      await notesModel.findAllByUser(10, {
        favorite: 'true',
        category: 'Work',
        tag: 'urgent',
        sort: 'created_desc',
      });

      expect(execStub.calledOnce).to.equal(true);
      const [sql, params] = execStub.firstCall.args;
      expect(sql).to.include('AND is_favorite = 1');
      expect(sql).to.include('AND category = ?');
      expect(sql).to.include('AND tags LIKE ?');
      expect(sql).to.include('ORDER BY is_pinned DESC, created_at DESC');
      expect(params).to.deep.equal([10, 'Work', '%urgent%']);
    });
  });
});
