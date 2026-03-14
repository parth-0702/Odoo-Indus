import {
  api,
  ProductDTO,
  WarehouseDTO,
  OperationDTO,
  CreateOperationDTO,
  CategoryDTO,
  UnitDTO,
} from '@/lib/api';

/**
 * Repository facade.
 *
 * Atlas-friendly: Always use the server API (MongoDB via Mongoose).
 */

export async function listWarehouses(): Promise<WarehouseDTO[]> {
  return api.warehouses.list();
}

export async function createWarehouse(body: Omit<WarehouseDTO, '_id'>): Promise<WarehouseDTO> {
  return api.warehouses.create(body);
}

export async function updateWarehouse(id: string, body: Partial<Omit<WarehouseDTO, '_id'>>): Promise<WarehouseDTO> {
  return api.warehouses.update(id, body);
}

export async function deleteWarehouse(id: string): Promise<void> {
  await api.warehouses.remove(id);
}

export async function listProducts(): Promise<ProductDTO[]> {
  return api.products.list();
}

export async function createProduct(body: Omit<ProductDTO, '_id'>): Promise<ProductDTO> {
  return api.products.create(body);
}

export async function updateProduct(id: string, body: Partial<Omit<ProductDTO, '_id'>>): Promise<ProductDTO> {
  return api.products.update(id, body);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.products.remove(id);
}

export async function getProduct(id: string): Promise<ProductDTO> {
  return api.products.get(id);
}

export async function listCategories(): Promise<CategoryDTO[]> {
  return api.categories.list();
}

export async function createCategory(body: Omit<CategoryDTO, '_id'>): Promise<CategoryDTO> {
  return api.categories.create(body);
}

export async function updateCategory(id: string, body: Partial<Omit<CategoryDTO, '_id'>>): Promise<CategoryDTO> {
  return api.categories.update(id, body);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.categories.remove(id);
}

export async function listUnits(): Promise<UnitDTO[]> {
  return api.units.list();
}

export async function createUnit(body: Omit<UnitDTO, '_id'>): Promise<UnitDTO> {
  return api.units.create(body);
}

export async function updateUnit(id: string, body: Partial<Omit<UnitDTO, '_id'>>): Promise<UnitDTO> {
  return api.units.update(id, body);
}

export async function deleteUnit(id: string): Promise<void> {
  await api.units.remove(id);
}

export async function listOperations(type?: OperationDTO['type']): Promise<OperationDTO[]> {
  return api.operations.list(type);
}

export async function createAndPostOperation(
  op: CreateOperationDTO
): Promise<{ op: OperationDTO; ledgerCount: number }> {
  const created = await api.operations.create(op);
  return api.operations.post(created._id);
}

export async function listStockLedger(params?: { productId?: string; warehouseId?: string; type?: string; limit?: number }): Promise<any[]> {
  return api.stock.ledger(params);
}
