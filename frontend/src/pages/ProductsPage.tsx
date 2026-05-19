import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { PageCard, Spinner, EmptyState } from '@/components/shared/PeriodSelector';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { UnitFormModal } from '@/components/products/UnitFormModal';
import { CategoryFormModal } from '@/components/products/CategoryFormModal';
import {
  downloadProductImportTemplate,
  useCategories,
  useDeleteCategory,
  useDeleteProduct,
  useDeleteUnit,
  useImportProducts,
  useProducts,
  useUnits,
} from '@/hooks/useProducts';
import type { Product } from '@/types/models';

// ─── types ────────────────────────────────────────────────────────────────────

type Tab = 'products' | 'units' | 'categories';

interface DeleteTarget { id: string; name: string }

// ─── shared Tailwind constants ─────────────────────────────────────────────────

const SELECT_CLS =
  'bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';
const SEARCH_INPUT_CLS =
  'bg-[#21262d] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors w-44 sm:w-56';
const ACTION_BTN =
  'p-1.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors';
const DELETE_BTN =
  'p-1.5 rounded bg-[#2a1216] border border-[#5b1b26] text-red-400 hover:text-red-300 transition-colors';

// ─── ProductListTab ────────────────────────────────────────────────────────────

function ProductListTab() {
  const [search, setSearch]               = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'true' | 'false' | ''>('true');
  const [categoryFilter, setCategoryFilter] = useState('');

  // modal state
  const [productModal, setProductModal] = useState<{ open: boolean; product?: Product | null }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useProducts({
    search: search || undefined,
    isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    category: categoryFilter || undefined,
  });
  const { data: unitsRaw }      = useUnits();
  const { data: categoriesRaw } = useCategories();

  const products:    Product[] = useMemo(() => (data as any)?.data ?? data ?? [], [data]);
  const units:       any[]     = useMemo(() => (unitsRaw as any)?.data ?? unitsRaw ?? [], [unitsRaw]);
  const categories:  any[]     = useMemo(() => (categoriesRaw as any)?.data ?? categoriesRaw ?? [], [categoriesRaw]);

  const deleteMut = useDeleteProduct();
  const importMut = useImportProducts();
  const importResult = importMut.data as any;

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? 'Xóa thất bại');
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importMut.mutateAsync(file);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? 'Import thất bại');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-4">
      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setProductModal({ open: true, product: null })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={13} /> Thêm vật tư
        </button>
        <button
          onClick={downloadProductImportTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-xs font-semibold text-[#e6edf3] hover:bg-[#2b3242] transition-colors"
        >
          <Download size={13} />
          <span className="hidden sm:inline">Tải template</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importMut.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-xs font-semibold text-[#e6edf3] hover:bg-[#2b3242] disabled:opacity-60 transition-colors"
        >
          <Upload size={13} />
          <span className="hidden sm:inline">{importMut.isPending ? 'Đang import...' : 'Import Excel'}</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="px-3 py-2 rounded-md border border-[#30363d] bg-[#161b22] text-xs text-[#8b949e]">
          Kết quả import: tạo mới{' '}
          <span className="text-green-400 font-semibold">{importResult.created ?? 0}</span>, cập nhật{' '}
          <span className="text-blue-400 font-semibold">{importResult.updated ?? 0}</span>, lỗi{' '}
          <span className="text-red-400 font-semibold">{importResult.failed ?? 0}</span>
        </div>
      )}

      <PageCard>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#30363d] bg-[#1c2333]">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value as any)}
            className={SELECT_CLS}
          >
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã vô hiệu</option>
            <option value="">Tất cả trạng thái</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">Tất cả nhóm</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã, tên hàng..."
              className={SEARCH_INPUT_CLS}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Mã hàng', 'Tên hàng', 'ĐVT', 'Nhóm hàng', 'Tồn tối thiểu', 'Trạng thái', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Spinner className="mx-auto text-[#6e7681]" />
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-red-400">
                    Lỗi khi tải dữ liệu. Vui lòng thử lại.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && products.map((p: any) => (
                <tr key={p.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {p.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8b949e]">{p.unit}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8b949e]">{p.category ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-center">{p.minStock}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                        p.isActive
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-[#21262d] text-[#6e7681]'
                      }`}
                    >
                      {p.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setProductModal({ open: true, product: p })}
                        className={ACTION_BTN}
                        title="Sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                        className={DELETE_BTN}
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && products.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="Không tìm thấy vật tư nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* Modals */}
      <ProductFormModal
        open={productModal.open}
        product={productModal.product}
        units={units}
        categories={categories}
        onClose={() => setProductModal({ open: false })}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa vật tư?"
        message={`Bạn chắc chắn muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ─── UnitsTab ──────────────────────────────────────────────────────────────────

function UnitsTab() {
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState<{ open: boolean; unit?: any }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const { data, isLoading, isError } = useUnits(search || undefined);
  const units: any[] = useMemo(() => (data as any)?.data ?? data ?? [], [data]);

  const deleteMut = useDeleteUnit();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? 'Xóa đơn vị thất bại');
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã, tên đơn vị..."
            className={`w-full ${SEARCH_INPUT_CLS}`}
          />
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={13} /> Thêm đơn vị
        </button>
      </div>

      <PageCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Mã đơn vị', 'Tên đơn vị', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <Spinner className="mx-auto text-[#6e7681]" />
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-sm text-red-400">
                    Lỗi khi tải dữ liệu. Vui lòng thử lại.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && units.map((u: any) => (
                <tr key={u.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400">{u.code}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">{u.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModal({ open: true, unit: u })}
                        className={ACTION_BTN}
                        title="Sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                        className={DELETE_BTN}
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && units.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <EmptyState message="Chưa có đơn vị tính nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <UnitFormModal
        open={modal.open}
        unit={modal.unit ?? null}
        onClose={() => setModal({ open: false })}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa đơn vị tính?"
        message={`Bạn chắc chắn muốn xóa đơn vị "${deleteTarget?.name}"?`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ─── CategoriesTab ─────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState<{ open: boolean; category?: any }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const { data, isLoading, isError } = useCategories(search || undefined);
  const categories: any[] = useMemo(() => (data as any)?.data ?? data ?? [], [data]);

  const deleteMut = useDeleteCategory();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? 'Xóa nhóm hàng thất bại');
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã, tên nhóm hàng..."
            className={`w-full ${SEARCH_INPUT_CLS}`}
          />
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={13} /> Thêm nhóm hàng
        </button>
      </div>

      <PageCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c2333]">
                {['Mã nhóm', 'Tên nhóm hàng', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <Spinner className="mx-auto text-[#6e7681]" />
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-sm text-red-400">
                    Lỗi khi tải dữ liệu. Vui lòng thử lại.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && categories.map((c: any) => (
                <tr key={c.id} className="border-t border-[#30363d] hover:bg-[#1c2333]/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-blue-400">{c.code}</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">{c.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModal({ open: true, category: c })}
                        className={ACTION_BTN}
                        title="Sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                        className={DELETE_BTN}
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && categories.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <EmptyState message="Chưa có nhóm hàng nào" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <CategoryFormModal
        open={modal.open}
        category={modal.category ?? null}
        onClose={() => setModal({ open: false })}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa nhóm hàng?"
        message={`Bạn chắc chắn muốn xóa nhóm "${deleteTarget?.name}"?`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'products',   label: 'Vật Tư / Hàng Hóa' },
  { id: 'units',      label: 'Đơn Vị Tính' },
  { id: 'categories', label: 'Nhóm Hàng' },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-black">Vật Tư / Hàng Hóa</h1>
        <p className="text-xs text-[#6e7681] mt-0.5">Quản lý danh mục vật tư, đơn vị tính và nhóm hàng</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-[#30363d] flex gap-0 overflow-x-auto mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-orange-500 text-[#e6edf3]'
                : 'border-transparent text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'products'   && <ProductListTab />}
      {activeTab === 'units'      && <UnitsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
    </div>
  );
}
