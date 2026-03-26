import { ShieldCheck, Sparkles } from "lucide-react";
import Button from "./Button";

export default function Navbar({ onScrollToAuth }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyanGlow/15 text-cyanGlow shadow-glow">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyanGlow/80">CipherFace</p>
            <p className="text-xs text-slate-300">Face Login + Encrypted Vault</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="dark" onClick={onScrollToAuth}>
            <Sparkles className="mr-2" size={16} />
            Launch Now
          </Button>
        </div>
      </div>
    </header>
  );
}
