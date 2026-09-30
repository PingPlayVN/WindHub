import { useEffect, useState } from 'react';

export default function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const updateInstalledState = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    };
    const captureInstallEvent = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const clearInstallEvent = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };

    updateInstalledState();
    window.addEventListener('beforeinstallprompt', captureInstallEvent);
    window.addEventListener('appinstalled', clearInstallEvent);
    window.addEventListener('resize', updateInstalledState);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallEvent);
      window.removeEventListener('appinstalled', clearInstallEvent);
      window.removeEventListener('resize', updateInstalledState);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return 'manual';
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    return choice.outcome;
  };

  return {
    canInstall: Boolean(installEvent) && !isInstalled,
    isInstalled,
    install,
  };
}