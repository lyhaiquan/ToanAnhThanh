# Toán Anh Thành LMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LMS web + desktop chia sẻ bài giảng video theo chương, tích hợp AI (mock/open-notebook), RBAC, quiz gate, bảo vệ video.

**Architecture:** npm-workspaces monorepo. Server Express+Prisma+SQLite là nguồn sự thật; web React SPA gọi REST; desktop Electron loadURL vào web và bật content protection. Adapter pattern cho AI và Storage.

**Tech Stack:** TypeScript, Express 4, Prisma 5 + SQLite, jsonwebtoken, bcryptjs, React 18, Vite 5, TailwindCSS 3, Zustand, React Router 6, Electron 31, Vitest + Supertest.

---

## File Structure

```
package.json                     # workspaces: apps/*, packages/*
packages/shared/src/index.ts     # Role, ActivityType, SecurityEventType, DTO types
apps/server/
  prisma/schema.prisma
  prisma/seed.ts                 # admin + 3 HS, khóa Toán 12, 3 chương, quiz
  src/index.ts                   # bootstrap, mount routers
  src/config.ts                  # env: JWT_SECRET, AI_PROVIDER, STORAGE_PROVIDER, PASS_SCORE
  src/middleware/auth.ts         # requireAuth, requireRole
  src/modules/auth/{router,service}.ts
  src/modules/users/router.ts    # admin CRUD + ban
  src/modules/courses/router.ts  # course/chapter/lesson CRUD, cấu trúc cây
  src/modules/quiz/{router,service}.ts   # attempt, chấm điểm, gate check
  src/modules/progress/router.ts
  src/modules/ai/{provider.ts,mock.ts,opennotebook.ts,router.ts}
  src/modules/storage/{provider.ts,local.ts,gdrive.ts,router.ts}  # upload kéo-thả
  src/modules/stream/{token.ts,router.ts}  # HMAC signed URL + Range streaming
  src/modules/security/router.ts # ActivityLog + SecurityEvent ingest & query
  src/modules/analytics/router.ts# dashboard stats
  test/{auth,gate,streamtoken,rbac}.test.ts
apps/web/
  src/main.tsx, App.tsx, index.css
  src/lib/{api.ts,store.ts,theme.ts}
  src/security/guard.ts          # F12/devtools/context-menu → logout + report
  src/components/{Layout,VideoPlayer(watermark),QuizPanel,AIPanel,SlideViewer,...}
  src/pages/{Login,Home,CourseDetail,LessonPage,MyProgress}
  src/pages/admin/{Dashboard,Students,Content,Monitor}
apps/desktop/main.js             # BrowserWindow + setContentProtection(true)
```

## Contracts (dùng thống nhất mọi task)

```ts
// packages/shared — Role: 'ADMIN'|'STUDENT'
// AIProvider (apps/server/src/modules/ai/provider.ts)
interface AIProvider {
  analyzeLecture(lessonId: string): Promise<{summary: string; concepts: string[]; objectives: string[]}>;
  generateExercises(lessonId: string): Promise<{question: string; hint: string; solution: string}[]>;
  chat(lessonId: string, history: {role:'user'|'assistant'; content:string}[]): Promise<string>;
  generateSlides(lessonId: string): Promise<{title: string; bullets: string[]}[]>;
}
// StorageProvider (modules/storage/provider.ts)
interface StorageProvider {
  save(file: Buffer, filename: string): Promise<string>;       // → videoRef
  createReadStream(videoRef: string, range?: {start:number; end:number}): { stream: NodeJS.ReadableStream; size: number };
}
// Stream token (modules/stream/token.ts)
signStreamToken(userId: string, lessonId: string): string      // HMAC-SHA256, exp 60s
verifyStreamToken(token: string): {userId; lessonId} | null
// Gate (modules/quiz/service.ts)
isLessonUnlocked(userId, lessonId): Promise<boolean>  // bài đầu chương đầu luôn mở; còn lại cần QuizAttempt.passed của bài liền trước
```

---

### Task 1: Monorepo scaffold + shared package
- [ ] Root `package.json` (workspaces), `.gitignore`, `packages/shared` với types. Commit.

### Task 2: Server scaffold + Prisma schema + seed
- [ ] Prisma schema đúng spec (User, Course, Chapter, Lesson, Quiz, Question, QuizAttempt, Progress, Enrollment, ActivityLog, SecurityEvent).
- [ ] `prisma migrate dev`; seed: admin@toananhthanh.vn/Admin@123, 3 HS, khóa Toán 12 (3 chương × 2-3 bài, quiz thật mỗi bài, passScore 70). Video mẫu: tải 2-3 MP4 công khai vào `apps/server/media/` (script), các lesson trỏ videoRef local. Commit.

### Task 3: Auth + RBAC (TDD)
- [ ] Test: login đúng/sai, token refresh, requireRole chặn STUDENT vào route admin, user BANNED không login được. Implement `auth` module + middleware. Run tests xanh. Commit.

### Task 4: Courses + Storage upload
- [ ] Courses router (cây course→chapter→lesson; admin CRUD). Storage: `LocalStorageProvider` + upload endpoint (multer, multipart kéo-thả, gán lesson vào chapter kèm order); `GoogleDriveProvider` stub có TODO credentials rõ ràng ném lỗi hướng dẫn cấu hình. Commit.

### Task 5: Stream token + video streaming (TDD)
- [ ] Test: token hợp lệ trả 206 với Range; token hết hạn/sai user → 403. Implement `stream` module. Commit.

### Task 6: Quiz + gate logic (TDD)
- [ ] Test: submit chấm điểm đúng; <70 → passed=false, bài sau vẫn khóa; ≥70 → mở bài sau; bài đầu tiên luôn mở. Implement quiz service + router + Progress update. Commit.

### Task 7: AI module
- [ ] `provider.ts` interface, `mock.ts` (dữ liệu toán theo lessonId từ seed, fallback generic), `opennotebook.ts` (fetch REST `ON_API_URL`, notebook per lesson — hoạt động khi cấu hình, lỗi rõ ràng khi thiếu env), factory theo `AI_PROVIDER`. Router: analyze/exercises/chat/slides. Commit.

### Task 8: Security + Analytics
- [ ] `security` router: POST /activity, POST /security-event (báo admin), GET (admin, filter theo user). `analytics` router: tổng quan dashboard (số HS, tiến độ %, tỉ lệ pass quiz, hoạt động 7 ngày, security events mới). Commit.

### Task 9: Web scaffold + theme + auth
- [ ] Vite React TS + Tailwind, dark/light toggle (class strategy, persist), api client (axios, interceptor refresh), Zustand store, Login page, Layout (sidebar LMS sáng, branding Toán Anh Thành). Commit.

### Task 10: Student learning UI
- [ ] Home (danh sách khóa + tiến độ), CourseDetail (accordion chương/bài, khóa 🔒 theo gate), LessonPage: VideoPlayer (stream URL xin token mới mỗi lần play, watermark động di chuyển), tabs AI (Phân tích / Bài tập / Chatbot / Slide), QuizPanel cuối bài (nộp → điểm → pass thì toast mở bài sau), MyProgress. Commit.

### Task 11: Security guard client
- [ ] `guard.ts`: chặn contextmenu, F12/Ctrl+Shift+I/J/C, Ctrl+U/S/P; devtools detect (outerWidth delta + debugger timing interval); phát hiện → báo `/security-event` + logout redirect /login?reason=security. Điểm treo `visibilitychange` + `getDisplayMedia` override báo cáo. Chỉ áp cho role STUDENT. Commit.

### Task 12: Admin UI
- [ ] Dashboard (stat cards + bảng tiến độ + security alerts), Students (bảng, thêm/sửa/ban/xóa), Content (cây khóa học, dropzone kéo-thả video vào chương → tạo lesson, sửa quiz), Monitor (timeline hoạt động từng HS, filter, security events đỏ). Commit.

### Task 13: Desktop Electron
- [ ] `apps/desktop/main.js`: BrowserWindow, `setContentProtection(true)`, chặn `setDisplayMediaRequestHandler`, disable devtools trong prod, loadURL `http://localhost:5173` (dev) / bundled (build note). Commit.

### Task 14: Verify end-to-end
- [ ] `npm run dev` chạy server+web; smoke qua preview tools: login admin/HS, xem video, quiz gate, admin dashboard, dark mode. Chạy toàn bộ test server. Fix lỗi phát sinh. Commit cuối + README hướng dẫn chạy.
