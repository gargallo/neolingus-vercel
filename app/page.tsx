import type { Metadata } from "next";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { isServerSideDemoMode } from "@/utils/demo-mode";
import Link from "next/link";
import { ConstructionHomepage } from "@/components/homepage/construction-homepage";
import PromotionalHomepage from "@/components/homepage/promotional-homepage";
import SpectacularHomepage from "@/components/homepage/spectacular-homepage";
import { constructionHomepageContent } from "@/lib/data/homepage-content";

export const metadata: Metadata = {
  title:
    "NeoLingus - Aprueba Tu Certificación con IA Adaptativa | 97% Tasa de Éxito",
  description:
    "La primera plataforma del mundo que usa IA Adaptativa para garantizar tu aprobación en exámenes de certificación oficial. Únete a 50,000+ estudiantes exitosos. ¡Comienza GRATIS!",
  keywords: [
    "certificación idiomas",
    "IA adaptativa",
    "exámenes Cambridge",
    "certificación EOI",
    "JQCV Valenciano",
    "simulacros examen",
    "aprender idiomas IA",
    "certificaciones oficiales",
    "preparación exámenes",
    "academia idiomas online",
    "DELE Cervantes",
    "TOEFL IELTS",
  ],
  authors: [{ name: "NeoLingus Team" }],
  openGraph: {
    title:
      "NeoLingus - Aprueba Tu Certificación con IA Adaptativa | 97% Tasa de Éxito",
    description:
      "La primera plataforma del mundo que usa IA Adaptativa para garantizar tu aprobación. 50,000+ estudiantes exitosos. ¡Comienza GRATIS!",
    url: "/",
    siteName: "NeoLingus AI Academy",
    images: [
      {
        url: "/homepage/neolingus-og-image.png",
        width: 1200,
        height: 630,
        alt: "NeoLingus AI Language Academy - Official Certifications with AI-Powered Learning",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeoLingus - Certificaciones con IA Adaptativa",
    description:
      "La primera plataforma con IA Adaptativa para certificaciones oficiales. 97% tasa de éxito. ¡Comienza GRATIS!",
    images: ["/homepage/neolingus-twitter-card.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Demo mode home page component
function DemoHomePage() {
  return <SpectacularHomepage />;
}

// Fallback home page for non-demo mode
function ClientHomePage() {
  return <SpectacularHomepage />;
}

export default async function Home() {
  // Check for demo mode first
  const demoMode = isServerSideDemoMode();

  if (demoMode) {
    console.log("🎭 Demo mode active - showing demo home page");
    return <DemoHomePage />;
  }

  const supabase = await createSupabaseClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("=== HOME PAGE SERVER COMPONENT ===");
  console.log("User error:", error);
  console.log("User:", user?.id, user?.email);

  if (!error && user) {
    // User is authenticated, check if they're an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("role, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    console.log("Admin query result:", adminUser);
    console.log("Admin query error:", adminError);

    if (
      adminUser &&
      (adminUser.role === "super_admin" || adminUser.role === "admin")
    ) {
      console.log("🚀 REDIRECTING TO /admin");
      redirect("/admin");
    } else {
      console.log("📚 REDIRECTING TO /dashboard");
      redirect("/dashboard");
    }
  }

  console.log("👤 User not authenticated, showing home page");
  // User not authenticated, show the home page
  return <ClientHomePage />;
}
