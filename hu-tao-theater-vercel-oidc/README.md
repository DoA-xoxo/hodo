# 胡桃劇場 — Snowy Advent Calendar

## 포함 기능
- 겨울 밤하늘에서 아래로 갈수록 따뜻해지는 배경 그라데이션과 눈 내리는 효과
- 상단 작은 제목 `Advent Calendar`, 메인 제목 `胡桃劇場`
- 문구 `즐거운 ✦ 성탄절`, 하단 `ⓒ胡桃劇場`
- 캘린더 PNG 클릭 시 중간 크기의 선물형 팝업과 PNG 저장 링크
- PC 우클릭 / 모바일 길게 눌러 저장 가능
- `/admin`에서 관리자 비밀번호로 PNG 업로드 및 사이트 폰트 변경
- 최신 PNG가 오늘의 이미지로 공개됨
- Vercel Blob OIDC 인증: `@vercel/blob` SDK에서 토큰을 명시적으로 넘기지 않고 연결된 스토어 인증 사용

## Vercel 배포
1. 프로젝트를 GitHub 저장소에 업로드하고 Vercel에서 가져옵니다.
2. Vercel Blob 스토어 `advent-images`를 프로젝트에 연결합니다. 연결 화면에 “All connected projects use OIDC”가 표시되면 OIDC 연결입니다.
3. Settings → Environment Variables에서 `ADMIN_PASSWORD`를 긴 무작위 값으로 등록합니다.
4. Blob 연결로 `BLOB_STORE_ID` 및 OIDC 인증이 제공되는지 확인합니다. `BLOB_READ_WRITE_TOKEN`은 이 코드에서 명시적으로 사용하지 않습니다.
5. 최신 코드를 GitHub에 push하고 Vercel에서 재배포합니다.

## 관리자 사용
- `/admin`으로 접속합니다.
- `ADMIN_PASSWORD` 값을 입력합니다.
- 폰트를 선택하고 `폰트 설정 저장`을 누르면 공개 페이지 제목 폰트가 바뀝니다.
- PNG 파일을 선택하고 `PNG 업로드 / 오늘의 이미지 변경`을 누르면 이미지가 교체됩니다.
- 매일 자정 직접 새 PNG를 업로드하는 수동 운영 방식입니다.

## 파일 크기 / 공개 접근
서버 업로드의 Vercel 요청 크기 제한을 고려해 PNG는 4MB 이하로 제한했습니다. 큰 이미지가 필요하면 Vercel Blob client upload 방식으로 확장할 수 있습니다.
공개 Blob URL은 방문자가 볼 수 있고 저장할 수 있습니다. 관리자 업로드 API는 `ADMIN_PASSWORD`로 보호됩니다.

## 로컬 개발
Vercel OIDC 인증은 Vercel 런타임 및 연결 설정에 의존합니다. 로컬에서 실행하려면 Vercel CLI로 프로젝트를 연결하고 `vercel env pull`을 실행해 로컬 인증 환경을 구성하세요. `.env.example`을 `.env.local`로 복사하고 `ADMIN_PASSWORD`를 설정합니다.
