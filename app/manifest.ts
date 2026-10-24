import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f2ece0",
    theme_color: "#3b2416",
    icons: [{ src: "/icon.png", sizes: "256x256", type: "image/png" }],
  };
}
