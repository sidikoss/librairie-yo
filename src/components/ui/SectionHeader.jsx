export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          <span className="h-2 w-2 rounded-full bg-brand-600" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl">
        <span className="title-accent">{title}</span>
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
