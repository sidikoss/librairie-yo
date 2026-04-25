import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import MobileWhatsAppFab from "./MobileWhatsAppFab";
import { Analytics } from "@vercel/analytics/react";
import { PreloadHints, DNSPrefetch } from "../common/ResourceHints";

export default function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-zinc-900 dark:text-white">
      <PreloadHints />
      <DNSPrefetch />
      <ScrollToTop />

      {/* Animated background orbs - adapted for dark mode */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-brand-500/8 blur-3xl animate-float dark:bg-indigo-500/15" style={{ transition: 'background 0.5s ease' }} />
        <div className="absolute left-1/2 top-4 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-500/12 blur-3xl animate-float-slow dark:bg-violet-500/10" style={{ transition: 'background 0.5s ease' }} />
        <div className="absolute -right-28 bottom-12 h-80 w-80 rounded-full bg-guinea-500/8 blur-3xl animate-float-delayed dark:bg-emerald-500/12" style={{ transition: 'background 0.5s ease' }} />
        <div className="absolute left-1/4 bottom-1/3 h-48 w-48 rounded-full bg-brand-400/4 blur-3xl animate-float-delayed dark:bg-indigo-400/8" style={{ transition: 'background 0.5s ease' }} />
        <div className="absolute right-1/3 top-1/4 h-56 w-56 rounded-full bg-guinea-400/6 blur-3xl animate-float-slow dark:bg-emerald-400/10" style={{ transition: 'background 0.5s ease' }} />
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
