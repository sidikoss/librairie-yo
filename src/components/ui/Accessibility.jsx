import { forwardRef } from "react";

export const IconButton = forwardRef(function IconButton(
  { 
    icon: Icon, 
    label, 
    variant = "ghost", 
    size = "md", 
    className = "", 
    disabled = false,
    loading = false,
    ...props 
  },
  ref
) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const variants = {
    ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
    solid: "bg-brand-500 hover:bg-brand-600 text-white",
    outline: "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      ref={ref}
      aria-label={label}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]}
        ${variants[variant] || variants.ghost}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className={`animate-spin ${iconSizes[size]}`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <Icon className={iconSizes[size]} />
      )}
    </button>
  );
});

export const VisuallyHidden = forwardRef(function VisuallyHidden(
  { children, as: Component = "span", className = "", ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export const SkipLink = forwardRef(function SkipLink(
  { href, children, className = "", ...props },
  ref
) {
  return (
    <a
      ref={ref}
      href={href}
      className={`absolute -top-10 left-4 z-50 bg-brand-500 text-white px-4 py-2 rounded-lg transition-top ${className}`}
      {...props}
    >
      {children}
    </a>
  );
});

export const ScreenReaderOnly = forwardRef(function ScreenReaderOnly(
  { children, as: Component = "div", className = "", ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`sr-only ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export const Input = forwardRef(function Input(
  { 
    label, 
    error, 
    helper, 
    className = "", 
    inputClassName = "",
    id,
    type = "text",
    ...props 
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        className={`
          block w-full px-3 py-2 rounded-lg border
          text-zinc-900 dark:text-white
          placeholder-zinc-400 dark:placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed
          ${error 
            ? "border-red-300 focus:ring-red-500 dark:border-red-700" 
            : "border-zinc-300 dark:border-zinc-700"
          }
          ${inputClassName}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-sm text-zinc-500 dark:text-zinc-400">
          {helper}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { 
    label, 
    error, 
    helper, 
    className = "", 
    inputClassName = "",
    id,
    rows = 4,
    ...props 
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        className={`
          block w-full px-3 py-2 rounded-lg border
          text-zinc-900 dark:text-white
          placeholder-zinc-400 dark:placeholder-zinc-500
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed
          resize-y
          ${error 
            ? "border-red-300 focus:ring-red-500 dark:border-red-700" 
            : "border-zinc-300 dark:border-zinc-700"
          }
          ${inputClassName}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className="text-sm text-zinc-500 dark:text-zinc-400">
          {helper}
        </p>
      )}
    </div>
  );
});