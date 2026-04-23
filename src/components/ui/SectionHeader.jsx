export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-brand-100/80 bg-gradient-to-r from-brand-50 to-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-600 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-brand-500" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">
        <span className="title-accent">{title}</span>
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          {description}
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-1">
        <div className="h-1 w-8 rounded-full bg-brand-500" />
        <div className="h-1 w-4 rounded-full bg-accent-500" />
        <div className="h-1 w-2 rounded-full bg-guinea-500" />
      </div>
    </div>
  );
}
