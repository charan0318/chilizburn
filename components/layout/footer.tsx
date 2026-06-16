"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[linear-gradient(160deg,rgba(10,15,24,0.95)_0%,rgba(8,12,19,0.95)_100%)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link
          href="/faq"
          className="text-xs font-medium text-zinc-400 transition-colors hover:text-rose-300"
        >
          FAQ
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <span>Built with</span>
          <span className="text-rose-500 animate-pulse">❤</span>
          <span>by a Chilizen</span>
        </div>

        <Link
          href="https://t.me/chilizburns"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 border border-rose-500/30 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
        >
          Telegram
        </Link>
      </div>
    </footer>
  );
}
