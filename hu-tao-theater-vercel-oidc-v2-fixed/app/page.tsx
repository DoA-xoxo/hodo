"use client";

import { useEffect, useState } from "react";
import logo from "./images/logo.png";

type ImageInfo = { url: string; uploadedAt?: string } | null;
type SiteSettings = { fontFamily?: string; featuredGiftDay?: number };
type ApiData = { calendar: ImageInfo; gifts: Record<string, ImageInfo>; settings: SiteSettings };

const fontMap: Record<string, string> = {
  serif: '"Noto Serif KR", "Batang", serif',
  sans: '"Noto Sans KR", sans-serif',
  gothic: '"DM Sans", "Noto Sans KR", sans-serif',
  handwritten: '"Nanum Pen Script", cursive'
};

export default function Home() {
  const [calendar, setCalendar] = useState<ImageInfo>(null);
  const [gifts, setGifts] = useState<Record<string, ImageInfo>>({});
  const [fontFamily, setFontFamily] = useState("serif");
  const [featuredGiftDay, setFeaturedGiftDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    fetch("/api/current-image", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ApiData) => {
        setCalendar(data.calendar ?? null);
        setGifts(data.gifts ?? {});
        setFontFamily(data.settings?.fontFamily ?? "serif");
        setFeaturedGiftDay(data.settings?.featuredGiftDay ?? 1);
      })
      .catch(() => { setCalendar(null); setGifts({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showImage) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setShowImage(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [showImage]);

  const activeGift = gifts[String(featuredGiftDay)] ?? null;

  return (
    <main className="scene" style={{ fontFamily: fontMap[fontFamily] ?? fontMap.serif }}>
      <div className="snow" aria-hidden="true">
        {Array.from({ length: 65 }, (_, i) => <i key={i} style={{
          left: `${(i * 37.7) % 100}%`, animationDelay: `${-((i * 1.73) % 18)}s`,
          animationDuration: `${10 + ((i * 13) % 14)}s`, opacity: 0.35 + ((i * 7) % 60) / 100,
          width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`
        }} />)}
      </div>
      <header className="intro">
        <p className="eyebrow">즐거운 ✦ 성탄절</p>
        <img
  src={logo.src}
  alt="胡桃劇場"
  className="site-logo"
/>
        <p className="subtitle">Advent Calendar</p>
      </header>

      <section className="calendar-area" aria-label="어드벤트 캘린더">
        <button className="calendar-button" onClick={() => activeGift && setShowImage(true)}
          disabled={!activeGift || loading} aria-label="지정된 선물 이미지 열기">
          {loading ? <span className="placeholder"><span className="sparkle">✧</span><br />눈 내리는 중…</span> : calendar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="calendar-image" src={calendar.url} alt="메인 어드벤트 캘린더" />
          ) : <span className="placeholder"><span className="sparkle">✧</span><br />관리자 페이지에서 캘린더 이미지를 등록해 주세요.</span>}
        </button>
        <p className="hint">{!calendar ? "캘린더 이미지가 준비 중이에요" : activeGift ? "캘린더를 눌러 선물 열기" : `관리자 페이지에서 ${featuredGiftDay}일 선물 이미지를 등록해 주세요`}</p>
      </section>
      <footer>ⓒ胡桃劇場</footer>

      {showImage && activeGift && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowImage(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={`${featuredGiftDay}일 선물 PNG`}>
            <button className="close" onClick={() => setShowImage(false)} aria-label="닫기">×</button>
            <div className="gift-label">✦ A LITTLE CHRISTMAS GIFT ✦</div>
            <div className="modal-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="modal-image" src={activeGift.url} alt={`${featuredGiftDay}일 선물 이미지`} />
            </div>
            <a className="download-link" href={activeGift.url} download={`hu-tao-gift-${featuredGiftDay}.png`} target="_blank" rel="noreferrer">선물 PNG 저장</a>
            <p className="modal-note">이미지를 길게 누르거나 우클릭해도 저장할 수 있어요.</p>
          </div>
        </div>
      )}
    </main>
  );
}
