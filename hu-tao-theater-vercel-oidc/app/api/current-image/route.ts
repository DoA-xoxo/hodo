import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "advent/" });
    const latest = blobs
      .filter((blob) => blob.pathname.toLowerCase().endsWith(".png"))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

    let settings = { fontFamily: "serif" };
    try {
      const settingsBlobs = await list({ prefix: "settings/site.json" });
      const settingsBlob = settingsBlobs.blobs.find((blob) => blob.pathname === "settings/site.json");
      if (settingsBlob) {
        const response = await fetch(settingsBlob.url, { cache: "no-store" });
        if (response.ok) {
          const parsed = await response.json();
          if (["serif", "sans", "gothic", "handwritten"].includes(parsed.fontFamily)) {
            settings = { fontFamily: parsed.fontFamily };
          }
        }
      }
    } catch { /* Keep the default font if settings are not present yet. */ }

    return NextResponse.json(
      { image: latest ? { url: latest.url, uploadedAt: latest.uploadedAt } : null, settings },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Could not load Advent Blob data", error);
    return NextResponse.json({ image: null, settings: { fontFamily: "serif" } }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  }
}
