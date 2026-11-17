'use strict';

const AppError = require('./AppError');

/**
 * Strip HTML tags to plain text for export.
 * @param {string} html
 * @returns {string}
 */
function toPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Wrap a single paragraph into words that fit within maxLineLength.
 * @param {string} paragraph
 * @param {number} maxLineLength
 * @returns {string[]}
 */
function splitParagraphIntoLines(paragraph, maxLineLength = 85) {
  const words = paragraph.trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxLineLength) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Wrap multi-line text into lines of at most maxLineLength.
 * @param {string} text
 * @param {number} maxLineLength
 * @returns {string[]}
 */
function wrapText(text, maxLineLength = 85) {
  if (!text) return [];
  const paragraphs = String(text).split(/\r?\n/);
  const lines = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed) {
      lines.push(...splitParagraphIntoLines(trimmed, maxLineLength));
      lines.push('');
    }
  }
  return lines;
}

/**
 * Format a note object into a clean plain-text (.txt) string.
 * @param {object} note
 * @returns {string}
 */
function formatNoteAsTxt(note) {
  const title = note.title || 'Untitled Note';
  const category = note.category || 'General';
  const tags = note.tags || 'None';
  const updated = note.updated_at ? new Date(note.updated_at).toISOString() : new Date().toISOString();
  let body = note.content_text || toPlainText(note.content);

  if (note.content && !body.includes('\n')) {
    const richBody = toPlainText(note.content);
    if (richBody.split('\n').length > 2) {
      body = richBody;
    }
  }

  return [
    `Title: ${title}`,
    `Category: ${category}`,
    `Tags: ${tags}`,
    `Last Updated: ${updated}`,
    '----------------------------------------',
    '',
    body,
    '',
  ].join('\n');
}

/**
 * Escape special PDF string characters.
 * @param {string} str
 * @returns {string}
 */
function escapePdfText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

/**
 * Build PDF text stream operations for a given page.
 * @param {number} p - Page index
 * @param {string} title
 * @param {string} category
 * @param {string} tags
 * @param {string[]} chunk - Lines on this page
 * @returns {string}
 */
function buildPageTextOps(p, title, category, tags, chunk) {
  const textOps = ['BT'];
  if (p === 0) {
    textOps.push('/F1 15 Tf');
    textOps.push('50 740 Td');
    textOps.push(`(${title}) Tj`);
    textOps.push('/F1 9 Tf');
    textOps.push('0 -18 Td');
    textOps.push(`(Category: ${category} | Tags: ${tags}) Tj`);
    textOps.push('0 -14 Td');
    textOps.push('(--------------------------------------------------------------------------------) Tj');
    textOps.push('/F1 10 Tf');
  } else {
    textOps.push('/F1 10 Tf');
    textOps.push('50 740 Td');
    textOps.push(`(${title} - Page ${p + 1}) Tj`);
    textOps.push('0 -18 Td');
    textOps.push('(--------------------------------------------------------------------------------) Tj');
  }

  for (const line of chunk) {
    textOps.push('0 -14 Td');
    textOps.push(`(${escapePdfText(line)}) Tj`);
  }
  textOps.push('ET');
  return textOps.join('\n');
}

/**
 * Generate a valid standard PDF-1.4 Buffer for a note.
 * @param {object} note
 * @returns {Buffer}
 */
function formatNoteAsPdf(note) {
  const title = escapePdfText(note.title || 'Untitled Note');
  const category = escapePdfText(note.category || 'General');
  const tags = escapePdfText(note.tags || 'None');
  const rawBody = (note.content && toPlainText(note.content)) || note.content_text || '';
  const lines = wrapText(rawBody, 85);

  const linesPerPage = 38;
  const pageChunks = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pageChunks.push(lines.slice(i, i + linesPerPage));
  }
  if (pageChunks.length === 0) {
    pageChunks.push([]);
  }

  const totalPages = pageChunks.length;
  const kidsRefs = [];
  for (let i = 0; i < totalPages; i += 1) {
    kidsRefs.push(`${4 + 2 * i} 0 R`);
  }

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${totalPages} >>\nendobj\n`,
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  for (let p = 0; p < totalPages; p += 1) {
    const pageObjNum = 4 + 2 * p;
    const contentObjNum = pageObjNum + 1;
    const streamContent = buildPageTextOps(p, title, category, tags, pageChunks[p]);

    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

/**
 * Export a note in the requested format ('txt' or 'pdf').
 * @param {object} note
 * @param {string} format
 * @returns {{ buffer: Buffer, mimeType: string, filename: string }}
 */
function exportNoteDocument(note, format = 'txt') {
  const normalized = String(format || 'txt').toLowerCase();
  if (normalized !== 'txt' && normalized !== 'pdf') {
    throw new AppError('Unsupported export format. Use "txt" or "pdf".', 400, 'INVALID_EXPORT_FORMAT');
  }

  const safeId = note.id || 'export';
  if (normalized === 'pdf') {
    return {
      buffer: formatNoteAsPdf(note),
      mimeType: 'application/pdf',
      filename: `note-${safeId}.pdf`,
    };
  }

  return {
    buffer: Buffer.from(formatNoteAsTxt(note), 'utf8'),
    mimeType: 'text/plain; charset=utf-8',
    filename: `note-${safeId}.txt`,
  };
}

module.exports = {
  toPlainText,
  formatNoteAsTxt,
  formatNoteAsPdf,
  exportNoteDocument,
};
