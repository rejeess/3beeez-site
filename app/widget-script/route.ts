import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const botId = request.nextUrl.searchParams.get("botId") || "3beeez-main";
  const position =
    request.nextUrl.searchParams.get("position") || "bottom-right";
  const theme = request.nextUrl.searchParams.get("theme") || "midnight";
  const iconColor = request.nextUrl.searchParams.get("iconColor") || "";

  const script = `
(function () {
  if (window.__threeBeeezWidgetMounted) return;
  window.__threeBeeezWidgetMounted = true;
  var botId = ${JSON.stringify(botId)};
  var position = ${JSON.stringify(position)};
  var theme = ${JSON.stringify(theme)};
  var iconColor = ${JSON.stringify(iconColor)};

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open support chat");
  launcher.textContent = "Chat";
  launcher.style.position = "fixed";
  launcher.style.right = position === "bottom-right" ? "24px" : "auto";
  launcher.style.left = position === "bottom-left" ? "24px" : "auto";
  launcher.style.bottom = "24px";
  launcher.style.width = "68px";
  launcher.style.height = "68px";
  launcher.style.borderRadius = "999px";
  launcher.style.border = "0";
  launcher.style.cursor = "pointer";
  launcher.style.fontWeight = "700";
  launcher.style.fontFamily = "system-ui, sans-serif";
  launcher.style.boxShadow = "0 18px 40px rgba(0,0,0,0.28)";
  launcher.style.zIndex = "2147483000";
  launcher.style.background = theme === "midnight"
    ? "linear-gradient(135deg, #5ae0d2, #6fd8ff)"
    : "#111827";
  if (iconColor) {
    launcher.style.background = iconColor;
  }
  launcher.style.color = "#04111f";

  var panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.right = position === "bottom-right" ? "24px" : "auto";
  panel.style.left = position === "bottom-left" ? "24px" : "auto";
  panel.style.bottom = "108px";
  panel.style.width = "380px";
  panel.style.maxWidth = "calc(100vw - 24px)";
  panel.style.height = "620px";
  panel.style.maxHeight = "calc(100vh - 140px)";
  panel.style.borderRadius = "24px";
  panel.style.overflow = "hidden";
  panel.style.background = "#07111f";
  panel.style.boxShadow = "0 24px 80px rgba(0,0,0,0.35)";
  panel.style.border = "1px solid rgba(179,206,255,0.16)";
  panel.style.zIndex = "2147483000";
  panel.style.display = "none";

  var iframe = document.createElement("iframe");
  iframe.src = "${origin}/widget?botId=" + encodeURIComponent(botId);
  iframe.title = "3Beeez chat widget";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";

  panel.appendChild(iframe);
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  launcher.addEventListener("click", function () {
    var isOpen = panel.style.display === "block";
    panel.style.display = isOpen ? "none" : "block";
    launcher.textContent = isOpen ? "Chat" : "Close";
  });
})();
  `.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
