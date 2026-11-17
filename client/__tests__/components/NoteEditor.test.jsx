import React from 'react';
import { render, screen } from '@testing-library/react';
import NoteEditor from '../../src/components/notes/NoteEditor';
import DOMPurify from 'dompurify';

// Mock TipTap dependencies
jest.mock('@tiptap/react', () => ({
  useEditor: ({ content }) => ({
    getHTML: () => content || '<p>Editor content</p>',
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: jest.fn() }),
        toggleItalic: () => ({ run: jest.fn() }),
        toggleStrike: () => ({ run: jest.fn() }),
        toggleHeading: () => ({ run: jest.fn() }),
        toggleBulletList: () => ({ run: jest.fn() }),
        toggleOrderedList: () => ({ run: jest.fn() }),
        toggleCodeBlock: () => ({ run: jest.fn() })
      })
    }),
    isActive: () => false,
    commands: {
      setContent: jest.fn()
    },
    isFocused: false
  }),
  EditorContent: () => <div data-testid="editor-content">Mock Editor Area</div>
}));

jest.mock('@tiptap/starter-kit', () => ({}));
jest.mock('@tiptap/extension-placeholder', () => ({
  configure: () => ({})
}));

describe('NoteEditor Component', () => {
  it('renders toolbar buttons and editor area', () => {
    render(<NoteEditor content="<p>Test</p>" onChange={jest.fn()} />);

    expect(screen.getByTitle(/Bold/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 1/i)).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  describe('Security & XSS Sanitization', () => {
    it('sanitizes malicious script tags and event handlers via DOMPurify', () => {
      const maliciousPayload = '<p>Safe Text</p><script>alert("xss")</script><img src="x" onerror="alert(1)" />';
      const spySanitize = jest.spyOn(DOMPurify, 'sanitize');

      render(<NoteEditor content={maliciousPayload} onChange={jest.fn()} />);

      expect(spySanitize).toHaveBeenCalledWith(maliciousPayload);

      // Verify DOMPurify strips <script> and malicious attributes
      const sanitizedOutput = DOMPurify.sanitize(maliciousPayload);
      expect(sanitizedOutput).not.toContain('<script>');
      expect(sanitizedOutput).not.toContain('onerror');
      expect(sanitizedOutput).toContain('<p>Safe Text</p>');

      spySanitize.mockRestore();
    });
  });
});
