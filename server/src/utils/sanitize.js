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
  return sanitizeHtml(String(text), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
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

