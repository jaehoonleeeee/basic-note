# basic note

기기에서 **AES-256-GCM으로 암호화**한 뒤에만 저장하는, 프라이버시 우선 노트 앱. 서버(본인 Supabase)에는 암호문만 들어가고 복호화 키는 기기를 떠나지 않습니다. PWA로 설치해 오프라인에서도 쓸 수 있습니다.

- 🔒 E2E 암호화 — 서버 운영자도 평문을 볼 수 없음
- ☁️ 본인 Supabase + Vercel에 셀프호스팅 — 데이터 100% 본인 소유
- 📱 PWA — 홈 화면 설치, 오프라인 동작, 멀티 기기 동기화
- ⚡ Next.js (App Router) · TypeScript · Tailwind v4

---

## 설치 (셀프호스팅)

본인 계정에 직접 띄우는 전체 절차는 **[SETUP.md](./SETUP.md)** 에 있습니다 (약 10분, 무료 플랜).

설치 흐름: **이 저장소 [Fork](https://github.com/plusxdev/basic-note/fork) → 본인 Fork를 Vercel에 배포 → 자동 업데이트 켜기**

> **Fork로 설치**해야 원본의 새 버전이 자동으로 따라오는 자동 업데이트가 동작합니다.
> 배포 전에 Supabase 프로젝트를 만들고 `supabase/setup.sql`을 실행해야 합니다. 순서·환경변수·자동 업데이트 설정은 [SETUP.md](./SETUP.md) 참고.

---

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Dexie(IndexedDB) · [@plus-experience/design-system](https://www.npmjs.com/package/@plus-experience/design-system)
