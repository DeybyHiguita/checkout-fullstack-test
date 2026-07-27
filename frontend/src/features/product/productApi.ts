import { apiClient } from '../../shared/api/client';
import type { Product } from '../../shared/types';

export const productApi = {
  list: (): Promise<Product[]> => apiClient.get<Product[]>('/products'),
  getById: (id: string): Promise<Product> => apiClient.get<Product>(`/products/${id}`),
};
