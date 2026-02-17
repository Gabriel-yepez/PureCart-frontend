import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="grow pt-24">
                <div className="container mx-auto px-4 py-8">
                    <ProductGrid title={`${title} Collection`} category={slug} />
                </div>
            </main>
            <Footer />
        </div>
    );
}
