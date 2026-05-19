import { useMemo, useState } from 'react';
import { ChevronRight, Download, Search, X } from 'lucide-react';
import { PageCard, PeriodSelector, Spinner, EmptyState } from '@/components/shared/PeriodSelector';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Permission } from '@/types/roles';
import { useInventoryReport, exportExcel } from '@/hooks/useReports';
import { useProducts, useCategories } from '@/hooks/useProducts';

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK' | 'NO_MOVEMENT' | 'NEGATIVE';

interface ReportRow {
  code:       string;
  name:       string;
  unit:       string;
  openingQty: number;
  receiptQty: number;
  issueQty:   number;
  closingQty: number;
}

interface EnrichedRow extends ReportRow {
  minStock: number;
  category: string;
  status:   StockStatus;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<StockStatus, { label: string; cls: string; dot: string; rowCls: string }> = {
  IN_STOCK:     { label: 'Còn hàng',        cls: 'bg-green-500/15 text-green-400',   dot: 'bg-green-400',  rowCls: 'hover:bg-[#1c2333]/40' },
  LOW:          { label: 'Sắp hết hàng',    cls: 'bg-amber-500/15 text-amber-400',   dot: 'bg-amber-400',  rowCls: 'bg-amber-500/5 hover:bg-amber-500/10' },
  OUT_OF_STOCK: { label: 'Hết hàng',        cls: 'bg-red-500/15 text-red-400',       dot: 'bg-red-400',    rowCls: 'bg-red-500/5 hover:bg-red-500/10' },
  NO_MOVEMENT:  { label: 'Không phát sinh', cls: 'bg-[#21262d] text-[#6e7681]',      dot: 'bg-[#484f58]',  rowCls: 'opacity-60 hover:opacity-100' },
  NEGATIVE:     { label: 'Âm kho',          cls: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400', rowCls: 'bg-purple-500/5 hover:bg-purple-500/10' },
};

const STATUS_ACTION: Record<StockStatus, string> = {
  IN_STOCK:     'Theo dõi',
  LOW:          'Cần nhập hàng',
  OUT_OF_STOCK: 'Nhập hàng ngay',
  NO_MOVEMENT:  'Kiểm tra hàng',
  NEGATIVE:     'Kiểm tra số liệu',
};

const STATUS_FILTER_OPTS: { value: StockStatus | ''; label: string }[] = [
  { value: '',             label: 'Tất cả trạng thái' },
  { value: 'IN_STOCK',     label: '🟢 Còn hàng' },
  { value: 'LOW',          label: '🟡 Sắp hết hàng' },
  { value: 'OUT_OF_STOCK', label: '🔴 Hết hàng' },
  { value: 'NO_MOVEMENT',  label: '⚪ Không phát sinh' },
  { value: 'NEGATIVE',     label: '🟣 Âm kho' },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function computeStatus(row: ReportRow, minStock: number): StockStatus {
  if (row.closingQty < 0)                                      return 'NEGATIVE';
  if (row.closingQty === 0)                                    return 'OUT_OF_STOCK';
  if (row.receiptQty === 0 && row.issueQty === 0)              return 'NO_MOVEMENT';
  if (minStock > 0 && row.closingQty <= minStock)              return 'LOW';
  return 'IN_STOCK';
}

function fmt(n: number): string {
  return n.toLocaleString('vi-VN');
}

function closingCls(row: EnrichedRow): string {
  if (row.closingQty < 0)             return 'text-purple-400 font-bold';
  if (row.closingQty === 0)           return 'text-red-400 font-bold';
  if (row.status === 'LOW')           return 'text-amber-400 font-bold';
  return 'text-orange-400 font-semibold';
}

// ─── StockStatusBadge ─────────────────────────────────────────────────────────

function StockStatusBadge({ status }: { status: StockStatus }) {
  const { label, cls, dot } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, colorCls, active, onClick,
}: {
  label: string; value: number; colorCls: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#161b22] border rounded-xl p-4 text-left w-full transition-all ${
        active
          ? 'border-orange-500/60 ring-1 ring-orange-500/30 shadow-sm'
          : 'border-[#30363d] hover:border-[#8b949e]'
      }`}
    >
      <p className={`text-2xl font-black font-mono leading-none ${colorCls}`}>{value}</p>
      <p className="text-[11px] text-[#6e7681] mt-1.5 leading-tight">{label}</p>
    </button>
  );
}

// ─── ItemDetailDrawer ─────────────────────────────────────────────────────────

function ItemDetailDrawer({
  open, onClose, row, month, year,
}: {
  open: boolean; onClose: () => void; row: EnrichedRow | null; month: number; year: number;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#161b22] border-l border-[#30363d] z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {row && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-[#30363d] flex-shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {row.code}
                  </span>
                  <StockStatusBadge status={row.status} />
                </div>
                <p className="text-sm font-semibold leading-snug">{row.name}</p>
                <p className="text-[11px] text-[#6e7681] mt-0.5">Kỳ T{month}/{year} · {row.unit}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 ml-3 flex-shrink-0 rounded-md text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Alert banner */}
              {(row.status === 'NEGATIVE' || row.status === 'OUT_OF_STOCK' || row.status === 'LOW') && (
                <div className={`rounded-lg px-4 py-3 text-xs font-semibold ${
                  row.status === 'NEGATIVE'     ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' :
                  row.status === 'OUT_OF_STOCK' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                                  'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {row.status === 'NEGATIVE'     && '⚠ Tồn kho âm — cần kiểm tra lại phiếu nhập/xuất'}
                  {row.status === 'OUT_OF_STOCK' && '⚠ Hết hàng — cần lập phiếu nhập kho ngay'}
                  {row.status === 'LOW'          && '⚠ Sắp hết hàng — nên chuẩn bị đặt hàng'}
                </div>
              )}

              {/* Product info grid */}
              <section>
                <p className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest mb-2">
                  Thông tin vật tư
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Đơn vị tính',    value: row.unit },
                    { label: 'Nhóm hàng',      value: row.category || '—' },
                    { label: 'Tồn tối thiểu',  value: row.minStock > 0 ? `${fmt(row.minStock)} ${row.unit}` : 'Chưa đặt' },
                    { label: 'Đề xuất',        value: STATUS_ACTION[row.status] },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0d1117] rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-[#6e7681] mb-0.5">{label}</p>
                      <p className="text-sm font-semibold truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Movement breakdown */}
              <section>
                <p className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest mb-2">
                  Phát sinh kỳ T{month}/{year}
                </p>
                <div className="bg-[#0d1117] rounded-lg overflow-hidden text-sm">
                  {[
                    { label: 'Tồn đầu kỳ',       value: row.openingQty, cls: 'text-[#e6edf3]',  sym: '' },
                    { label: '+ Nhập trong kỳ',   value: row.receiptQty, cls: 'text-green-400', sym: '+' },
                    { label: '− Xuất trong kỳ',   value: row.issueQty,   cls: 'text-red-400',   sym: '−' },
                  ].map(({ label, value, cls, sym }) => (
                    <div key={label} className="flex justify-between items-center px-4 py-2.5 border-b border-[#21262d]">
                      <span className="text-[#8b949e]">{label}</span>
                      <span className={`font-mono font-semibold ${cls}`}>
                        {sym && value > 0 ? `${sym} ` : ''}{fmt(value)} {row.unit}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="font-bold text-sm">= Tồn cuối kỳ</span>
                    <span className={`font-mono text-base font-black ${closingCls(row)}`}>
                      {fmt(row.closingQty)} {row.unit}
                    </span>
                  </div>
                </div>
              </section>

              {/* Min-stock analysis */}
              {row.minStock > 0 && (
                <section>
                  <p className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest mb-2">
                    Phân tích tồn kho
                  </p>
                  <div className="bg-[#0d1117] rounded-lg px-4 py-3 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8b949e]">Mức tối thiểu</span>
                      <span className="font-mono font-semibold">{fmt(row.minStock)} {row.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8b949e]">Tồn cuối kỳ</span>
                      <span className={`font-mono font-semibold ${closingCls(row)}`}>
                        {fmt(row.closingQty)} {row.unit}
                      </span>
                    </div>
                    {row.closingQty > 0 && (
                      <div>
                        {/* Progress bar: closingQty vs 3× minStock scale */}
                        <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              row.closingQty <= row.minStock ? 'bg-amber-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((row.closingQty / Math.max(row.minStock * 3, row.closingQty)) * 100))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#6e7681] mt-1.5">
                          {row.closingQty > row.minStock
                            ? `Còn dư ${fmt(row.closingQty - row.minStock)} ${row.unit} so với mức tối thiểu`
                            : `Thiếu ${fmt(row.minStock - row.closingQty)} ${row.unit} so với mức tối thiểu`}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date();

  // Period state
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Filter state
  const [search,         setSearch]        = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter,   setStatusFilter]  = useState<StockStatus | ''>('');
  const [activeCard,     setActiveCard]    = useState<StockStatus | 'all' | null>(null);

  // Drawer state
  const [drawerRow, setDrawerRow] = useState<EnrichedRow | null>(null);

  // Data fetching
  const { data: reportData, isLoading, isError } = useInventoryReport(year, month) as {
    data: any; isLoading: boolean; isError: boolean;
  };
  const { data: productsData  } = useProducts() as { data: any };
  const { data: categoriesRaw } = useCategories() as { data: any };

  // Raw data
  const rawRows:    ReportRow[] = useMemo(() => reportData?.rows ?? [], [reportData]);
  const products:   any[]       = useMemo(() => (productsData as any)?.data ?? productsData ?? [], [productsData]);
  const categories: any[]       = useMemo(() => (categoriesRaw as any)?.data ?? categoriesRaw ?? [], [categoriesRaw]);

  // Enrich: join report rows with product minStock + category
  const enrichedRows: EnrichedRow[] = useMemo(() => {
    const pMap = new Map<string, any>(products.map((p: any) => [p.code, p]));
    return rawRows.map((row) => {
      const p        = pMap.get(row.code);
      const minStock = Number(p?.minStock ?? 0);
      const category = (p?.category as string) ?? '';
      const status   = computeStatus(row, minStock);
      return { ...row, minStock, category, status };
    });
  }, [rawRows, products]);

  // Summary counts (always on ALL rows, not filtered)
  const stats = useMemo(() => ({
    total:      enrichedRows.length,
    inStock:    enrichedRows.filter((r) => r.status === 'IN_STOCK').length,
    low:        enrichedRows.filter((r) => r.status === 'LOW').length,
    outOfStock: enrichedRows.filter((r) => r.status === 'OUT_OF_STOCK').length,
    noMovement: enrichedRows.filter((r) => r.status === 'NO_MOVEMENT').length,
    negative:   enrichedRows.filter((r) => r.status === 'NEGATIVE').length,
  }), [enrichedRows]);

  // Unique category values actually present in this period's data
  const reportCategories = useMemo(() => {
    const seen = new Set<string>();
    enrichedRows.forEach((r) => { if (r.category) seen.add(r.category); });
    return Array.from(seen).sort();
  }, [enrichedRows]);

  // Client-side filtered rows
  const filteredRows: EnrichedRow[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const effectiveStatus: StockStatus | '' =
      activeCard && activeCard !== 'all' ? (activeCard as StockStatus) : statusFilter;

    return enrichedRows.filter((row) => {
      if (q && !row.code.toLowerCase().includes(q) && !row.name.toLowerCase().includes(q)) return false;
      if (categoryFilter && row.category !== categoryFilter) return false;
      if (effectiveStatus && row.status !== effectiveStatus) return false;
      return true;
    });
  }, [enrichedRows, search, categoryFilter, statusFilter, activeCard]);

  // Column totals for footer
  const totals = useMemo(() => ({
    opening: filteredRows.reduce((s, r) => s + r.openingQty, 0),
    receipt: filteredRows.reduce((s, r) => s + r.receiptQty, 0),
    issue:   filteredRows.reduce((s, r) => s + r.issueQty,   0),
    closing: filteredRows.reduce((s, r) => s + r.closingQty, 0),
  }), [filteredRows]);

  const hasFilters = !!(activeCard || statusFilter || categoryFilter || search);

  function handleCardClick(key: StockStatus | 'all') {
    setActiveCard((prev) => (prev === key ? null : key));
    setStatusFilter('');
  }

  function clearFilters() {
    setActiveCard(null);
    setStatusFilter('');
    setCategoryFilter('');
    setSearch('');
  }

  // ── Summary card definitions ──
  const CARDS = [
    { key: 'all'         as const, label: 'Tất cả mặt hàng', value: stats.total,      colorCls: 'text-[#e6edf3]' },
    { key: 'IN_STOCK'    as const, label: 'Còn hàng',         value: stats.inStock,    colorCls: 'text-green-400' },
    { key: 'LOW'         as const, label: 'Sắp hết hàng',     value: stats.low,        colorCls: 'text-amber-400' },
    { key: 'OUT_OF_STOCK'as const, label: 'Hết hàng',         value: stats.outOfStock, colorCls: 'text-red-400' },
    { key: 'NO_MOVEMENT' as const, label: 'Không phát sinh',  value: stats.noMovement, colorCls: 'text-[#6e7681]' },
    { key: 'NEGATIVE'    as const, label: 'Âm kho',           value: stats.negative,   colorCls: 'text-purple-400' },
  ];

  const SELECT_CLS = 'bg-[#21262d] border border-[#30363d] rounded-md px-2.5 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors';

  return (
    <div className="space-y-5">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black">Báo Cáo Tồn Kho</h1>
        <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <RoleGuard permission={Permission.REPORT_EXPORT}>
          <button
            onClick={() => exportExcel(year, month)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </RoleGuard>
      </div>

      {/* ── Summary cards (hidden while loading or no data) ── */}
      {!isLoading && enrichedRows.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {CARDS.map(({ key, label, value, colorCls }) => (
            <SummaryCard
              key={key}
              label={label}
              value={value}
              colorCls={colorCls}
              active={activeCard === key}
              onClick={() => handleCardClick(key)}
            />
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filter (only shown when categories exist in this period) */}
        {reportCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setActiveCard(null); }}
            className={SELECT_CLS}
          >
            <option value="">Tất cả nhóm hàng</option>
            {reportCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={activeCard && activeCard !== 'all' ? '' : statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StockStatus | ''); setActiveCard(null); }}
          className={SELECT_CLS}
        >
          {STATUS_FILTER_OPTS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã, tên hàng..."
            className="bg-[#21262d] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-orange-500 transition-colors w-44 sm:w-56"
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#6e7681] hover:text-[#e6edf3] transition-colors"
          >
            <X size={12} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ── Main card ── */}
      <PageCard
        title={
          isLoading ? `Tổng hợp tồn kho — T${month}/${year}` :
          enrichedRows.length === 0 ? `Tổng hợp tồn kho — T${month}/${year}` :
          filteredRows.length === enrichedRows.length
            ? `Tổng hợp tồn kho — T${month}/${year} · ${enrichedRows.length} mặt hàng`
            : `Tổng hợp tồn kho — T${month}/${year} · ${filteredRows.length} / ${enrichedRows.length} mặt hàng`
        }
      >
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-[#6e7681] w-6 h-6" />
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="text-center py-12 text-sm text-red-400">
            Lỗi khi tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        {/* No data for period */}
        {!isLoading && !isError && enrichedRows.length === 0 && (
          <EmptyState message="Không có dữ liệu tồn kho cho kỳ này" />
        )}

        {/* No filter results */}
        {!isLoading && !isError && enrichedRows.length > 0 && filteredRows.length === 0 && (
          <EmptyState message="Không tìm thấy mặt hàng phù hợp với bộ lọc" />
        )}

        {!isLoading && !isError && filteredRows.length > 0 && (
          <>
            {/* ════════════ MOBILE CARD LAYOUT ════════════ */}
            <div className="md:hidden divide-y divide-[#30363d]">
              {filteredRows.map((row) => (
                <div
                  key={row.code}
                  onClick={() => setDrawerRow(row)}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${STATUS_CFG[row.status].rowCls}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-blue-400">{row.code}</span>
                      <StockStatusBadge status={row.status} />
                    </div>
                    <p className="text-sm truncate mb-2">{row.name}</p>

                    {/* 4-cell mini-grid */}
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: 'Đầu kỳ', val: fmt(row.openingQty), cls: 'text-[#8b949e]' },
                        { label: 'Nhập',   val: fmt(row.receiptQty), cls: 'text-green-400' },
                        { label: 'Xuất',   val: fmt(row.issueQty),   cls: 'text-red-400' },
                        { label: 'Cuối kỳ', val: fmt(row.closingQty), cls: closingCls(row) },
                      ].map(({ label, val, cls }) => (
                        <div key={label} className="bg-[#0d1117] rounded px-1.5 py-1.5 text-center">
                          <p className="text-[9px] text-[#6e7681]">{label}</p>
                          <p className={`text-xs font-mono font-semibold mt-0.5 ${cls}`}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#6e7681] flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>

            {/* ════════════ DESKTOP TABLE ════════════ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-[#1c2333]">
                    {[
                      { label: '#',          cls: 'w-8 text-left' },
                      { label: 'Mã hàng',    cls: 'text-left' },
                      { label: 'Tên hàng',   cls: 'text-left' },
                      { label: 'ĐVT',        cls: 'text-left', title: 'Đơn vị tính' },
                      { label: 'Đầu kỳ',     cls: 'text-right' },
                      { label: 'Nhập kỳ',    cls: 'text-right text-green-400/80' },
                      { label: 'Xuất kỳ',    cls: 'text-right text-red-400/80' },
                      { label: 'Cuối kỳ',    cls: 'text-right text-orange-400/80' },
                      { label: 'Trạng thái', cls: 'text-left' },
                      { label: 'Đề xuất',    cls: 'text-left' },
                      { label: '',           cls: 'w-8' },
                    ].map(({ label, cls, title }) => (
                      <th
                        key={label}
                        title={title}
                        className={`px-4 py-2.5 text-[10px] font-bold text-[#6e7681] uppercase tracking-wide whitespace-nowrap ${cls}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr
                      key={row.code}
                      className={`border-t border-[#30363d] cursor-pointer ${STATUS_CFG[row.status].rowCls}`}
                      onClick={() => setDrawerRow(row)}
                    >
                      <td className="px-4 py-2.5 text-xs text-[#6e7681]">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {row.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm max-w-[200px] truncate" title={row.name}>
                        {row.name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#6e7681]">{row.unit}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-right">{fmt(row.openingQty)}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-green-400 text-right">{fmt(row.receiptQty)}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-red-400 text-right">{fmt(row.issueQty)}</td>
                      <td className={`px-4 py-2.5 text-sm font-mono text-right ${closingCls(row)}`}>
                        {fmt(row.closingQty)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StockStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#6e7681] whitespace-nowrap">
                        {STATUS_ACTION[row.status]}
                      </td>
                      <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDrawerRow(row)}
                          className="p-1.5 rounded text-[#6e7681] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                          title="Xem chi tiết"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Totals footer */}
                {filteredRows.length > 1 && (
                  <tfoot>
                    <tr className="bg-[#1c2333] border-t-2 border-[#30363d]">
                      <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-[#6e7681] uppercase tracking-wide">
                        Tổng cộng ({filteredRows.length} mặt hàng)
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono font-bold text-right">
                        {fmt(totals.opening)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono font-bold text-green-400 text-right">
                        {fmt(totals.receipt)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono font-bold text-red-400 text-right">
                        {fmt(totals.issue)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono font-bold text-orange-400 text-right">
                        {fmt(totals.closing)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </PageCard>

      {/* ── Item detail drawer ── */}
      <ItemDetailDrawer
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
        row={drawerRow}
        month={month}
        year={year}
      />
    </div>
  );
}
