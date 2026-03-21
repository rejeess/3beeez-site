"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";

export async function loginAction(
  _previousState: { error: string },
  formData: FormData
) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = await signIn(email, password);

  if (!result.success) {
    return { error: result.message };
  }

  if (result.user.role === "owner") {
    redirect("/admin");
  }

  redirect("/portal");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
