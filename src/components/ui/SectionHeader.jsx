export default function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
