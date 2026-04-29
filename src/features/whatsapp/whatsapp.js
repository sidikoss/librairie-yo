/**
 * Build WhatsApp URL for book orders
 * @param {Object} book - Book object
 * @returns {string} WhatsApp URL
 */
export function buildWhatsAppUrl(book) {
  if (!book) return '';
  
  const baseUrl = 'https://wa.me/224661862044';
  const message = `Bonjour, je souhaite commander le livre "${book.title}" par ${book.author}. Merci!`;
  const encodedMessage = encodeURIComponent(message);
    
  return `${baseUrl}?text=${encodedMessage}`;
}
