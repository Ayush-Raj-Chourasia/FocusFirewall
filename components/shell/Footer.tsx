import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-2 py-8 mt-16 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <div className="font-display font-black text-lg text-ink">FOCUSFIREWALL</div>
            <p className="text-ink-muted text-xs mt-0.5">
              A System-1 decision layer for human attention.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link href="/live" className="hover:text-pink transition-colors">
              LIVE DEMO
            </Link>
            <Link href="/replay" className="hover:text-pink transition-colors">
              REPLAY RUNS
            </Link>
            <Link href="/benchmark" className="hover:text-pink transition-colors">
              400-BENCHMARK
            </Link>
            <Link href="/how-it-works" className="hover:text-pink transition-colors">
              ARCHITECTURE
            </Link>
            <a
              href="https://madewithjev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange transition-colors"
            >
              MADE WITH JEV ↗
            </a>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-ink-muted gap-2">
          <span>Jev decides. Code acts. No generated text required.</span>
          <span className="font-mono">STATE → DECISION → CODE</span>
        </div>
      </div>
    </footer>
  );
}
