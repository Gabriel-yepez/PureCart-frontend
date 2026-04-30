import type { Metadata } from "next";
import { getProductByIdAction } from "@/lib/api/actions";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductDetail } from "./ProductDetail";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getProductByIdAction(id);

  if (!result.ok || !result.product) {
    return { title: "Producto no encontrado | PureCart" };
  }

  const { name, description, image_url } = result.product;
  return {
    title: `${name} | PureCart`,
    description: description ?? `Compra ${name} en PureCart`,
    openGraph: {
      title: name,
      description: description ?? undefined,
      images: image_url ? [{ url: image_url }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const result = await getProductByIdAction(id);

  if (!result.ok || !result.product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <ProductDetail product={result.product} />
      </main>
      <Footer />
    </div>
  );
}
