import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";

export default function MobileWhatsAppFab() {
  return (
    <div className="fixed bottom-5 right-5 z-50 md:bottom-7 md:right-7">
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/35 via-accent-500/35 to-guinea-500/35 blur-sm" />
      <a
        href={buildWhatsAppUrl(
          "Bonjour Librairie YO, je veux des informations sur vos livres.",
        )}
        target="_blank"
        rel="noreferrer"
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white ring-4 ring-white/85 shadow-xl shadow-guinea-300/70 transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#1fb85a] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
        title="Commander via WhatsApp"
        aria-label="Commander via WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-7 w-7 fill-current drop-shadow-sm"
        >
          <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06ZM12 20.1c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.03.79.81-2.95-.2-.31A8.03 8.03 0 0 1 4 12a8 8 0 1 1 8 8.1Zm4.39-5.62c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.17-.7-.62-1.17-1.39-1.31-1.63-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42-.14-.01-.3-.01-.46-.01s-.42.06-.64.3c-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.11 3.65.57.25 1.02.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.44-.59 1.64-1.15.2-.56.2-1.04.14-1.15-.06-.11-.22-.18-.46-.3Z" />
        </svg>
      </a>
      <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm md:inline-flex">
        WhatsApp
      </span>
    </div>
  );
}
