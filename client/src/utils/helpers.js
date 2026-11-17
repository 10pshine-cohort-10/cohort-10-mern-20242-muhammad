import DOMPurify from 'dompurify';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  const plainText = sanitized.replace(/<[^>]+>/g, '').trim();
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
};

export const sanitizeLinkUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  return null;
};


