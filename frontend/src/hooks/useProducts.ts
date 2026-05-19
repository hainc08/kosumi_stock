// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export const productKeys = {
  all:  ['products'] as const,
  list: (params: object) => [...productKeys.all, 'list', params] as const,
  units: ['products', 'units'] as const,
  categories: ['products', 'categories'] as const,
};

export function useProducts(params: { category?: string; search?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn:  () => unwrap(api.get('/products', { params })),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => unwrap(api.post('/products', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; [k: string]: unknown }) =>
      unwrap(api.put(`/products/${id}`, dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/products/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUnits(search?: string) {
  return useQuery({
    queryKey: [...productKeys.units, search ?? ''],
    queryFn: () => unwrap(api.get('/products/units', { params: { search } })),
  });
}

export function useCategories(search?: string) {
  return useQuery({
    queryKey: [...productKeys.categories, search ?? ''],
    queryFn: () => unwrap(api.get('/products/categories', { params: { search } })),
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { code: string; name: string }) => unwrap(api.post('/products/units', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.units }),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; code?: string; name?: string }) => unwrap(api.put(`/products/units/${id}`, dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.units }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/products/units/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.units }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { code: string; name: string }) => unwrap(api.post('/products/categories', dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; code?: string; name?: string }) =>
      unwrap(api.put(`/products/categories/${id}`, dto)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.delete(`/products/categories/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useImportProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return unwrap(api.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export async function downloadProductImportTemplate() {
  const res = await api.get('/products/template', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
