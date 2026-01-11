import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smartphone, Download } from "lucide-react";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom prompt if the app is not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowPrompt(true);
      }
    });

    // For iOS, we can't detect the install prompt, so we show it after a short delay
    // if not in standalone mode
    if (isIOSDevice && !window.matchMedia("(display-mode: standalone)").matches) {
      const hasShownPrompt = localStorage.getItem("pwa_prompt_shown");
      if (!hasShownPrompt) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem("pwa_prompt_shown", "true");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, so we can't use it again
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Instal Aplikasi</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isIOS ? (
              <div className="space-y-4">
                <p>Pasang aplikasi ini di HP Anda untuk akses lebih cepat dan mudah:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm bg-muted p-4 rounded-lg">
                  <li>Klik tombol <strong>Bagikan (Share)</strong> di bagian bawah browser</li>
                  <li>Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama</strong></li>
                  <li>Klik <strong>Tambah</strong> di pojok kanan atas</li>
                </ol>
              </div>
            ) : (
              "Pasang aplikasi ini di HP Anda untuk akses lebih cepat dan pengalaman yang lebih baik."
            )}
          </DialogDescription>
        </DialogHeader>
        {!isIOS && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPrompt(false)}>
              Nanti Saja
            </Button>
            <Button onClick={handleInstallClick} className="gap-2">
              <Download className="w-4 h-4" />
              Instal Sekarang
            </Button>
          </DialogFooter>
        )}
        {isIOS && (
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowPrompt(false)} className="w-full">
              Mengerti
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
