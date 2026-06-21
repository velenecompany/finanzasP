export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="w-full max-w-[380px] animate-rise">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-[10px] grid place-items-center border border-[var(--border)] bg-[var(--surface-2)]">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--income)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 3 8-9" /><path d="M21 6v5h-5" /></svg>
          </div>
          <span className="font-bold text-[17px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></span>
        </div>
        {children}
      </div>
    </div>
  );
}
