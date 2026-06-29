import Link from "next/link";

export default function ShopPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center min-h-[60vh]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <h1 className="text-2xl font-black tracking-[2px] text-neutral-100" style={{ fontFamily: "var(--font-orbitron)" }}>
        SHOP
      </h1>
      <p className="max-w-md text-sm text-neutral-500">
        Spend XP on themes, keycaps and cosmetics. Coming soon.
      </p>
      <Link
        href="/app/home"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold tracking-[1px] text-neutral-950 shadow-[0_0_16px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 active:scale-95"
      >
        Back Home
      </Link>
    </div>
  );
}
