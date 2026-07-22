import Topbar from "@/components/Topbar";
import AdvisorChat from "@/components/AdvisorChat";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <>
      <Topbar title="Asesor IA" subtitle="Tu asesor financiero con tus datos reales" />
      <div className="p-5 md:p-7 max-w-[820px] w-full mx-auto flex-1 flex flex-col">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
          <AdvisorChat />
        </div>
      </div>
    </>
  );
}
