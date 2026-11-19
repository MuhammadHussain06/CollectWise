import type { MetadataRoute } from "next";

// Makes the app installable on phones (Add to Home Screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CollectWise",
    short_name: "CollectWise",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f5",
    theme_color: "#1f5a3d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
