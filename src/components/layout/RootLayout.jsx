import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import MobileWhatsAppFab from "./MobileWhatsAppFab";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-slate-900">
      <ScrollToTop />

      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl animate-float" />
        <div className="absolute left-1/2 top-4 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl animate-float-slow" />
        <div className="absolute -right-28 bottom-12 h-80 w-80 rounded-full bg-guinea-500/10 blur-3xl animate-float-delayed" />
        <div className="absolute left-1/4 bottom-1/3 h-48 w-48 rounded-full bg-brand-400/5 blur-3xl animate-float-delayed" />
        <div className="absolute right-1/3 top-1/4 h-56 w-56 rounded-full bg-guinea-400/8 blur-3xl animate-float-slow" />
      </div>

      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
      <MobileWhatsAppFab />
      <Analytics />
    </div>
  );
}
