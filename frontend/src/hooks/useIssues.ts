// src/hooks/useIssues.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { Issue } from '@/types/models';

export const issueKeys = {
  all:  ['issues'] as const,
  list: (params: object) => [...issueKeys.all, 'list', params] as const,
  one:  (id: string)    => [...issueKeys.all, id] as const,
};

export function useIssues(params: { status?: string; page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: issueKeys.list(params),
    queryFn:  () => unwrap(api.get('/issues', { params })),
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: issueKeys.one(id),
    queryFn:  () => unwrap<Issue>(api.get(`/issues/${id}`)),
    enabled:  !!id,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => unwrap(api.post('/issues', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
}

export function useSubmitIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/issues/${id}/submit`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
}

export function useApproveIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/issues/${id}/approve`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
}

export function useConfirmIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: { itemId: string; actualQty: number }[] }) =>
      unwrap(api.post(`/issues/${id}/confirm`, { items })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useRejectIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/issues/${id}/reject`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
}
