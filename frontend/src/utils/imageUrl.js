/**
 * Resolve full URL for images/uploads hosted on backend
 * @param {string} path - relative or absolute image path
 * @returns {string} full image URL
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const LIVE_BACKEND_URL = 'https://thesis-project-backend-mxhp.onrender.com';
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || LIVE_BACKEND_URL).replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

export default getImageUrl;
