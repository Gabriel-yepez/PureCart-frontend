"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Algo salió mal
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ocurrió un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
            Intentar de nuevo
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
