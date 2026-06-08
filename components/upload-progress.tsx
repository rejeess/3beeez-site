"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

const STEPS = {
  pdf:     ["Reading PDF",        "Extracting text",    "Chunking content", "Building search index"],
  word:    ["Reading document",   "Extracting text",    "Chunking content", "Building search index"],
  website: ["Fetching page",      "Extracting content", "Chunking content", "Building search index"],
  notes:   ["Processing content", "Chunking",           "Building search index", "Saving"],
};

const STEP_MS = 900;

function Spinner() {
  return <span className="upload-step-spinner" aria-hidden />;
}

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") return <span className="upload-step-icon">✓</span>;
  if (state === "active") return <span className="upload-step-icon"><Spinner /></span>;
  return <span className="upload-step-icon upload-step-icon-pending">○</span>;
}

export function UploadProgress({ type }: { type: keyof typeof STEPS }) {
  const { pending } = useFormStatus();
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!pending) {
      setStep(-1);
      return;
    }
    setStep(0);
    const count = STEPS[type].length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < count; i++) {
      timers.push(setTimeout(() => setStep(i), i * STEP_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [pending, type]);

  if (!pending) return null;

  const steps = STEPS[type];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="upload-progress" role="status" aria-live="polite">
      <div className="upload-progress-bar">
        <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="upload-progress-steps">
        {steps.map((label, i) => {
          const state = i < step ? "done" : i === step ? "active" : "pending";
          return (
            <div key={i} className={`upload-step upload-step-${state}`}>
              <StepIcon state={state} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
