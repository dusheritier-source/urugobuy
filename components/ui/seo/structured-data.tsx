"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface ProductSchema {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: string;
  brand?: string;
  sku?: string;
}

interface BreadcrumbSchema {
  name: string;
  url: string;
}

interface StructuredDataProps {
  type: "product" | "breadcrumb" | "organization" | "website";
  data: ProductSchema | BreadcrumbSchema[] | Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const pathname = usePathname();

  useEffect(() => {
    let schema: Record<string, unknown> = {};

    switch (type) {
      case "product":
        schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: (data as ProductSchema).name,
          description: (data as ProductSchema).description,
          image: (data as ProductSchema).image,
          offers: {
            "@type": "Offer",
            price: (data as ProductSchema).price,
            priceCurrency: (data as ProductSchema).currency || "RWF",
            availability: (data as ProductSchema).availability || "https://schema.org/InStock",
          },
          brand: (data as ProductSchema).brand ? {
            "@type": "Brand",
            name: (data as ProductSchema).brand,
          } : undefined,
        };
        break;

      case "breadcrumb":
        const breadcrumbData = data as BreadcrumbSchema[];
        if (!Array.isArray(breadcrumbData)) {
          break;
        }
        schema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://urugobuy.com",
            },
            ...breadcrumbData.map((item, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: item.name,
              item: `https://urugobuy.com${item.url}`,
            })),
          ],
        };
        break;

      case "organization":
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Urugo Buy",
          description: "Premium e-commerce experience in Rwanda",
          url: "https://urugobuy.com",
          logo: "https://urugobuy.com/logo.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+250-XXX-XXXX",
            contactType: "customer service",
          },
        };
        break;

      case "website":
        schema = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Urugo Buy",
          description: "Premium e-commerce experience in Rwanda",
          url: "https://urugobuy.com",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://urugobuy.com/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        };
        break;
    }

    // Remove undefined values
    schema = JSON.parse(JSON.stringify(schema));

    // Add structured data to page
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    script.id = `structured-data-${type}`;
    
    // Remove existing structured data of same type
    const existing = document.getElementById(`structured-data-${type}`);
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const element = document.getElementById(`structured-data-${type}`);
      if (element) {
        element.remove();
      }
    };
  }, [type, data, pathname]);

  return null;
}