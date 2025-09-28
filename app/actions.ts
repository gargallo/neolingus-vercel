"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/redirect";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const url = process.env.VERCEL_URL
    ? `${process.env.VERCEL_URL}/dashboard`
    : "http://localhost:3000/dashboard";

  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: url,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  return redirect("/dashboard");
};

export const signOutAction = async () => {
  const client = await createSupabaseClient();
  await client.auth.signOut();
  return redirect("/sign-in");
};

// DEPRECATED: Usar componente OAuth client-side en su lugar
export const signInWithGoogleAction = async () => {
  console.log("⚠️ Acción OAuth server-side deprecada, usar cliente");
  return redirect(
    "/sign-in?error=" + encodeURIComponent("Usar botón OAuth del cliente")
  );
};

export const signInWithGitHubAction = async () => {
  const client = await createSupabaseClient();

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"
      }/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect(data.url);
};
