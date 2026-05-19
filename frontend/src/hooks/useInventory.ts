// src/hooks/useInventory.ts
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export const inventoryKeys = {
  all:     ['inventory'] as const,
  list:    (params: object) => [...inventoryKeys.all, 'list', params] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
  low:     () => [...inventoryKeys.all, 'low-stock'] as const,
};

export function useInventory(params: { year?: number; month?: number; category?: string; search?: string }) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn:  () => unwrap(api.get('/inventory', { params })),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn:  () => unwrap(api.get('/inventory/summary')),
    refetchInterval: 60_000,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.low(),
    queryFn:  () => unwrap(api.get('/inventory/low-stock')),
  });
}
