export type ApiEnvelope<T> = { data: T } | { error: string };

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export type CategoryDTO = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UnitDTO = {
  _id: string;
  name: string;
  symbol: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehouseDTO = {
  _id: string;
  name: string;
  location?: string;
  manager?: string;
  capacity?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
};

export type ProductDTO = {
  _id: string;
  name: string;
  sku: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
};

export type OperationDTO = {
  _id: string;
  type: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
  referenceNumber: string;
  status: 'draft' | 'ready' | 'done' | 'cancelled';
  warehouseId?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  date?: string;
  supplier?: string;
  customer?: string;
  notes?: string;
  createdBy?: string;
  items: Array<{ productId: string; quantity: number }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateOperationDTO = Omit<OperationDTO, '_id' | 'createdAt' | 'updatedAt'>;

export type StockBalanceDTO = { productId: string; warehouseId: string; quantity: number };

export type AuthUserDTO = {
  id: string;
  loginId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
};

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers ?? {}),
    },
    ...opts,
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!res.ok || 'error' in json) {
    const msg = 'error' in json ? json.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return (json as { data: T }).data;
}

export const api = {
  auth: {
    login: (body: { loginId: string; password: string }) =>
      request<AuthUserDTO>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    signup: (body: { loginId: string; email: string; fullName: string; password: string }) =>
      request<AuthUserDTO>('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  },
  categories: {
    list: () => request<CategoryDTO[]>('/api/categories'),
    create: (body: Omit<CategoryDTO, '_id'>) => request<CategoryDTO>('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Omit<CategoryDTO, '_id'>>) => request<CategoryDTO>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ ok: true }>(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  units: {
    list: () => request<UnitDTO[]>('/api/units'),
    create: (body: Omit<UnitDTO, '_id'>) => request<UnitDTO>('/api/units', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Omit<UnitDTO, '_id'>>) => request<UnitDTO>(`/api/units/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ ok: true }>(`/api/units/${id}`, { method: 'DELETE' }),
  },
  warehouses: {
    list: () => request<WarehouseDTO[]>('/api/warehouses'),
    create: (body: Omit<WarehouseDTO, '_id'>) =>
      request<WarehouseDTO>('/api/warehouses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Omit<WarehouseDTO, '_id'>>) =>
      request<WarehouseDTO>(`/api/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ ok: true }>(`/api/warehouses/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request<ProductDTO[]>('/api/products'),
    get: (id: string) => request<ProductDTO>(`/api/products/${id}`),
    create: (body: Omit<ProductDTO, '_id'>) => request<ProductDTO>('/api/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Omit<ProductDTO, '_id'>>) => request<ProductDTO>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<{ ok: true }>(`/api/products/${id}`, { method: 'DELETE' }),
  },
  operations: {
    list: (type?: OperationDTO['type']) => request<OperationDTO[]>(type ? `/api/operations?type=${encodeURIComponent(type)}` : '/api/operations'),
    create: (body: CreateOperationDTO) => request<OperationDTO>('/api/operations', { method: 'POST', body: JSON.stringify(body) }),
    post: (id: string) => request<{ op: OperationDTO; ledgerCount: number }>(`/api/operations/${id}/post`, { method: 'POST' }),
  },
  stock: {
    balance: (productId: string, warehouseId: string) =>
      request<StockBalanceDTO>(
        `/api/stock/balance?productId=${encodeURIComponent(productId)}&warehouseId=${encodeURIComponent(warehouseId)}`
      ),
    ledger: (params?: { productId?: string; warehouseId?: string; type?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.productId) qs.set('productId', params.productId);
      if (params?.warehouseId) qs.set('warehouseId', params.warehouseId);
      if (params?.type) qs.set('type', params.type);
      if (params?.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString();
      return request<any[]>(`/api/stock/ledger${suffix ? `?${suffix}` : ''}`);
    },
  },
};

export const hybrid = {
  enabled: import.meta.env.VITE_HYBRID_MODE === 'true',
  dbOnly: import.meta.env.VITE_DB_ONLY === 'true',
};
