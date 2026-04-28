import { WA_NUMBER } from "../../config/constants";
import { MessageCircle } from "lucide-react";

export default function MobileWhatsAppFab() {
  if (!WA_NUMBER) return null;

  return (
    <a
      href={`https://wa.me/${WA_NUMBER.replace(/^0/, '224')}?text=${encodeURIComponent("Bonjour Librairie YO, je veux des informations sur vos livres.")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 md:bottom-7 md:right-7 group"
      title="Commander via WhatsApp"
      aria-label="Commander via WhatsApp"
    >
      {/* Glow ring */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-green-500/20 blur-md animate-pulse" aria-hidden="true" />
      
      {/* Button */}
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-400/40 transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-green-700">
        <MessageCircle size={28} />
      </span>

      {/* Tooltip */}
      <span className="pointer-events-none absolute right-16 top-1/2 hidden -translate-y-1/2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md md:inline-flex">
        WhatsApp
      </span>
    </a>
  );
}
