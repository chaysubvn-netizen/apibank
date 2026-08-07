export const API_URL =
  process.env.NEXT_PUBLIC_PHP_API_URL || 'https://gateway.spay5s.com/api/v1/bank';

export type ApiOptions = RequestInit & { authenticated?: boolean };

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (
    options.body &&
    !(typeof FormData !== 'undefined' && options.body instanceof FormData) &&
    !headers.has('Content-Type')
  )
    headers.set('Content-Type', 'application/json');
  if (options.authenticated !== false && typeof window !== 'undefined') {
    // Both Next.js versions can share token logic or use next.php's token
    const token =
      localStorage.getItem('apibank_token') ||
      localStorage.getItem('spay5s_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('X-API-Token', token);
    }
  }

  let response: Response;
  try {
    // Map REST Laravel /path to ?action=path
    const action = path.replace(/^\//, '');
    const isQuery = action.includes('?');
    const fullUrl = `${API_URL}?action=${isQuery ? action.replace('?', '&') : action}`;

    response = await fetch(fullUrl, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new Error(`Không thể kết nối API tại backend PHP.`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === 'error') {
    const validation = payload.errors
      ? Object.values(payload.errors).flat().join(' ')
      : '';
    throw new Error(
      validation ||
        payload.message ||
        payload.msg ||
        'Không thể kết nối máy chủ.'
    );
  }

  // Unwrap if wrapped in { status: 'success', data: ... }
  if (payload.status === 'success' && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export { formatCurrency as formatMoney } from '@/lib/currency';
