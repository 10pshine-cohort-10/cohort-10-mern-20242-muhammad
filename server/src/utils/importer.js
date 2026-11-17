'use strict';

const AppError = require('./AppError');
const { sanitizePlainText, sanitizeRichContent } = require('./sanitize');

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.html', '.json'];

/**
 * Extract file extension in lowercase (e.g. '.txt').
 * @param {string} filename
 * @returns {string}
 */
function getExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

/**
 * Derive fallback note title from filename without extension.
 * @param {string} filename
 * @returns {string}
 */
function titleFromFilename(filename) {
  if (!filename) return 'Imported Note';
  const base = filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base || 'Imported Note';
}

/**
 * Convert plain text / markdown lines into safe HTML paragraphs.
 * @param {string} text
 * @returns {string}
 */
function plainTextToHtml(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '<p>Imported note</p>';
  return lines
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      return `<p>${line}</p>`;
    })
    .join('');
}

function parseJsonFile(content, fallbackTitle, fallbackCategory, fallbackTags) {
  let parsed;
  try {
    parsed = typeof content === 'object' ? content : JSON.parse(String(content));
  } catch {
    throw new AppError('Invalid JSON file content', 400, 'INVALID_JSON_IMPORT');
  }

  let htmlContent = '';
  if (parsed.content) {
    const contentStr = String(parsed.content);
    htmlContent = contentStr.includes('<') ? contentStr : plainTextToHtml(parsed.content);
  }

  let parsedTags = fallbackTags;
  if (Array.isArray(parsed.tags)) {
    parsedTags = parsed.tags.join(', ');
  } else if (parsed.tags) {
    parsedTags = parsed.tags;
  }

  return {
    rawTitle: parsed.title || fallbackTitle,
    rawHtml: htmlContent,
    rawCategory: parsed.category || fallbackCategory,
    rawTags: parsedTags,
  };
}

function parseHtmlFile(content) {
  const str = String(content);
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const h1Match = h1Regex.exec(str);
  return {
    rawTitle: h1Match?.[1] || null,
    rawHtml: str,
  };
}

function parseTextOrMdFile(content) {
  const str = String(content);
  const firstLine = str.split(/\r?\n/).find((l) => l.trim().length > 0);
  let rawTitle = null;
  if (firstLine?.startsWith('#')) {
    rawTitle = firstLine.replace(/^#+\s*/, '');
  }
  return {
    rawTitle,
    rawHtml: plainTextToHtml(str),
  };
}

/**
 * Parse and sanitize an uploaded/imported file payload.
 * @param {{ filename: string, content: string, category?: string, tags?: string }} payload
 * @returns {{ title: string, content: string, category: string, tags: string }}
 */
function parseImportedFile({ filename, content, category, tags }) {
  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new AppError(
      `Unsupported file format "${ext || 'unknown'}". Supported formats: .txt, .md, .html, .json`,
      400,
      'UNSUPPORTED_FILE_FORMAT'
    );
  }

  if (content === undefined || content === null || String(content).trim() === '') {
    throw new AppError('Imported file content cannot be empty', 400, 'VALIDATION_ERROR');
  }

  let rawTitle = titleFromFilename(filename);
  let rawHtml = '';
  let rawCategory = category || 'General';
  let rawTags = tags || '';

  if (ext === '.json') {
    const jsonParsed = parseJsonFile(content, rawTitle, rawCategory, rawTags);
    rawTitle = jsonParsed.rawTitle;
    rawHtml = jsonParsed.rawHtml;
    rawCategory = jsonParsed.rawCategory;
    rawTags = jsonParsed.rawTags;
  } else if (ext === '.html') {
    const htmlParsed = parseHtmlFile(content);
    if (htmlParsed.rawTitle) {
      rawTitle = htmlParsed.rawTitle;
    }
    rawHtml = htmlParsed.rawHtml;
  } else {
    const textParsed = parseTextOrMdFile(content);
    if (textParsed.rawTitle) {
      rawTitle = textParsed.rawTitle;
    }
    rawHtml = textParsed.rawHtml;
  }

  const cleanTitle = sanitizePlainText(rawTitle) || 'Imported Note';
  const cleanContent = sanitizeRichContent(rawHtml) || '<p>Imported note</p>';
  const cleanCategory = sanitizePlainText(rawCategory) || 'General';
  const cleanTags = sanitizePlainText(rawTags);

  return {
    title: cleanTitle.slice(0, 255),
    content: cleanContent,
    category: cleanCategory.slice(0, 100),
    tags: cleanTags.slice(0, 255),
  };
}

module.exports = {
  ALLOWED_EXTENSIONS,
  parseImportedFile,
};
