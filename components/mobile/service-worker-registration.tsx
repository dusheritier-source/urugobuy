"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("Service Worker registered:", registration);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            toast.success("New version available! Refresh to update.", {
              duration: 5000,
            });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        });
          }
        });

        // Handle offline/online events
        window.addEventListener("online", () => {
          toast.success("You're back online!");
        });

        window.addEventListener("offline", () => {
          toast.error("You're offline. Some features may be limited.");
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}