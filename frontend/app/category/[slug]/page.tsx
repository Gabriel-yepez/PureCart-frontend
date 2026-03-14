import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import { getProductsAction } from "@/lib/api/actions";
import type { ProductFilters } from "@/lib/api/types";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ search?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { search } = await searchParams;

    const isAll = slug === "all";
    const title = isAll
        ? search
            ? `Search: "${search}"`
            : "All Products"
        : slug.charAt(0).toUpperCase() + slug.slice(1);

    const filters: ProductFilters = { limit: 40 };
    if (!isAll) filters.category = slug;
    if (search) filters.search = search;

    const result = await getProductsAction(filters);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="grow pt-24">
                <div className="container mx-auto px-4 py-8">
                    <ProductGrid title={`${title} Collection`} products={result.products} />
                </div>
            </main>
            <Footer />
        </div>
    );
}
