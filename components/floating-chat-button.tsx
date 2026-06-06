"use client";

import { useState, useEffect, useRef } from "react";

export function FloatingChatButton({ botId, origin }: { botId: string; origin: string }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pageUrl, setPageUrl] = useState(origin);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsMobile(("ontouchstart" in window) || navigator.maxTouchPoints > 0);
    setPageUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => iframeRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const iframeSrc = `/widget?botId=${encodeURIComponent(botId)}&pageUrl=${encodeURIComponent(pageUrl)}`;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "calc(100vh - 80px)",
        zIndex: 2147483645,
        overflow: "hidden",
        background: "#07111f",
        border: "1px solid rgba(179,206,255,0.16)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
        borderRadius: "20px 20px 0 0",
      }
    : {
        position: "fixed",
        right: "24px",
        bottom: "104px",
        width: "380px",
        maxWidth: "calc(100vw - 48px)",
        height: "620px",
        maxHeight: "calc(100vh - 140px)",
        zIndex: 2147483645,
        overflow: "hidden",
        background: "#07111f",
        border: "1px solid rgba(179,206,255,0.16)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        borderRadius: "24px",
      };

  return (
    <>
      {open && (
        <div style={panelStyle}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="3Beeez chat widget"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "fixed",
          right: "20px",
          bottom: isMobile ? "80px" : "24px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5ae0d2, #6fd8ff)",
          color: "#04111f",
          boxShadow: "0 8px 32px rgba(0,0,0,0.32)",
          zIndex: 2147483647,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          padding: 0,
          outline: "none",
        }}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
        )}
      </button>
    </>
  );
}
