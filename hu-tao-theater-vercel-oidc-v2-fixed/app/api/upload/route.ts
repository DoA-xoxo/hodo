
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFonts = new Set([
  "serif",
  "sans",
  "gothic",
  "handwritten",
]);

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MIN_GIFT_DAY = 11;
const MAX_GIFT_DAY = 25;

function authorized(password: FormDataEntryValue | null) {
  return (
    Boolean(process.env.ADMIN_PASSWORD) &&
    typeof password === "string" &&
    password.length > 0 &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const password = form.get("password");
    const action = form.get("action");

    // 모든 관리자 작업은 서버에서 비밀번호를 검증합니다.
    if (!authorized(password)) {
      return NextResponse.json(
        { error: "관리자 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 관리자 로그인용 비밀번호 확인
    // 세션을 생성하지 않으며, 이후 요청도 각각 비밀번호를 검증합니다.
    if (action === "verify") {
      return NextResponse.json({ success: true });
    }

    // 폰트 및 팝업 선물 설정 저장
    if (action === "font" || action === "featured") {
      const fontFamily = form.get("fontFamily");
      const featuredGiftDay = Number(
        form.get("featuredGiftDay")
      );

      if (
        typeof fontFamily !== "string" ||
        !allowedFonts.has(fontFamily)
      ) {
        return NextResponse.json(
          { error: "폰트 선택값이 올바르지 않습니다." },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(featuredGiftDay) ||
        featuredGiftDay < MIN_GIFT_DAY ||
        featuredGiftDay > MAX_GIFT_DAY
      ) {
        return NextResponse.json(
          {
            error: "팝업 선물 날짜는 11~25일 중에서 선택해 주세요.",
          },
          { status: 400 }
        );
      }

      await put(
        "settings/site.json",
        JSON.stringify({
          fontFamily,
          featuredGiftDay,
        }),
        {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        }
      );

      return NextResponse.json({ success: true });
    }

    // 메인 캘린더 및 날짜별 선물 이미지 업로드
    if (action !== "calendar" && action !== "gift") {
      return NextResponse.json(
        { error: "요청 유형이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "PNG 파일을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (
      file.type !== "image/png" ||
      !file.name.toLowerCase().endsWith(".png")
    ) {
      return NextResponse.json(
        { error: "PNG 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 1B 이상 4MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    let pathname: string;

    if (action === "calendar") {
      pathname = "calendar/main.png";
    } else {
      const day = Number(form.get("day"));

      if (
        !Number.isInteger(day) ||
        day < MIN_GIFT_DAY ||
        day > MAX_GIFT_DAY
      ) {
        return NextResponse.json(
          { error: "날짜는 11~25일 중에서 선택해 주세요." },
          { status: 400 }
        );
      }

      pathname = `gifts/day-${String(day).padStart(2, "0")}.png`;
    }

    const blob = await put(pathname, file, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname,
    });
  } catch (error) {
    console.error("Advent Blob operation failed", error);

    return NextResponse.json(
      {
        error:
          "요청에 실패했습니다. Blob 스토어 연결, OIDC 설정 및 재배포 여부를 확인해 주세요.",
      },
      { status: 500 }
    );
  }
}
