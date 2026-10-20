"use client";

import { useEffect, useState } from "react";

type SiteSettings = { fontFamily?: string };
type ActiveImage = { url: string; uploadedAt?: string } | null;

const fontMap: Record<string, string> = {
  serif: '"Noto Serif KR", "Batang", serif',
  sans: '"Noto Sans KR", sans-serif',
  gothic: '"DM Sans", "Noto Sans KR", sans-serif',
  handwritten: '"Nanum Pen Script", cursive'
};

export default function Home() {
  const [activeImage, setActiveImage] = useState<ActiveImage>(null);
  const [fontFamily, setFontFamily] = useState("serif");
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    fetch("/api/current-image", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setActiveImage(data.image ?? null);
        setFontFamily(data.settings?.fontFamily ?? "serif");
      })
      .catch(() => setActiveImage(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showImage) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setShowImage(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showImage]);

  return (
    <main className="scene" style={{ fontFamily: fontMap[fontFamily] ?? fontMap.serif }}>
      <div className="snow" aria-hidden="true">
        {Array.from({ length: 65 }, (_, i) => (
          <i key={i} style={{
            left: `${(i * 37.7) % 100}%`,
            animationDelay: `${-((i * 1.73) % 18)}s`,
            animationDuration: `${10 + ((i * 13) % 14)}s`,
            opacity: 0.35 + ((i * 7) % 60) / 100,
            width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`
          }} />
        ))}
      </div>
      <header className="intro">
        <p className="eyebrow">Advent Calendar</p>
        <h1>胡桃劇場</h1>
        <p className="subtitle">즐거운 ✦ 성탄절</p>
      </header>

      <section className="calendar-area" aria-label="어드벤트 캘린더">
        <button className="calendar-button" onClick={() => activeImage && setShowImage(true)}
          disabled={!activeImage || loading} aria-label="오늘의 이미지 열기">
          {loading ? (
            <span className="placeholder"><span className="sparkle">✧</span><br />눈 내리는 중…</span>
          ) : activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="calendar-image" src={activeImage.url} alt="오늘의 어드벤트 캘린더 이미지" />
          ) : (
            <span className="placeholder"><span className="sparkle">✧</span><br />겨울의 선물이 준비 중이에요</span>
          )}
        </button>
        <p className="hint">{activeImage ? "이미지를 눌러 선물 열기" : "새로운 이미지가 준비 중이에요"}</p>
      </section>

      <footer>ⓒ胡桃劇場</footer>

      {showImage && activeImage && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setShowImage(false);
        }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="오늘의 PNG 선물">
            <button className="close" onClick={() => setShowImage(false)} aria-label="닫기">×</button>
            <div className="gift-label">✦ A LITTLE CHRISTMAS GIFT ✦</div>
            <div className="modal-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="modal-image" src={activeImage.url} alt="다운로드할 오늘의 PNG" />
            </div>
            <a className="download-link" href={activeImage.url} download="advent-calendar.png" target="_blank" rel="noreferrer">
              선물 PNG 저장
            </a>
            <p className="modal-note">이미지를 길게 누르거나 우클릭해도 저장할 수 있어요.</p>
          </div>
        </div>
      )}
    </main>
  );
}
