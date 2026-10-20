"use client";

import { useEffect, useState } from "react";

const fontOptions = [
  { value: "serif", label: "명조체 — 고전적이고 우아한 느낌" },
  { value: "sans", label: "고딕체 — 깔끔하고 현대적인 느낌" },
  { value: "gothic", label: "DM Sans + 고딕 — 영문이 깔끔한 느낌" },
  { value: "handwritten", label: "손글씨체 — 포근하고 귀여운 느낌" }
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fontFamily, setFontFamily] = useState("serif");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/current-image", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setFontFamily(data.settings?.fontFamily ?? "serif"))
      .catch(() => {});
  }, []);

  async function submit(action: "upload" | "font") {
    if (!password) { setMessage("관리자 비밀번호를 입력해 주세요."); return; }
    if (action === "upload" && !file) { setMessage("업로드할 PNG 파일을 선택해 주세요."); return; }
    if (action === "upload" && file && file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      setMessage("PNG 파일만 업로드할 수 있어요."); return;
    }
    if (action === "upload" && file && file.size > 4 * 1024 * 1024) {
      setMessage("Vercel 서버 업로드 제한을 고려해 파일은 4MB 이하로 준비해 주세요."); return;
    }

    setBusy(true); setMessage("");
    try {
      const body = new FormData();
      body.append("password", password);
      body.append("fontFamily", fontFamily);
      body.append("action", action);
      if (file && action === "upload") body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
      setMessage(action === "upload" ? "업로드 완료! 새 이미지가 공개 페이지에 적용됐어요." : "폰트 설정을 저장했어요.");
      if (action === "upload") setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청 중 오류가 발생했습니다.");
    } finally { setBusy(false); }
  }

  return (
    <main className="admin-page">
      <section className="admin-card">
        <p className="eyebrow">PRIVATE AREA</p>
        <h1>胡桃劇場 관리</h1>
        <p className="admin-desc">관리자만 PNG 이미지를 교체하고 공개 페이지의 제목 폰트를 변경할 수 있습니다.</p>
        <label htmlFor="password">관리자 비밀번호</label>
        <input id="password" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Vercel의 ADMIN_PASSWORD" />
        <label htmlFor="font">사이트 제목 폰트</label>
        <select id="font" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
          {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
        </select>
        <button className="upload-button secondary-button" onClick={() => submit("font")} disabled={busy}>
          {busy ? "저장 중…" : "폰트 설정 저장"}
        </button>
        <label htmlFor="image">새 PNG 이미지</label>
        <input id="image" type="file" accept="image/png,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {file && <p className="file-name">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
        <button className="upload-button" onClick={() => submit("upload")} disabled={busy}>
          {busy ? "처리 중…" : "PNG 업로드 / 오늘의 이미지 변경"}
        </button>
        {message && <p className="status" role="status">{message}</p>}
        <p className="admin-warning">이미지 업로드는 4MB 이하 PNG를 권장합니다. 공개 이미지 URL은 방문자가 저장할 수 있습니다.</p>
        <a className="back-link" href="/">← 공개 캘린더로 돌아가기</a>
      </section>
    </main>
  );
}
