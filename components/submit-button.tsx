"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function SubmitButton({ label, pendingLabel, className = "button button-primary login-button" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (pendingLabel ?? "Please wait…") : label}
    </button>
  );
}
