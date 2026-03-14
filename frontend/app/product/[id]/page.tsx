import { getProductByIdAction } from "@/lib/api/actions";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductDetail } from "./ProductDetail";

interface ProductPageProps {
  params: Promise<{ id: string }>;
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
