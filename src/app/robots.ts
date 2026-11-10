import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://www.efootballmarket.co.ke";

  const privateAndUtilityPaths = [
    "/admin",
    "/api/",
    "/dashboard/",
    "/orders/",
    "/pay/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/",
    "/profile",
    "/notifications",
    "/invite",
    "/tournaments/host",
    "/tournaments/register",
    "/seller/create-listing",
    "/seller/edit-listing/",
    "/seller/earnings",
    "/seller/verification",
  ];

  return {
    rules: [
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: ["AdsBot-Google", "AdsBot-Google-Mobile"],
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Google-Display-Ads-Bot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/ads.txt"],
        disallow: privateAndUtilityPaths,
      },
      {
        userAgent: "*",
        allow: ["/", "/ads.txt"],
        disallow: privateAndUtilityPaths,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
