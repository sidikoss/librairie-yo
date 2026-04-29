import { useCallback, useEffect, useState } from "react";

export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!installEvent) return false;

    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    return true;
  }, [installEvent]);

  return {
    isInstallable: Boolean(installEvent),
    installPWA,
  };
}
