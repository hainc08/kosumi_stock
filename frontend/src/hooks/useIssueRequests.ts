import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export const issueRequestKeys = {
  all: ['issue-requests'] as const,
  list: (params: object) => [...issueRequestKeys.all, 'list', params] as const,
  one: (id: string) => [...issueRequestKeys.all, id] as const,
};

export function useIssueRequests(params: { status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: issueRequestKeys.list(params),
    queryFn: async () => {
      const res = await api.get('/issue-requests', { params });
      return res.data as { success: true; data: any[]; meta?: { total: number; page: number; limit: number; totalPages: number } };
    },
  });
}

export function useIssueRequest(id: string) {
  return useQuery({
    queryKey: issueRequestKeys.one(id),
    queryFn: () => unwrap(api.get(`/issue-requests/${id}`)),
    enabled: !!id,
  });
}

export function useCreateIssueRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => unwrap(api.post('/issue-requests', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueRequestKeys.all }),
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.post(`/issue-requests/${id}/approve`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueRequestKeys.all }),
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectReason }: { id: string; rejectReason: string }) =>
      unwrap(api.post(`/issue-requests/${id}/reject`, { rejectReason })),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueRequestKeys.all }),
  });
}
