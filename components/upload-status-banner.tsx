"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  success?: string;
  error?: string;
};

export function UploadStatusBanner({ success, error }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      router.replace("/portal");
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error, router]);

  if (!success && !error) return null;

  return (
    <article className={`portal-card portal-card-wide ${success ? "portal-card-success" : "portal-card-error"}`}>
      <strong>{success ? "Upload successful" : "Upload failed"}</strong>
      <p>{success ?? error}</p>
    </article>
  );
}
