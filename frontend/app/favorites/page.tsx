import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FavoritesPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="grow container mx-auto px-4 py-8 mt-20">
                <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <p className="text-xl text-muted-foreground">You haven't added any favorites yet.</p>
                    <p className="text-muted-foreground">Start exploring our collection and add items to your wishlist!</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
