import { PageCard } from '@/components/shared/PeriodSelector';
import { IssueRequestForm } from '@/components/issue-request/IssueRequestForm';

export default function IssueRequestNewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Gui yeu cau xuat kho</h1>
      <PageCard>
        <IssueRequestForm />
      </PageCard>
    </div>
  );
}
