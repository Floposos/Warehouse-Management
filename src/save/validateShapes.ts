import { productIds, type ProductId } from '../content/products';

export const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export const isProduct = (v: unknown): v is ProductId => productIds.includes(v as ProductId);
