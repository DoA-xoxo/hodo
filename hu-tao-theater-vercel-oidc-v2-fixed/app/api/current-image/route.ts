import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validFonts = ["serif", "sans", "gothic", "handwritten"];

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "" });
    const byPath = new Map(blobs.map((blob) => [blob.pathname, blob]));
    const calendarBlob = byPath.get("calendar/main.png");
    const gifts: Record<string, { url: string; uploadedAt: string }> = {};
    for (let day = 11; day <= 25; day++) {
      const blob = byPath.get(`gifts/day-${String(day).padStart(2, "0")}.png`);
      if (blob) gifts[String(day)] = { url: blob.url, uploadedAt: blob.uploadedAt.toISOString() };
    }

    let settings: { fontFamily: string; featuredGiftDay: number } = {
  fontFamily: "serif",
  featuredGiftDay: 11
};
    const settingsBlob = byPath.get("settings/site.json");
    if (settingsBlob) {
      try {
        const response = await fetch(settingsBlob.url, { cache: "no-store" });
        if (response.ok) {
          const parsed = await response.json();
          settings = {
            fontFamily: validFonts.includes(parsed.fontFamily) ? parsed.fontFamily : "serif",
            featuredGiftDay: Number.isInteger(parsed.featuredGiftDay) && parsed.featuredGiftDay >= 11 && parsed.featuredGiftDay <= 25
              ? parsed.featuredGiftDay : 11
          };
        }
      } catch { /* Use defaults when settings have not been saved yet. */ }
    }

    return NextResponse.json({
      calendar: calendarBlob ? { url: calendarBlob.url, uploadedAt: calendarBlob.uploadedAt.toISOString() } : null,
      gifts, settings
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Could not load Advent Blob data", error);
    return NextResponse.json({ calendar: null, gifts: {}, settings: { fontFamily: "serif", featuredGiftDay: 1 } }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  }
}
