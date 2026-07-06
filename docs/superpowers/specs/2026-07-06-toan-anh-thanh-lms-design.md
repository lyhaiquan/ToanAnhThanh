# Thiết kế LMS "Toán Anh Thành"

Ngày: 2026-07-06 · Trạng thái: Đã duyệt

## Mục tiêu

Hệ thống LMS chia sẻ bài giảng video cho lớp Toán Anh Thành, gồm web app và desktop app (Electron), với các tính năng AI (tích hợp open-notebook), phân quyền RBAC admin/học sinh, và cơ chế bảo vệ nội dung video.

## Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| AI backend | Mock adapter trước; kiến trúc sẵn sàng cho open-notebook khi có LLM API key |
| Desktop | Electron bọc web, một codebase |
| Triển khai | Chạy local để demo (SQLite, không cần Docker) |
| Video nguồn | Video MP4 mẫu công khai; `GoogleDriveProvider` code sẵn chờ credentials |
| Ngôn ngữ UI | Tiếng Việt, branding "Toán Anh Thành" |

## Kiến trúc

Monorepo (npm workspaces):

```
apps/web       React 18 + Vite + TypeScript + TailwindCSS + Zustand + React Router
apps/server    Node.js + Express + TypeScript + Prisma + SQLite + JWT
apps/desktop   Electron (loadURL vào web), setContentProtection
packages/shared  Types + hằng số dùng chung (roles, event types, API contracts)
```

### Nguyên tắc mở rộng

- **Module hóa theo domain** trong server: `auth`, `users`, `courses`, `lessons`, `quiz`, `ai`, `storage`, `security`, `analytics`. Mỗi module: router + service + không import chéo trực tiếp (qua service interface).
- **Adapter pattern** cho phần dễ thay đổi:
  - `AIProvider` interface → `MockAIProvider` (mặc định) | `OpenNotebookProvider` (REST tới open-notebook, bật qua `AI_PROVIDER=opennotebook` trong `.env`).
  - `StorageProvider` interface → `LocalStorageProvider` (mặc định) | `GoogleDriveProvider` (stub hoàn chỉnh, chờ OAuth credentials).

## Mô hình dữ liệu (Prisma)

- `User`: id, email, password (bcrypt), name, role (ADMIN|STUDENT), status (ACTIVE|BANNED), createdAt
- `Course` → `Chapter` (order) → `Lesson` (order, videoSource, videoRef, description, materials)
- `Quiz` (thuộc Lesson): passScore (mặc định 70), `Question` (đề, 4 lựa chọn, đáp án, giải thích)
- `QuizAttempt`: user, quiz, answers, score, passed, at
- `Progress`: user, lesson, videoWatchedSec, completed (quiz passed)
- `Enrollment`: user ↔ course
- `ActivityLog`: user, type (LOGIN, LOGOUT, VIDEO_PLAY, VIDEO_PAUSE, VIDEO_SEEK, QUIZ_START, QUIZ_SUBMIT, PAGE_VIEW, ...), metadata JSON, at
- `SecurityEvent`: user, type (DEVTOOLS_OPENED, SCREEN_CAPTURE_DETECTED, CONTEXT_MENU, SUSPICIOUS_KEY), detail, at — hiển thị nổi bật cho admin

## Tính năng AI (qua AIProvider)

1. **Phân tích bài giảng**: tóm tắt, khái niệm chính, mục tiêu học tập
2. **Sinh bài tập tương tự**: từ nội dung bài, sinh bài tập luyện thêm
3. **Chatbot hỏi đáp**: chat theo ngữ cảnh bài học
4. **Sinh slide**: dàn slide từ nội dung bài giảng (render HTML slide viewer)
5. **Quiz cuối bài + chấm điểm**: sinh quiz, chấm tự động; **gate**: đạt `passScore` mới mở bài kế tiếp

`MockAIProvider` trả dữ liệu toán mẫu thật (chuẩn bị sẵn theo lesson) để demo dùng được đầy đủ luồng.

## RBAC & Admin

- JWT (access 15 phút + refresh); middleware `requireRole('ADMIN')`.
- Admin: dashboard thống kê (tổng học sinh, tiến độ theo khóa/chương, tỉ lệ đạt quiz, hoạt động gần đây), CRUD học sinh (thêm/xóa/ban/mở ban), upload video **kéo-thả vào chương** (dropzone → gán thẳng lesson vào chapter), timeline hoạt động chi tiết từng học sinh, danh sách SecurityEvent.
- Học sinh: xem khóa học, học tuần tự theo gate, dùng tính năng AI, xem tiến độ bản thân.

## Bảo mật nội dung

- **Video streaming**: endpoint `/api/stream/:lessonId?token=...` — token HMAC ký ngắn hạn (60s, gắn userId), hỗ trợ Range request. URL thật của file không bao giờ ra client.
- **Watermark động**: overlay email + timestamp di chuyển ngẫu nhiên trên video (CSS layer, pointer-events none).
- **Web deterrents**: chặn context menu, F12/Ctrl+Shift+I/Ctrl+U/Ctrl+S; phát hiện DevTools (heuristic kích thước cửa sổ + debugger timing) → logout tức thì + POST SecurityEvent.
- **Desktop (Electron)**: `win.setContentProtection(true)` (quay/chụp màn hình ra màn đen trên Windows/macOS); chặn `getDisplayMedia`; phát hiện ý định quay → logout + SecurityEvent. Ghi chú trung thực: trên **web thuần** không thể chặn quay màn hình 100% — desktop app là kênh chặn cứng.
- Ghi `ActivityLog` mọi hành vi chính để admin theo dõi.

## Giao diện

- LMS sáng, hiện đại; palette tươi (xanh dương/cam), dark/light toggle (persist localStorage).
- Trang: Đăng nhập, Trang chủ khóa học, Trang học (video + tab AI: phân tích/bài tập/chat/slide + quiz), Tiến độ của tôi; Admin: Dashboard, Học sinh, Nội dung (kéo-thả), Giám sát.

## Dữ liệu demo (seed)

- Khóa "Toán 12": 3 chương (Hàm số, Mũ – Logarit, Nguyên hàm – Tích phân), mỗi chương 2–3 bài; video MP4 mẫu công khai; quiz toán thật mỗi bài; 1 admin (`admin@toananhthanh.vn` / `Admin@123`), 3 học sinh mẫu (`hocsinh1..3@gmail.com` / `Hocsinh@123`).

## Kiểm thử

- Server: unit test cho auth, gate logic (quiz pass → mở bài), token stream hết hạn, RBAC middleware (Vitest + supertest).
- Chạy demo: `npm run dev` (server + web đồng thời), `npm run desktop` cho Electron.

## Ngoài phạm vi (giai đoạn này)

- Thanh toán, thông báo email, mobile app, DRM Widevine, deploy production, ffmpeg burn-in watermark server-side.
