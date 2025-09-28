import { createSupabaseClient } from "@/utils/supabase/client";
// import { createClient } from "@updatedev/js";

export function createUpdateClient() {
  // TODO: Install @updatedev/js dependency when needed
  // const client = createClient(process.env.NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY!, {
  //   getSessionToken: async () => {
  //     const supabase = createSupabaseClient();
  //     const { data } = await supabase.auth.getSession();
  //     if (data.session == null) return;
  //     return data.session.access_token;
  //   },
  //   environment: "test",
  // });
  // return client;

  // Temporary mock implementation
  return {
    // Add mock methods as needed
  };
}
