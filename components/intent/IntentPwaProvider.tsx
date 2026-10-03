'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type IntentPwaContextValue = {
  installed: boolean;
  installAvailable: boolean;
  iosInstallHint: boolean;
  updateAvailable: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
  checkForUpdate: () => Promise<void>;
};

const IntentPwaContext = createContext<IntentPwaContextValue | null>(null);

function detectInstalled() {
  if (typeof window === 'undefined') return false;
  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMedia || iosStandalone;
}

function detectIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function IntentPwaProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    setInstalled(detectInstalled());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let active = true;
    let refreshing = false;
    let interval: number | undefined;
    let currentRegistration: ServiceWorkerRegistration | null = null;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && currentRegistration) {
        void currentRegistration.update().catch(() => undefined);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisibility);

    void navigator.serviceWorker.register('/chat-sw.js', { scope: '/intent/' })
      .then((nextRegistration) => {
        if (!active) return;
        currentRegistration = nextRegistration;
        setRegistration(nextRegistration);

        if (nextRegistration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }

        nextRegistration.addEventListener('updatefound', () => {
          const worker = nextRegistration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });

        interval = window.setInterval(() => {
          void nextRegistration.update().catch(() => undefined);
        }, 30 * 60 * 1000);
      })
      .catch(() => {
        // The chat remains fully functional without service-worker support.
      });

    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    const waiting = registration?.waiting;
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  const checkForUpdate = useCallback(async () => {
    if (!registration) return;
    await registration.update();
    if (registration.waiting && navigator.serviceWorker.controller) {
      setUpdateAvailable(true);
    }
  }, [registration]);

  const value = useMemo<IntentPwaContextValue>(() => ({
    installed,
    installAvailable: Boolean(installPrompt) && !installed,
    iosInstallHint: detectIos() && !installed && !installPrompt,
    updateAvailable,
    install,
    applyUpdate,
    checkForUpdate,
  }), [installed, installPrompt, updateAvailable, install, applyUpdate, checkForUpdate]);

  return (
    <IntentPwaContext.Provider value={value}>
      {children}
      {updateAvailable && (
        <div className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm shadow-2xl">
          <div className="min-w-0">
            <p className="font-semibold text-slate-950">LooseMouth update available</p>
            <p className="truncate text-xs text-slate-600">Reload into the newest chat build.</p>
          </div>
          <button
            type="button"
            onClick={applyUpdate}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Update now
          </button>
        </div>
      )}
    </IntentPwaContext.Provider>
  );
}

export function useIntentPwa() {
  const value = useContext(IntentPwaContext);
  if (!value) throw new Error('useIntentPwa must be used inside IntentPwaProvider.');
  return value;
}
