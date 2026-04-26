export default function BookSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Cover skeleton */}
      <div className="aspect-[3/4] w-full bg-slate-200 animate-pulse" />

      {/* Body skeleton */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <div className="mb-2 h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
        
        {/* Title */}
        <div className="mb-2 h-5 w-full rounded-full bg-slate-200 animate-pulse" />
        <div className="mb-3 h-5 w-2/3 rounded-full bg-slate-200 animate-pulse" />
        
        {/* Author */}
        <div className="mb-4 h-4 w-1/2 rounded-full bg-slate-200 animate-pulse" />

        {/* Price & Sales */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-20 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
        </div>

        {/* Stars */}
        <div className="mb-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-full bg-slate-200 animate-pulse" />
          ))}
        </div>

        {/* Button */}
        <div className="mt-auto h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
      </div>
    </article>
  );
}
