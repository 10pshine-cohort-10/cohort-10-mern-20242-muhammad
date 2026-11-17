import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link2,
} from 'lucide-react';
import { sanitizeLinkUrl } from '../../utils/helpers';

const ToolbarButton = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors duration-150 ${
      isActive
        ? 'bg-accent-soft text-accent'
        : 'text-muted hover:text-primary hover:bg-canvas'
    }`}
  >
    {children}
  </button>
);

ToolbarButton.propTypes = {
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  children: PropTypes.node,
  title: PropTypes.string,
};

const NoteEditor = ({ content = '', onChange, placeholder = 'Start typing your note...' }) => {
  const [linkError, setLinkError] = useState('');
  const sanitizedContent = DOMPurify.sanitize(content || '');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: sanitizedContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(DOMPurify.sanitize(content || ''));
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="h-64 border border-subtle rounded-lg bg-canvas animate-pulse" />;
  }

  const handleAddLink = () => {
    setLinkError('');
    const rawUrl = window.prompt('Enter URL (http://, https://, or mailto:):', 'https://');
    if (!rawUrl) return;
    const safeUrl = sanitizeLinkUrl(rawUrl);
    if (!safeUrl) {
      setLinkError('Invalid URL. Only http://, https://, and mailto: links are allowed.');
      return;
    }
    const anchorHtml = `<a href="${DOMPurify.sanitize(safeUrl)}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(safeUrl)}</a>`;
    if (editor.commands?.insertContent) {
      editor.commands.insertContent(anchorHtml);
    } else if (editor.commands?.setContent) {
      const current = editor.getHTML();
      editor.commands.setContent(`${current} ${anchorHtml}`);
    }
  };

  return (
    <div className="border border-subtle rounded-xl overflow-hidden bg-surface shadow-card focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-colors duration-150">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-subtle bg-canvas/60">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <div className="h-4 w-[1px] bg-subtle mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <div className="h-4 w-[1px] bg-subtle mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleAddLink}
          isActive={false}
          title="Insert Link"
        >
          <Link2 size={16} strokeWidth={1.75} />
        </ToolbarButton>
      </div>

      {linkError && (
        <div className="px-3 py-1.5 bg-danger-soft border-b border-danger/20 text-danger text-xs">
          {linkError}
        </div>
      )}

      {/* Editor Content */}
      <div className="p-3 bg-surface text-primary">
        <EditorContent editor={editor} className="min-h-[220px] focus:outline-none" />
      </div>
    </div>
  );
};

NoteEditor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

export default NoteEditor;
