import { Sun, Moon } from "lucide-react";
import useDarkMode from "@/hooks/useDarkMode";

export default function ThemeToggle({ size = 15 }) {
  const [dark, setDark] = useDarkMode();

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all hover:scale-105 active:scale-95 bg-[var(--bg-dropdown)] text-[var(--brand)] border border-[var(--brand-border)] shadow-sm"
      title={dark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
      aria-label={dark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
