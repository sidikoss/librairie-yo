import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileWhatsAppFab from "./MobileWhatsAppFab";

export default function RootLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-brand-500/14 blur-3xl" />
        <div className="absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-guinea-500/16 blur-3xl" />
      </div>

      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <MobileWhatsAppFab />
    </div>
  );
}
