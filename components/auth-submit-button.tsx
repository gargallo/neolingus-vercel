"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export default function AuthSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      aria-disabled={pending}
      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
    >
      {pending ? "Iniciando sesión..." : "Iniciar sesión"}
    </Button>
  );
}
