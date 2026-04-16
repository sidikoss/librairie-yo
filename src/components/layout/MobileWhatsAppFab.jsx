import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";

export default function MobileWhatsAppFab() {
  return (
    <a
      href={buildWhatsAppUrl("Bonjour Librairie YO, je veux des informations sur vos livres.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg shadow-emerald-200 transition hover:scale-105 md:bottom-6 md:right-6"
      title="Commander via WhatsApp"
    >
      💬
    </a>
  );
}
