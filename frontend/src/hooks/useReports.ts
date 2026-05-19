// src/hooks/useReports.ts
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export function useInventoryReport(year: number, month: number) {
  return useQuery({
    queryKey: ['reports', 'inventory-summary', year, month],
    queryFn: () => unwrap(api.get('/reports/inventory-summary', { params: { year, month } })),
    enabled: !!year && !!month,
  });
}

export function exportExcel(year: number, month: number) {
  const url = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/reports/export/excel?year=${year}&month=${month}`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TonKho_T${month}_${year}.xlsx`);
  // Token cần được gửi — trong production cân nhắc dùng blob download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
