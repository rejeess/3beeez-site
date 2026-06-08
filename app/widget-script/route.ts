import { NextRequest, NextResponse } from "next/server";
import { getCompanyByBotId, getCompanyByInstallToken, isDomainAllowed } from "@/lib/db";

export async function GET(request: NextRequest) {
  const origin = process.env.APP_BASE_URL?.replace(/\/$/, "") || request.nextUrl.origin;
  const installToken = request.nextUrl.searchParams.get("installToken") || "";
  const botId = request.nextUrl.searchParams.get("botId") || "";
  const position =
    request.nextUrl.searchParams.get("position") || "bottom-right";
  const theme = request.nextUrl.searchParams.get("theme") || "midnight";
  const iconColor = request.nextUrl.searchParams.get("iconColor") || "";

  const company =
    (installToken ? getCompanyByInstallToken(installToken) : undefined) ||
    (botId ? getCompanyByBotId(botId) : undefined);

  if (!company) {
    return new NextResponse(`console.error("3Beeez: unknown bot ID.");`, {
      status: 404,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (company.status !== "active") {
    return new NextResponse(
      `console.error("3Beeez: this account is not active.");`,
      {
        status: 403,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const referer = request.headers.get("referer") || request.headers.get("origin") || "";

  if (!isDomainAllowed(company.allowedDomain, referer)) {
    return new NextResponse(
      `console.error("3Beeez: this bot is not authorized for this domain.");`,
      {
        status: 403,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const script = `
(function () {
  if (window.__threeBeeezWidgetMounted) return;
  window.__threeBeeezWidgetMounted = true;
  var botId = ${JSON.stringify(company.botId)};
  var position = ${JSON.stringify(position)};
  var theme = ${JSON.stringify(theme)};
  var iconColor = ${JSON.stringify(iconColor)};

  // Use touch detection — more reliable than innerWidth for distinguishing mobile from desktop
  var isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  var chatIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>';
  var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open support chat");
  launcher.innerHTML = chatIcon;
  launcher.style.position = "fixed";
  launcher.style.right = position === "bottom-right" ? "20px" : "auto";
  launcher.style.left = position === "bottom-left" ? "20px" : "auto";
  // On mobile, add extra clearance for the browser navigation bar (Android ~56px, iOS home indicator ~34px)
  launcher.style.bottom = isMobile ? "80px" : "24px";
  launcher.style.width = "60px";
  launcher.style.height = "60px";
  launcher.style.borderRadius = "999px";
  launcher.style.border = "0";
  launcher.style.cursor = "pointer";
  launcher.style.display = "flex";
  launcher.style.alignItems = "center";
  launcher.style.justifyContent = "center";
  launcher.style.boxShadow = "0 8px 32px rgba(0,0,0,0.32)";
  launcher.style.zIndex = "2147483646";
  launcher.style.background = theme === "midnight"
    ? "linear-gradient(135deg, #5ae0d2, #6fd8ff)"
    : "#111827";
  if (iconColor) {
    launcher.style.background = iconColor;
  }
  launcher.style.color = "#04111f";
  launcher.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
  launcher.style.webkitTapHighlightColor = "transparent";
  launcher.style.touchAction = "manipulation";
  launcher.onmouseenter = function () { launcher.style.transform = "scale(1.08)"; launcher.style.boxShadow = "0 12px 40px rgba(0,0,0,0.38)"; };
  launcher.onmouseleave = function () { launcher.style.transform = "scale(1)"; launcher.style.boxShadow = "0 8px 32px rgba(0,0,0,0.32)"; };

  var panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.zIndex = "2147483645";
  panel.style.overflow = "hidden";
  panel.style.background = "#07111f";
  panel.style.boxShadow = "0 24px 80px rgba(0,0,0,0.35)";
  panel.style.border = "1px solid rgba(179,206,255,0.16)";
  panel.style.display = "none";

  if (isMobile) {
    // Bottom sheet on mobile — sits above the browser nav bar
    panel.style.left = "0";
    panel.style.right = "0";
    panel.style.bottom = "0";
    panel.style.width = "100%";
    panel.style.height = "calc(100dvh - 80px)";
    panel.style.borderRadius = "20px 20px 0 0";
  } else {
    panel.style.right = position === "bottom-right" ? "24px" : "auto";
    panel.style.left = position === "bottom-left" ? "24px" : "auto";
    panel.style.bottom = "104px";
    panel.style.width = "380px";
    panel.style.maxWidth = "calc(100vw - 48px)";
    panel.style.height = "620px";
    panel.style.maxHeight = "calc(100vh - 140px)";
    panel.style.borderRadius = "24px";
  }

  var iframe = document.createElement("iframe");
  iframe.src = "${origin}/widget?botId=" + encodeURIComponent(botId) + "&pageUrl=" + encodeURIComponent(window.location.href) + (iconColor ? "&iconColor=" + encodeURIComponent(iconColor) : "");
  iframe.title = "3Beeez chat widget";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";

  // Mobile-only close button overlaid at the top-right corner of the bottom sheet
  var mobileClose = null;
  if (isMobile) {
    mobileClose = document.createElement("button");
    mobileClose.type = "button";
    mobileClose.setAttribute("aria-label", "Close chat");
    mobileClose.innerHTML = closeIcon;
    mobileClose.style.position = "fixed";
    mobileClose.style.top = "92px";
    mobileClose.style.right = "16px";
    mobileClose.style.width = "40px";
    mobileClose.style.height = "40px";
    mobileClose.style.borderRadius = "999px";
    mobileClose.style.border = "0";
    mobileClose.style.background = "rgba(255,255,255,0.15)";
    mobileClose.style.color = "#fff";
    mobileClose.style.cursor = "pointer";
    mobileClose.style.display = "none";
    mobileClose.style.alignItems = "center";
    mobileClose.style.justifyContent = "center";
    mobileClose.style.zIndex = "2147483647";
    mobileClose.style.webkitTapHighlightColor = "transparent";
    mobileClose.style.touchAction = "manipulation";
    document.body.appendChild(mobileClose);
  }

  panel.appendChild(iframe);
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  function openPanel() {
    panel.style.display = "block";
    if (isMobile) {
      launcher.style.display = "none";
      if (mobileClose) { mobileClose.style.display = "flex"; }
    } else {
      launcher.innerHTML = closeIcon;
      launcher.setAttribute("aria-label", "Close support chat");
    }
  }

  function closePanel() {
    panel.style.display = "none";
    if (isMobile) {
      launcher.style.display = "flex";
      launcher.innerHTML = chatIcon;
      if (mobileClose) { mobileClose.style.display = "none"; }
    } else {
      launcher.innerHTML = chatIcon;
      launcher.setAttribute("aria-label", "Open support chat");
    }
  }

  launcher.addEventListener("click", function () {
    if (panel.style.display === "block") { closePanel(); } else { openPanel(); }
  });

  if (mobileClose) {
    mobileClose.addEventListener("click", closePanel);
  }
})();
  `.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
