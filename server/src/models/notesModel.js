'use strict';

const { query } = require('../config/db');

let columnsEnsured = false;

/**
 * Automatically add optional columns (category, tags, is_favorite) if missing on an existing table.
 */
async function ensureOptionalColumns() {
  if (columnsEnsured) return;
  // Note: IF NOT EXISTS is NOT supported in MySQL 8.x for ALTER TABLE ADD COLUMN.
  // Plain ADD COLUMN is used; duplicate-column errors (ER_DUP_FIELDNAME) are ignored below.
  const statements = [
    "ALTER TABLE notes ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General'",
    "ALTER TABLE notes ADD COLUMN tags VARCHAR(255) NOT NULL DEFAULT ''",
    'ALTER TABLE notes ADD COLUMN is_favorite TINYINT(1) NOT NULL DEFAULT 0',
  ];
  for (const sql of statements) {
    try {
      await query(sql, []);
    } catch (err) {
      // ER_DUP_FIELDNAME: column already exists — safe to ignore and continue
      if (!err || err.code !== 'ER_DUP_FIELDNAME') {
        throw err; // propagate unexpected errors (syntax, permissions, etc.)
      }
    }
  }
  // Only mark as complete after ALL columns are confirmed present
  columnsEnsured = true;
}

/**
 * Execute query with automatic one-time column migration fallback if ER_BAD_FIELD_ERROR occurs.
 */
async function runWithSchemaFallback(sql, params) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err && err.code === 'ER_BAD_FIELD_ERROR' && !columnsEnsured) {
      await ensureOptionalColumns();
      return query(sql, params);
    }
    throw err;
  }
}

/**
 * Strip HTML tags to produce plain text
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const SELECT_COLUMNS =
  'id, user_id, title, content, content_text, category, tags, is_pinned, is_favorite, created_at, updated_at';

/**
 * Create a new note and return the full note row.
 */
async function create({
  user_id,
  title,
  content,
  content_text,
  category = 'General',
  tags = '',
  is_pinned = 0,
  is_favorite = 0,
}) {
  try {
    const plainText = content_text !== undefined ? content_text : stripHtml(content);
    const [result] = await runWithSchemaFallback(
      'INSERT INTO notes (user_id, title, content, content_text, category, tags, is_pinned, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, title, content, plainText, category || 'General', tags || '', is_pinned || 0, is_favorite || 0]
    );
    const [rows] = await runWithSchemaFallback(
      `SELECT ${SELECT_COLUMNS} FROM notes WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return rows[0];
  } catch (err) {
    throw err;
  }
}

/**
 * Find all notes for a user with optional filtering and sorting.
 * @param {number} userId
 * @param {{ search?: string, pinned?: string, favorite?: string, category?: string, tag?: string, sort?: string }} options
 * @returns {Promise<Array>}
 */
async function findAllByUser(userId, { search, pinned, favorite, category, tag, sort } = {}) {
  try {
    let sql = `SELECT ${SELECT_COLUMNS} FROM notes WHERE user_id = ?`;
    const params = [userId];

    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR content_text LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    if (pinned === 'true') {
      sql += ' AND is_pinned = 1';
    }

    if (favorite === 'true') {
      sql += ' AND is_favorite = 1';
    }

    if (category?.trim()) {
      sql += ' AND category = ?';
      params.push(category.trim());
    }

    if (tag?.trim()) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag.trim()}%`);
    }

    if (sort === 'oldest' || sort === 'updated_asc') {
      sql += ' ORDER BY is_pinned DESC, updated_at ASC';
    } else if (sort === 'created_desc') {
      sql += ' ORDER BY is_pinned DESC, created_at DESC';
    } else if (sort === 'created_asc') {
      sql += ' ORDER BY is_pinned DESC, created_at ASC';
    } else if (sort === 'title') {
      sql += ' ORDER BY is_pinned DESC, title ASC';
    } else {
      sql += ' ORDER BY is_pinned DESC, updated_at DESC';
    }

    const [rows] = await runWithSchemaFallback(sql, params);
    return rows;
  } catch (err) {
    throw err;
  }
}

/**
 * Find a single note by id and userId.
 */
async function findById(id, userId) {
  try {
    const [rows] = await runWithSchemaFallback(
      `SELECT ${SELECT_COLUMNS} FROM notes WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
}

/**
 * Update a note dynamically by provided fields.
 */
async function update(id, userId, fields) {
  try {
    const allowedFields = [
      'title',
      'content',
      'content_text',
      'category',
      'tags',
      'is_pinned',
      'is_favorite',
    ];
    const setClauses = [];
    const params = [];

    const updatedFields = { ...fields };
    if (updatedFields.content !== undefined && updatedFields.content_text === undefined) {
      updatedFields.content_text = stripHtml(updatedFields.content);
    }

    for (const field of allowedFields) {
      if (updatedFields[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(updatedFields[field]);
      }
    }

    setClauses.push('updated_at = NOW()');
    params.push(id, userId);

    await runWithSchemaFallback(
      `UPDATE notes SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    const [rows] = await runWithSchemaFallback(
      `SELECT ${SELECT_COLUMNS} FROM notes WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0];
  } catch (err) {
    throw err;
  }
}

/**
 * Delete a note by id and userId.
 */
async function deleteById(id, userId) {
  try {
    await runWithSchemaFallback('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  create,
  findAllByUser,
  findById,
  update,
  deleteById,
  stripHtml,
};
