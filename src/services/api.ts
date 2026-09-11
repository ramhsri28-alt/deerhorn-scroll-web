import { CatalogProduct, CartEvent, AdminSession } from '../types';
import { CATALOG_ITEMS } from '../data';

const ADMIN_TOKEN_KEY = 'deerhorn_admin_token';
const ADMIN_DATA_KEY = 'deerhorn_admin_data';

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export async function loginAdmin(email: string, password: string, adminId?: string): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, adminId }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.admin));
      return { success: true, admin: data.admin };
    }
    return { success: false, error: data.error || 'Authentication denied' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server connection failed' };
  }
}

export function getStoredAdminSession(): AdminSession | null {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const data = localStorage.getItem(ADMIN_DATA_KEY);
  if (token && data) {
    try {
      const parsed = JSON.parse(data);
      return { token, ...parsed };
    } catch {
      return null;
    }
  }
  return null;
}

export async function logoutAdmin(): Promise<void> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn('Logout notification:', e);
    }
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_DATA_KEY);
}

function getAdminAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// ==========================================
// LIVE CART ACTIVITY DISPATCH
// Whenever a user adds an item to cart, this is called!
// ==========================================

export async function sendCartEvent(params: {
  sessionId: string;
  userEmail?: string;
  action: 'added' | 'removed' | 'cleared';
  item: { id: string; name: string; price: number; quantity: number; image?: string; category?: string };
  currentCart: any[];
  cartTotal: number;
}): Promise<void> {
  try {
    await fetch('/api/cart/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.debug('Cart event sync fallback:', err);
  }
}

export async function fetchLiveCartEvents(): Promise<CartEvent[]> {
  try {
    const res = await fetch('/api/cart/events', {
      headers: getAdminAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.debug('Fetch events fallback:', err);
  }
  return [];
}

// ==========================================
// PRODUCTS & FEATURES MANAGEMENT
// ==========================================

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        return data.products;
      }
    }
  } catch (err) {
    console.debug('Fetch products fallback to local data:', err);
  }
  return CATALOG_ITEMS;
}

export async function createCatalogProduct(productData: Partial<CatalogProduct>): Promise<{ success: boolean; product?: CatalogProduct; error?: string }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(productData),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.error || 'Failed to create product' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateCatalogProduct(id: string, updates: Partial<CatalogProduct>): Promise<{ success: boolean; product?: CatalogProduct; error?: string }> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.error || 'Failed to update product' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteCatalogProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Failed to delete product' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
