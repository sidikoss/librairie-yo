export default function BookSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Cover skeleton */}
      <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
      
      {/* Content skeleton */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <div className="mb-2 h-3 w-16 rounded bg-slate-200" />
        
        {/* Title */}
        <div className="mb-1 h-5 w-full rounded bg-slate-200" />
        <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
        
        {/* Author */}
        <div className="mb-4 h-3 w-24 rounded bg-slate-200" />
        
        {/* Price */}
        <div className="mt-auto">
          <div className="mb-3 h-6 w-20 rounded bg-slate-200" />
          
          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookSkeleton key={i} />
      ))}
    </div>
  );
}
