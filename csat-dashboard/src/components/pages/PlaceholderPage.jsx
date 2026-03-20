export default function PlaceholderPage({ title }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-center animate-enter">
      <div className="w-16 h-16 rounded-full bg-[var(--brand-dim)] flex items-center justify-center mb-6">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
      </div>
      <h1 className="text-3xl font-serif-accent font-extrabold text-[var(--foreground)] mb-2">{title}</h1>
      <p className="text-[var(--muted)] max-w-md">Modul ini sedang dalam tahap pengembangan untuk mencapai sinkronisasi penuh dengan sistem lama.</p>
    </div>
  )
}
