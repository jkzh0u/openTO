import type { MetadataRoute } from "next";
import { SECTION_IDS } from "./lib/news";
import { SITE_URL } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...SECTION_IDS.map((section) => `/${section}`)].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "always",
    priority: path === "" ? 1 : 0.8,
  }));
}
