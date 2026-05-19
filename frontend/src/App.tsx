// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';

import LoginPage       from '@/pages/LoginPage';
import DashboardPage   from '@/pages/DashboardPage';
import InventoryPage   from '@/pages/InventoryPage';
import ProductsPage    from '@/pages/ProductsPage';
import ReceiptsPage    from '@/pages/ReceiptsPage';
import ReceiptNewPage  from '@/pages/ReceiptNewPage';
import IssuesPage      from '@/pages/IssuesPage';
import IssueNewPage    from '@/pages/IssueNewPage';
import IssueRequestsPage from '@/pages/IssueRequestsPage';
import IssueRequestNewPage from '@/pages/IssueRequestNewPage';
import ApprovalPage from '@/pages/ApprovalPage';
import ReportsPage     from '@/pages/ReportsPage';
import RolesPage       from '@/pages/RolesPage';
import UsersPage       from '@/pages/UsersPage';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[#6e7681]">
      <p className="text-6xl font-black mb-3">404</p>
      <p className="text-sm">Trang không tồn tại</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/inventory"   element={<InventoryPage />} />
            <Route path="/products"    element={<ProductsPage />} />
            <Route path="/receipts"    element={<ReceiptsPage />} />
            <Route path="/receipts/new" element={<ReceiptNewPage />} />
            <Route path="/issues"      element={<IssuesPage />} />
            <Route path="/issues/new"  element={<IssueNewPage />} />
            <Route path="/my-requests" element={<IssueRequestsPage />} />
            <Route path="/my-requests/new" element={<IssueRequestNewPage />} />
            <Route path="/approvals" element={<ApprovalPage />} />
            <Route path="/reports"     element={<ReportsPage />} />
            <Route path="/users"       element={<UsersPage />} />
            <Route path="/roles"       element={<RolesPage />} />
            <Route path="*"            element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
