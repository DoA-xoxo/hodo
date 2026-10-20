# 胡桃劇場 — Snowy Advent Calendar

## 기능
- 겨울 밤하늘 그라데이션과 눈 내리는 효과
- 제목 `즐거운 ✦ 성탄절`, `胡桃劇場`, 부제 `Advent Calendar`, 하단 `ⓒ胡桃劇場`
- 메인 화면 중앙에 고정된 **메인 캘린더 PNG** 표시
- 캘린더를 누르면 관리자에서 지정한 날짜의 **선물 PNG**가 팝업으로 열리고 저장 가능
- `/admin`에서 메인 캘린더 이미지와 11~25일 선물 이미지를 별도로 업로드·교체
- 날짜별 이미지 업로드 상태와 현재 이미지 미리보기
- 사이트 제목 폰트 및 팝업에서 열 선물 날짜 설정
- `ADMIN_PASSWORD`로 업로드/설정 저장 보호
- Vercel Blob OIDC: Blob SDK에 `BLOB_READ_WRITE_TOKEN`을 직접 전달하지 않고 연결된 스토어 인증 사용

## Vercel 배포
1. ZIP 압축을 풀고 **안에 있는 프로젝트 파일과 `app` 폴더가 GitHub 저장소의 프로젝트 루트에 오도록** 업로드합니다. ZIP 파일 자체나 상위 폴더 하나만 올리지 마세요.
2. Vercel에서 GitHub 저장소를 프로젝트로 가져오거나 기존 프로젝트에 push합니다. 프로젝트의 Root Directory가 `package.json`과 `app/`이 있는 위치를 가리키는지 확인합니다.
3. Vercel Blob 스토어를 프로젝트에 연결합니다. OIDC 연결이면 코드에 `BLOB_READ_WRITE_TOKEN`을 별도로 입력하지 않습니다.
4. Settings → Environment Variables에 `ADMIN_PASSWORD`를 설정하고 Production 환경에 적용합니다.
5. 변경사항을 push한 뒤 Vercel에서 배포가 완료될 때까지 기다립니다.

## 관리자 사용법
1. 사이트 주소 뒤에 `/admin`을 붙여 관리자 페이지를 엽니다.
2. Vercel의 `ADMIN_PASSWORD` 값을 입력합니다.
3. **메인 캘린더 이미지** 영역에서 캘린더 전체 PNG를 업로드합니다. 이 이미지는 메인 화면 중앙에 표시됩니다.
4. **날짜별 선물 이미지** 영역에서 1~24일 중 날짜를 선택하고 그 날짜의 PNG를 업로드합니다. 같은 날짜에 다시 업로드하면 해당 날짜의 이미지만 교체됩니다.
5. **사이트 표시 설정**에서 제목 폰트와 캘린더 클릭 시 팝업으로 열 선물 날짜를 선택한 뒤 저장합니다.
6. 메인 화면에서 캘린더 이미지를 클릭/터치하면 선택한 날짜의 선물 이미지가 팝업으로 열립니다. 날짜 칸이 아직 구현되지 않은 현재 버전에서는 캘린더 전체를 눌러 팝업을 여는 방식입니다.

## 이미지 및 저장 구조
- 메인 캘린더: `calendar/main.png`
- 날짜별 선물: `gifts/day-11.png` ~ `gifts/day-25.png`
- 표시 설정: `settings/site.json`
- PNG만 허용하며 파일당 최대 4MB입니다.
- 이미지 Blob URL은 공개 URL입니다. 누구나 공개 이미지에 접근하고 저장할 수 있지만, 업로드/설정 API는 `ADMIN_PASSWORD`로 보호됩니다.

## 로컬 개발
Vercel OIDC 인증은 Vercel 런타임과 연결 설정에 의존합니다. 로컬에서는 Vercel CLI로 프로젝트를 연결하고 `vercel env pull`로 환경을 구성하세요. `.env.example`을 참고해 `ADMIN_PASSWORD`를 설정합니다.
