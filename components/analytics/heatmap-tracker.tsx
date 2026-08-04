"use client";

import { useEffect } from "react";
import Script from "next/script";

interface HeatmapTrackerProps {
  trackingId?: string;
}

export function HeatmapTracker({ trackingId }: HeatmapTrackerProps) {
  useEffect(() => {
    // No-op: keep component client-safe.
  }, []);

  if (!trackingId || !/^[a-zA-Z0-9_-]+$/.test(trackingId)) return null;

  return (
    <Script
      id="clarity-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", ${JSON.stringify(trackingId)});
        `,
      }}
    />
  );
}

// Hotjar alternative
export function HotjarTracker({ siteId }: { siteId: string }) {
  useEffect(() => {
    // No-op: keep component client-safe.
  }, []);

  if (!siteId || !/^\d+$/.test(siteId)) return null;

  return (
    <Script
      id="hotjar-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings={hjid:${siteId},hjsv:6};
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

