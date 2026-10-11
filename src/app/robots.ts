import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/farmer/", "/buyer/", "/api/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://farmconnect.app"}/sitemap.xml`,
  };
}
