import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { getProductsAction } from "@/lib/api/actions";

const ProductGrid = dynamic(() => import("@/components/ProductGrid"), { ssr: true });
const Categories = dynamic(() => import("@/components/Categories"), { ssr: true });

export default async function Home() {
  // Fetch products on the server - zero client-side waterfalls
  const result = await getProductsAction({ limit: 8 });
  const products = result.products;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProductGrid products={products} />
        <Categories />
      </main>
      <Footer />
    </div>
  );
}
