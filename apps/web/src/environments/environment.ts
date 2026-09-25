export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api/v1';
    }
  }
  return 'https://mmedic-api.vercel.app/api/v1';
}

export const environment = {
  production: true,
  apiUrl: getApiBaseUrl(),
};
