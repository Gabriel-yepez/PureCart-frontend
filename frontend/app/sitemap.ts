import type { MetadataRoute } from "next";
import { getProductsAction } from "@/lib/api/actions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://purecart.example.com";
const STATIC_CATEGORIES = ["mens", "womens", "kids", "sale", "all"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/signin`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...STATIC_CATEGORIES.map((slug) => ({
      url: `${SITE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  const result = await getProductsAction({ limit: 200 });
  const productEntries: MetadataRoute.Sitemap = result.ok
    ? result.products.map((p) => ({
        url: `${SITE_URL}/product/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    : [];

  return [...staticEntries, ...productEntries];
}
