import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileWhatsAppFab from "./MobileWhatsAppFab";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <MobileWhatsAppFab />
    </div>
  );
}
