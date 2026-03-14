export type Id = string;

export type StockLedgerEntryDTO = {
  _id: string;
  productId: string;
  warehouseId: string;
  operationType: string;
  quantityChange: number;
  referenceType: string;
  referenceId: string;
  referenceNumber?: string;
  userId?: string;
  notes?: string;
  createdAt: string;
};
