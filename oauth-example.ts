// Ejemplo de implementación OAuth en actions.ts
import { createSupabaseClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/redirect";
import { redirect } from "next/navigation";

export const signInWithGoogleAction = async () => {
  const client = await createSupabaseClient();
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.VERCEL_URL || 'http://localhost:3000'}/protected`
    }
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Redirecciona a la URL de OAuth
  return redirect(data.url);
};

export const signInWithGitHubAction = async () => {
  const client = await createSupabaseClient();
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.VERCEL_URL || 'http://localhost:3000'}/protected`
    }
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect(data.url);
};
