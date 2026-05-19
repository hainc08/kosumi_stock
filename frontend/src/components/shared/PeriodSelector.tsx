interface PeriodSelectorProps {
  year:     number;
  month:    number;
  onChange: (year: number, month: number) => void;
}

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export function PeriodSelector({ year, month, onChange }: PeriodSelectorProps) {
  const years = [2024, 2025, 2026, 2027];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={month}
        onChange={(e) => onChange(year, +e.target.value)}
        className="bg-[#21262d] border border-[#30363d] rounded-md px-2 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
      >
        {MONTHS.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(+e.target.value, month)}
        className="bg-[#21262d] border border-[#30363d] rounded-md px-2 py-1.5 text-sm text-[#e6edf3] outline-none focus:border-orange-500 transition-colors"
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function PageCard({
  title, actions, children,
}: {
  title?:   React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      {(title || actions) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d]">
          {title && <h2 className="text-sm font-bold">{title}</h2>}
          {actions && <div className="ml-auto flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

// ─────────────────────────────────────────────────────────────

export function EmptyState({ message = 'Không có dữ liệu' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#6e7681]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40"
      >
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h14M9 19a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
