// src/hooks/useReceipts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { Receipt } from '@/types/models';

export const receiptKeys = {
  all:  ['receipts'] as const,
  list: (params: object) => [...receiptKeys.all, 'list', params] as const,
  one:  (id: string)    => [...receiptKeys.all, id] as const,
};

export function useReceipts(params: { status?: string; page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: receiptKeys.list(params),
    queryFn:  () => unwrap(api.get('/receipts', { params })),
  });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: receiptKeys.one(id),
    queryFn:  () => unwrap<Receipt>(api.get(`/receipts/${id}`)),
    enabled:  !!id,
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => unwrap(api.post('/receipts', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all }),
  });
}

export function useSubmitReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/receipts/${id}/submit`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all }),
  });
}

export function useApproveReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/receipts/${id}/approve`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: receiptKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useRejectReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/receipts/${id}/reject`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: receiptKeys.all }),
  });
}
