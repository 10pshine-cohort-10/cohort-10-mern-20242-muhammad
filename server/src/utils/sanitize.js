'use strict';

const sanitizeHtml = require('sanitize-html');

/**
 * Strips all HTML tags and attributes, returning pure plain text.
 * Used for title sanitization and indexing.
 * @param {string} text
 * @returns {string}
 */
function sanitizePlainText(text) {
  if (!text) return '';
  // Strip all HTML tags using sanitize-html
  const stripped = sanitizeHtml(String(text), {
    allowedTags: [],
    allowedAttributes: {},
  });
  // sanitize-html encodes entities when stripping tags (e.g. R&D → R&amp;D).
  // Decode them back so stored plain text contains literal characters, not HTML entities.
  // Encoding should happen at the rendering boundary (browser/template), not in storage.
  return stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Sanitizes rich text HTML content, allowing only safe typography,
 * formatting, and semantic tags.
 * Explicitly strips script tags, iframe, onerror, onclick, and javascript: links.
 * @param {string} html
 * @returns {string}
 */
function sanitizeRichContent(html) {
  if (!html) return '';
  return sanitizeHtml(String(html), {
    allowedTags: [
      'h1', 'h2', 'h3',
      'p', 'br',
      'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}

module.exports = {
  sanitizePlainText,
  sanitizeRichContent,
};

