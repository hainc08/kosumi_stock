// src/pages/IssueNewPage.tsx
import { IssueForm } from '@/components/issue/IssueForm';
import { PageCard } from '@/components/shared/PeriodSelector';

export default function IssueNewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-black">Tạo Phiếu Xuất Kho</h1>
      <PageCard>
        <div className="p-5">
          <IssueForm />
        </div>
      </PageCard>
    </div>
  );
}
