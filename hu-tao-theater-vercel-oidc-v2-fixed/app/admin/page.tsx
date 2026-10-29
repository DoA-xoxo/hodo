
"use client";

import { useEffect, useState } from "react";

type GiftMap = Record<string, { url: string; uploadedAt?: string }>;

const fontOptions = [
  { value: "serif", label: "명조체 — 고전적이고 우아한 느낌" },
  { value: "sans", label: "고딕체 — 깔끔하고 현대적인 느낌" },
  { value: "gothic", label: "DM Sans + 고딕 — 영문이 깔끔한 느낌" },
  { value: "handwritten", label: "손글씨체 — 포근하고 귀여운 느낌" },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  const [giftFile, setGiftFile] = useState<File | null>(null);
  const [giftDay, setGiftDay] = useState("11");
  const [fontFamily, setFontFamily] = useState("serif");
  const [featuredGiftDay, setFeaturedGiftDay] = useState("11");
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [gifts, setGifts] = useState<GiftMap>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");

  const dayOptions = Array.from(
    { length: 15 },
    (_, index) => index + 11
  );

  async function refresh() {
    try {
      const response = await fetch("/api/current-image", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("이미지 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();

      setCalendarUrl(data.calendar?.url ?? null);
      setGifts(data.gifts ?? {});
      setFontFamily(data.settings?.fontFamily ?? "serif");
      setFeaturedGiftDay(
        String(data.settings?.featuredGiftDay ?? 11)
      );
    } catch {
      setMessage("기존 이미지 정보를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    // 로그인 화면에서는 관리 데이터를 불러오지 않습니다.
  }, []);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!password.trim()) {
      setLoginError("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    setBusy(true);
    setLoginError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("password", password);
      body.append("action", "verify");

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "비밀번호가 올바르지 않습니다."
        );
      }

      setIsAuthenticated(true);
      await refresh();
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitUpload(
    action: "calendar" | "gift"
  ) {
    const file =
      action === "calendar" ? calendarFile : giftFile;

    if (!password) {
      setMessage("관리자 비밀번호를 확인해 주세요.");
      return;
    }

    if (!file) {
      setMessage("업로드할 PNG 파일을 선택해 주세요.");
      return;
    }

    if (
      file.type !== "image/png" ||
      !file.name.toLowerCase().endsWith(".png")
    ) {
      setMessage("PNG 파일만 업로드할 수 있어요.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage("파일은 4MB 이하로 준비해 주세요.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("password", password);
      body.append("action", action);
      body.append("file", file);

      if (action === "gift") {
        body.append("day", giftDay);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "업로드에 실패했습니다."
        );
      }

      setMessage(
        action === "calendar"
          ? "메인 캘린더 이미지를 저장했어요."
          : `${giftDay}일 선물 이미지를 저장했어요.`
      );

      if (action === "calendar") {
        setCalendarFile(null);
      } else {
        setGiftFile(null);
      }

      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "요청 중 오류가 발생했습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    if (!password) {
      setMessage("관리자 비밀번호를 확인해 주세요.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const body = new FormData();
      body.append("password", password);
      body.append("action", "featured");
      body.append("fontFamily", fontFamily);
      body.append("featuredGiftDay", featuredGiftDay);

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "설정을 저장하지 못했습니다."
        );
      }

      setMessage("폰트와 팝업 선물 설정을 저장했어요.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "설정 저장 중 오류가 발생했습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setPassword("");
    setCalendarFile(null);
    setGiftFile(null);
    setMessage("");
    setLoginError("");
  }

  return (
    <main className="admin-page">
      {!isAuthenticated ? (
        <section className="admin-card login-card">
          <p className="eyebrow">PRIVATE AREA</p>

          <h1>胡桃劇場 관리</h1>

          <p className="admin-desc">
            관리자 비밀번호를 입력해 주세요.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="admin-password">
              관리자 비밀번호
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="관리자 비밀번호"
              required
            />

            {loginError && (
              <p className="status" role="alert">
                {loginError}
              </p>
            )}

            <button
              className="upload-button"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "확인 중…"
                : "관리자 페이지 입장"}
            </button>
          </form>

          <a className="back-link" href="/">
            ← 공개 캘린더로 돌아가기
          </a>
        </section>
      ) : (
        <section className="admin-card admin-card-wide">
          <p className="eyebrow">PRIVATE AREA</p>

          <h1>胡桃劇場 관리</h1>

          <p className="admin-desc">
            메인 캘린더와 날짜별 선물 이미지를 따로 관리합니다.
            모든 이미지는 PNG, 4MB 이하로 업로드해 주세요.
          </p>

          <button
            type="button"
            className="upload-button secondary-button"
            onClick={handleLogout}
            disabled={busy}
          >
            로그아웃
          </button>

          <section className="admin-section">
            <h2>1. 메인 캘린더 이미지</h2>

            <p className="section-help">
              공개 메인 화면 중앙에 항상 표시되는 캘린더 전체 이미지입니다.
            </p>

            {calendarUrl ? (
              <div className="preview-box">
                <img
                  src={calendarUrl}
                  alt="현재 메인 캘린더"
                  className="admin-preview calendar-preview"
                />
              </div>
            ) : (
              <div className="empty-preview">
                아직 메인 캘린더가 등록되지 않았어요.
              </div>
            )}

            <label htmlFor="calendar-file">
              캘린더 전체 PNG
            </label>

            <input
              id="calendar-file"
              type="file"
              accept="image/png,.png"
              onChange={(e) =>
                setCalendarFile(
                  e.target.files?.[0] ?? null
                )
              }
            />

            {calendarFile && (
              <p className="file-name">
                선택됨: {calendarFile.name} ·{" "}
                {(calendarFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}

            <button
              type="button"
              className="upload-button"
              onClick={() => submitUpload("calendar")}
              disabled={busy}
            >
              {busy
                ? "처리 중…"
                : "메인 캘린더 업로드 / 교체"}
            </button>
          </section>

          <section className="admin-section">
            <h2>2. 날짜별 선물 이미지</h2>

            <p className="section-help">
              11~25일 이미지를 각각 등록합니다.
              같은 날짜에 다시 업로드하면 해당 날짜 이미지가 교체됩니다.
            </p>

            <div className="gift-status-grid">
              {dayOptions.map((day) => (
                <button
                  type="button"
                  key={day}
                  className={`day-chip ${
                    gifts[String(day)]
                      ? "day-chip-done"
                      : ""
                  } ${
                    giftDay === String(day)
                      ? "day-chip-selected"
                      : ""
                  }`}
                  onClick={() => setGiftDay(String(day))}
                >
                  {day}일 {gifts[String(day)] ? "✓" : "·"}
                </button>
              ))}
            </div>

            <label htmlFor="gift-day">
              업로드할 날짜
            </label>

            <select
              id="gift-day"
              value={giftDay}
              onChange={(e) =>
                setGiftDay(e.target.value)
              }
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일{" "}
                  {gifts[String(day)]
                    ? "(등록됨 · 교체 가능)"
                    : "(미등록)"}
                </option>
              ))}
            </select>

            {gifts[giftDay] && (
              <div className="preview-box gift-preview-box">
                <img
                  src={gifts[giftDay].url}
                  alt={`${giftDay}일 현재 선물 이미지`}
                  className="admin-preview gift-preview"
                />
                <p>{giftDay}일 현재 등록된 이미지</p>
              </div>
            )}

            <label htmlFor="gift-file">
              {giftDay}일 선물 PNG
            </label>

            <input
              id="gift-file"
              type="file"
              accept="image/png,.png"
              onChange={(e) =>
                setGiftFile(
                  e.target.files?.[0] ?? null
                )
              }
            />

            {giftFile && (
              <p className="file-name">
                선택됨: {giftFile.name} ·{" "}
                {(giftFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}

            <button
              type="button"
              className="upload-button"
              onClick={() => submitUpload("gift")}
              disabled={busy}
            >
              {busy
                ? "처리 중…"
                : `${giftDay}일 선물 이미지 업로드 / 교체`}
            </button>
          </section>

          <section className="admin-section">
            <h2>3. 사이트 표시 설정</h2>

            <label htmlFor="font">
              사이트 제목 폰트
            </label>

            <select
              id="font"
              value={fontFamily}
              onChange={(e) =>
                setFontFamily(e.target.value)
              }
            >
              {fontOptions.map((font) => (
                <option
                  key={font.value}
                  value={font.value}
                >
                  {font.label}
                </option>
              ))}
            </select>

            <label htmlFor="featured-day">
              캘린더를 눌렀을 때 팝업으로 열 선물
            </label>

            <select
              id="featured-day"
              value={featuredGiftDay}
              onChange={(e) =>
                setFeaturedGiftDay(e.target.value)
              }
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일{" "}
                  {gifts[String(day)]
                    ? "(등록됨)"
                    : "(아직 이미지 없음)"}
                </option>
              ))}
            </select>

            <p className="section-help">
              메인 캘린더를 누르면 여기서 지정한 날짜의 선물 이미지가 열립니다.
            </p>

            <button
              type="button"
              className="upload-button secondary-button"
              onClick={saveSettings}
              disabled={busy}
            >
              {busy
                ? "저장 중…"
                : "폰트 / 팝업 선물 설정 저장"}
            </button>
          </section>

          {message && (
            <p className="status" role="status">
              {message}
            </p>
          )}

          <p className="admin-warning">
            이미지는 공개 URL로 저장되므로 방문자가 볼 수 있습니다.
            업로드와 설정 저장은 서버의 ADMIN_PASSWORD 검증을 거칩니다.
          </p>

          <a className="back-link" href="/">
            ← 공개 캘린더로 돌아가기
          </a>
        </section>
      )}
    </main>
  );
}
