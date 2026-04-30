import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-900">
          <SearchX className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Página no encontrada
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La página que buscas no existe o fue movida.
          </p>
        </div>
        <Button asChild className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
