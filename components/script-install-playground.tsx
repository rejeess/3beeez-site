"use client";

import { useState } from "react";

type ScriptInstallPlaygroundProps = {
  companyName: string;
  defaultSnippet: string;
};

function parseAttribute(snippet: string, attribute: string) {
  const pattern = new RegExp(`${attribute}="([^"]+)"`);
  const match = snippet.match(pattern);
  return match?.[1] || "";
}

function removeExistingWidget() {
  const launcher = document.querySelector(
    'button[aria-label="Open support chat"]'
  );
  const panels = document.querySelectorAll('iframe[title="3Beeez chat widget"]');

  launcher?.parentElement?.removeChild(launcher);
  panels.forEach((iframe) => {
    iframe.parentElement?.remove();
  });

  // Reset the guard so the script can be reinstalled in the same page session.
  (
    window as typeof window & {
      __threeBeeezWidgetMounted?: boolean;
    }
  ).__threeBeeezWidgetMounted = false;
}

export function ScriptInstallPlayground({
  companyName,
  defaultSnippet,
}: ScriptInstallPlaygroundProps) {
  const [scriptSnippet, setScriptSnippet] = useState(defaultSnippet);
  const [status, setStatus] = useState(
    "No widget is installed yet on this test website."
  );

  function installSnippet() {
    const src = parseAttribute(scriptSnippet, "src");

    if (!src || !src.includes("botId=")) {
      setStatus(
        "The snippet is missing the botId in the script URL. Please paste the generated 3Beeez script."
      );
      return;
    }

    removeExistingWidget();

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      setStatus(
        `The ${companyName} widget script was installed on this page. The chat icon should now appear in the bottom-right corner.`
      );
    };
    script.onerror = () => {
      setStatus(
        "The script could not be loaded. Make sure you pasted the generated local test snippet."
      );
    };

    document.body.appendChild(script);
  }

  return (
    <section className="section">
      <div className="section-heading compact">
        <p className="eyebrow">Manual install test</p>
        <h2>Paste the generated script and activate it on this page.</h2>
        <p>
          This page stays a normal website until you install the customer script
          manually. That lets you test the exact script returned after payment.
        </p>
      </div>

      <div className="test-site-grid">
        <article className="test-site-card">
          <strong>Paste generated script</strong>
          <textarea
            className="script-playground-input"
            value={scriptSnippet}
            onChange={(event) => setScriptSnippet(event.target.value)}
            rows={8}
          />
          <div className="purchase-actions">
            <button
              className="button button-primary"
              onClick={installSnippet}
              type="button"
            >
              Install script on page
            </button>
          </div>
        </article>

        <article className="test-site-card">
          <strong>Install status</strong>
          <p>{status}</p>
          <p>
            Use the script from the purchase success page so you test the real
            generated bot ID and icon color.
          </p>
        </article>
      </div>
    </section>
  );
}
