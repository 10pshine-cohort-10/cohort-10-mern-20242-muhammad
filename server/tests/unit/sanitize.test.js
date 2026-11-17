'use strict';

const { expect } = require('chai');
const { sanitizePlainText, sanitizeRichContent } = require('../../src/utils/sanitize');

describe('Server-side Sanitization (utils/sanitize.js)', () => {
  describe('sanitizePlainText (Title)', () => {
    it('should strip all HTML tags from title', () => {
      const input = '<h1>My Note Title</h1>';
      const output = sanitizePlainText(input);
      expect(output).to.equal('My Note Title');
    });

    it('should strip script tags and their content from plain text', () => {
      const input = 'My Title <script>alert("xss")</script>';
      const output = sanitizePlainText(input);
      expect(output).to.not.include('<script>');
      expect(output).to.not.include('alert');
      expect(output).to.equal('My Title');
    });

    it('should strip inline onerror event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">Title with Image';
      const output = sanitizePlainText(input);
      expect(output).to.not.include('<img');
      expect(output).to.not.include('onerror');
      expect(output).to.equal('Title with Image');
    });
  });

  describe('sanitizeRichContent (Note Content)', () => {
    it('should preserve safe formatting tags (p, strong, em, h1, code, pre, ul, li)', () => {
      const input = '<h1>Header</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p><code>const x = 1;</code>';
      const output = sanitizeRichContent(input);
      expect(output).to.include('<h1>Header</h1>');
      expect(output).to.include('<strong>bold</strong>');
      expect(output).to.include('<em>italic</em>');
      expect(output).to.include('<code>const x = 1;</code>');
    });

    it('should eliminate <script> tags and malicious payloads', () => {
      const input = '<p>Normal text</p><script>window.location="http://evil.com"</script>';
      const output = sanitizeRichContent(input);
      expect(output).to.not.include('<script>');
      expect(output).to.not.include('evil.com');
      expect(output).to.include('<p>Normal text</p>');
    });

    it('should eliminate onerror and other event handlers on elements', () => {
      const input = '<p onerror="alert(1)">Text</p><img src="invalid.jpg" onerror="alert(\'pwned\')">';
      const output = sanitizeRichContent(input);
      expect(output).to.not.include('onerror');
      expect(output).to.not.include('alert');
      expect(output).to.include('<p>Text</p>');
    });

    it('should strip iframe and javascript: pseudo-protocol links', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe><a href="javascript:alert(2)">Click me</a>';
      const output = sanitizeRichContent(input);
      expect(output).to.not.include('<iframe');
      expect(output).to.not.include('javascript:');
    });
  });
});

