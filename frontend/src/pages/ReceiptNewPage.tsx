// src/pages/ReceiptNewPage.tsx
import { ReceiptForm } from '@/components/receipt/ReceiptForm';
import { PageCard } from '@/components/shared/PeriodSelector';

export default function ReceiptNewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-black">Tạo Phiếu Nhập Kho</h1>
      <PageCard>
        <div className="p-5">
          <ReceiptForm />
        </div>
      </PageCard>
    </div>
  );
}
