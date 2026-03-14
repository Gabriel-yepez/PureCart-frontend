import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const ProductGrid = dynamic(() => import("@/components/ProductGrid"), { ssr: true });
const Categories = dynamic(() => import("@/components/Categories"), { ssr: true });

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <Categories />
      </main>
      <Footer />
    </div>
  );
}
