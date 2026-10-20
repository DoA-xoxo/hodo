import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedFonts = new Set(["serif", "sans", "gothic", "handwritten"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const password = form.get("password");
    const action = form.get("action");
    const fontFamily = form.get("fontFamily");
    const file = form.get("file");

    if (!process.env.ADMIN_PASSWORD || typeof password !== "string" ||
        password.length === 0 || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    if (typeof fontFamily !== "string" || !allowedFonts.has(fontFamily)) {
      return NextResponse.json({ error: "폰트 선택값이 올바르지 않습니다." }, { status: 400 });
    }

    if (action === "upload") {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "PNG 파일을 선택해 주세요." }, { status: 400 });
      }
      if (file.type !== "image/png" || !file.name.toLowerCase().endsWith(".png")) {
        return NextResponse.json({ error: "PNG 파일만 업로드할 수 있습니다." }, { status: 400 });
      }
      if (file.size === 0 || file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "파일 크기는 1B 이상 4MB 이하여야 합니다." }, { status: 400 });
      }

      await put(`advent/${Date.now()}-${crypto.randomUUID()}.png`, file, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false
      });
    } else if (action !== "font") {
      return NextResponse.json({ error: "요청 유형이 올바르지 않습니다." }, { status: 400 });
    }

    // No explicit token is passed: @vercel/blob uses the connected store's Vercel OIDC auth.
    await put("settings/site.json", JSON.stringify({ fontFamily }), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Advent Blob operation failed", error);
    return NextResponse.json({
      error: "요청에 실패했습니다. Blob 스토어 연결, OIDC 설정 및 재배포 여부를 확인해 주세요."
    }, { status: 500 });
  }
}
