
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const day = Number(searchParams.get("day"));

    if (!Number.isInteger(day) || day < 11 || day > 25) {
      return NextResponse.json(
        { error: "잘못된 선물 날짜입니다." },
        { status: 400 }
      );
    }

    const { blobs } = await list({
      prefix: `gifts/day-${String(day).padStart(2, "0")}.png`,
    });

    const blob = blobs.find(
      (item) =>
        item.pathname === `gifts/day-${String(day).padStart(2, "0")}.png`
    );

    if (!blob) {
      return NextResponse.json(
        { error: "선물 이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const imageResponse = await fetch(blob.url, {
      cache: "no-store",
    });

    if (!imageResponse.ok || !imageResponse.body) {
      return NextResponse.json(
        { error: "이미지를 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="hu-tao-gift-${day}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PNG download error:", error);

    return NextResponse.json(
      { error: "이미지 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
