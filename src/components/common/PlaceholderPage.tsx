type PlaceholderPageProps = {
  title: string;
  section: string;
};

export function PlaceholderPage({ title, section }: PlaceholderPageProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/10">
      <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-accent">
        {section}
      </span>
      <div className="space-y-2">
        <h1 className="text-4xl font-light tracking-[0.08em] text-white">{title}</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Phase 1 foundation route. This page exists so routing, layouts, design tokens, and
          future feature work can be built in controlled layers.
        </p>
      </div>
    </section>
  );
}
