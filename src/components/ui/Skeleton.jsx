import { memo } from "react";

export const BookCardSkeleton = memo(function BookCardSkeleton() {
  return (
    <div className="h-full animate-pulse">
      <div className="h-40 sm:h-48 bg-zinc-200 dark:bg-zinc-700 rounded-t-card-lg" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
      </div>
    </div>
  );
});

export const BookGridSkeleton = memo(function BookGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
});

export const TextSkeleton = memo(function TextSkeleton({ lines = 1, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-zinc-200 dark:bg-zinc-700 rounded ${
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
});

export const CardSkeleton = memo(function CardSkeleton({ className = "" }) {
  return (
    <div className={`card-surface p-5 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
    </div>
  );
});

export const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <div className="h-20 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
    </div>
  );
});

export const TableRowSkeleton = memo(function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="animate-pulse">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </td>
      ))}
    </tr>
  );
});

export const ButtonSkeleton = memo(function ButtonSkeleton({ className = "" }) {
  return (
    <div className={`h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl ${className}`} />
  );
});

export const InputSkeleton = memo(function InputSkeleton({ className = "" }) {
  return (
    <div className={`h-10 w-full bg-zinc-200 dark:bg-zinc-700 rounded-lg ${className}`} />
  );
});

export const ImageSkeleton = memo(function ImageSkeleton({ aspectRatio = "16/9", className = "" }) {
  return (
    <div 
      className={`bg-zinc-200 dark:bg-zinc-700 ${className}`}
      style={{ aspectRatio }} 
    />
  );
});