import { AlertTriangle } from 'lucide-react';
import { useLowStock } from '@/hooks/useInventory';
import { Link } from 'react-router-dom';

type LowStockItem = {
  code: string;
  closingQty: number;
  unit: string;
};

export function StockAlert() {
  const { data } = useLowStock();
  const alerts = (data ?? []) as LowStockItem[];

  if (!alerts.length) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-5">
      <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-400">{alerts.length} mặt hàng tồn kho thấp hơn ngưỡng cảnh báo</p>
        <p className="text-xs text-[#8b949e] mt-0.5">
          {alerts
            .slice(0, 3)
            .map((a) => `${a.code} (còn ${a.closingQty} ${a.unit})`)
            .join(' · ')}
          {alerts.length > 3 && ` và ${alerts.length - 3} mặt hàng khác`}
        </p>
      </div>
      <Link to="/inventory" className="text-[11px] text-blue-400 hover:underline flex-shrink-0">
        Xem →
      </Link>
    </div>
  );
}
