import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import Categories from "@/components/Categories";
import { getProductsAction } from "@/lib/api/actions";

export default async function Home() {
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
