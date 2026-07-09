# Thiết kế: Lớp học trực tuyến (Live Session)

**Ngày:** 2026-07-09
**Trạng thái:** Đã duyệt, chờ viết plan triển khai

## Bối cảnh

LMS "Toán Anh Thành" hiện chỉ có mô hình học không đồng bộ: video bài giảng ghi sẵn theo chương + quiz gate. Tính năng này thêm khả năng tổ chức **lớp học trực tiếp (live)** — giáo viên (dùng chung tài khoản ADMIN, không thêm vai trò TEACHER) tạo buổi học theo lịch, mời học sinh cụ thể, học sinh vào lớp qua link Google Meet/Zoom có sẵn.

## Phạm vi (đã chốt qua brainstorming)

- **Không xây hạ tầng video riêng** — chỉ nhúng/hiển thị link Meet hoặc Zoom do admin dán vào, LMS không truyền video.
- **Host = ADMIN** — không thêm vai trò TEACHER mới, dùng RBAC hiện có (`ADMIN | STUDENT`).
- **Buổi live độc lập, không gắn Course** — không ràng buộc vào enrollment của khóa học nào.
- **Admin mời tay từng học sinh** — chọn danh sách cụ thể mỗi khi tạo buổi, không mặc định mời toàn bộ học sinh ACTIVE.
- **Link hiện ngay sau khi mời** — không có logic khóa link theo thời gian (không giống trải nghiệm Zoom thật "chỉ mở gần giờ").
- **Có điểm danh** — ghi nhận thời điểm học sinh bấm "Vào lớp" (chỉ biết học sinh đã mở link, không biết có ở lại phòng Meet/Zoom hay không).
- **Không có hệ thống thông báo/nhắc nhở** — hệ thống hiện chưa có notification nào; học sinh tự vào trang "Lớp học live" để xem lịch được mời. Ngoài phạm vi thiết kế này.

## Kiến trúc

Module mới `apps/server/src/modules/live/` theo đúng pattern các module hiện có (`courses`, `quiz`...):
- `router.ts` — các route Express
- `access.ts` — hàm kiểm soát quyền tập trung, mirror `courses/access.ts` (nguyên tắc đã áp dụng cho lesson: mọi route đụng tới 1 buổi live cụ thể phải qua `ensureLiveSessionAccess`)

## Data model (Prisma)

```prisma
model LiveSession {
  id              String   @id @default(cuid())
  title           String
  description     String   @default("")
  scheduledAt     DateTime
  durationMinutes Int      @default(60)
  meetingLink     String
  status          String   @default("SCHEDULED") // SCHEDULED | CANCELLED
  createdById     String
  createdBy       User     @relation("LiveSessionCreator", fields: [createdById], references: [id])
  invites         LiveSessionInvite[]
  createdAt       DateTime @default(now())

  @@index([scheduledAt])
}

model LiveSessionInvite {
  id            String      @id @default(cuid())
  liveSessionId String
  liveSession   LiveSession @relation(fields: [liveSessionId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt      DateTime?   // điểm danh: null = chưa bấm "Vào lớp"

  @@unique([liveSessionId, userId])
}
```

Thêm relation trên `User`: `liveSessionsCreated LiveSession[] @relation("LiveSessionCreator")`, `liveSessionInvites LiveSessionInvite[]`.

**Trạng thái hiển thị** ("sắp tới" / "đang diễn ra" / "đã qua") được **tính lúc trả response** từ `scheduledAt` + `durationMinutes` so với thời gian hiện tại — không lưu thành state máy. Chỉ `status: CANCELLED` là trạng thái lưu thật trong DB, vì đó là hành động chủ động của admin.

## Access control (`access.ts`)

```
checkLiveSessionAccess(user, sessionId):
  - session không tồn tại → 404
  - user.role === 'ADMIN' → ok
  - else: phải có LiveSessionInvite(sessionId, user.id) VÀ session.status !== 'CANCELLED'
    nếu không → 403 ("Bạn không được mời vào buổi học này" / "Buổi học đã bị hủy")
```

`ensureLiveSessionAccess(req, res, sessionId)` — tiện ích tự gửi lỗi, dùng trong mọi route học sinh đụng tới 1 session cụ thể (trước hết là `join`).

## API

### Admin (`requireAuth`, `requireRole('ADMIN')`)

| Method | Path | Việc làm |
|---|---|---|
| POST | `/api/live-sessions` | Tạo buổi: `{ title, description?, scheduledAt, durationMinutes?, meetingLink, studentIds: string[] }`. Validate: `meetingLink` phải là URL http(s) hợp lệ (chặn `javascript:` và scheme khác); `studentIds` không rỗng, mỗi id phải ứng với user `role=STUDENT, status=ACTIVE` đang tồn tại, nếu không → 400. |
| GET | `/api/live-sessions` | Danh sách tất cả buổi (mới nhất trước), kèm số học sinh mời + số đã điểm danh. |
| GET | `/api/live-sessions/:id` | Chi tiết buổi + danh sách học sinh mời kèm `joinedAt` (điểm danh). |
| PATCH | `/api/live-sessions/:id` | Sửa thông tin (title/description/scheduledAt/durationMinutes/meetingLink) hoặc set `status: 'CANCELLED'`. Không cho sửa nếu đã `CANCELLED`. |

### Học sinh (`requireAuth`)

| Method | Path | Việc làm |
|---|---|---|
| GET | `/api/live-sessions/mine` | Buổi mà `req.user.id` được mời, kèm trạng thái tính toán (`upcoming` / `ongoing` / `past` / `cancelled`), sắp theo `scheduledAt` giảm dần. |
| POST | `/api/live-sessions/:id/join` | Qua `ensureLiveSessionAccess`. Nếu `joinedAt` đang null thì set `now()` (idempotent — bấm nhiều lần không đổi lần điểm danh đầu). Trả về `{ meetingLink }` để frontend mở tab mới. |

## Frontend

- **`apps/web/src/pages/admin/LiveSessions.tsx`** — bảng danh sách buổi (tiêu đề, thời gian, số mời/đã vào, trạng thái). Nút "Tạo buổi mới" mở form: tiêu đề, mô tả, thời gian, thời lượng, link, ô chọn nhiều học sinh (lấy từ danh sách user hiện có, lọc `STUDENT` + `ACTIVE`). Mỗi dòng có hành động "Xem điểm danh" (mở danh sách học sinh mời kèm `joinedAt`) và "Hủy buổi".
- **`apps/web/src/pages/student/LiveClasses.tsx`** — danh sách buổi được mời, nhóm theo "Sắp tới" / "Đã qua". Mỗi thẻ hiện tiêu đề, mô tả, thời gian, và nút "Vào lớp" (gọi `POST /join` rồi `window.open(meetingLink, '_blank')`). Buổi `CANCELLED` hiện badge "Đã hủy", ẩn nút vào lớp.
- Thêm mục điều hướng "Lớp học live" vào sidebar admin và sidebar học sinh (`apps/web/src/components`).

## Testing

File mới `apps/server/test/live-session.test.ts`, theo pattern các test hiện có (`access-control.test.ts`, `auth.test.ts`):

1. ADMIN tạo buổi thành công kèm danh sách mời.
2. STUDENT không tạo được buổi (403).
3. Học sinh được mời thấy buổi trong `GET /mine`; học sinh không được mời thì không thấy.
4. `POST /:id/join` ghi `joinedAt` đúng lần đầu; gọi lại không đổi giá trị (idempotent).
5. Học sinh không được mời gọi `POST /:id/join` → 403.
6. Buổi bị hủy (`status=CANCELLED`) chặn `join` → 403, và `GET /mine` trả trạng thái `cancelled`.
7. `meetingLink` không phải `http://`/`https://` (ví dụ `javascript:alert(1)`) bị từ chối khi tạo (400).
8. Mời một id không phải STUDENT-ACTIVE (id không tồn tại, id của ADMIN, hoặc học sinh bị BANNED) bị từ chối khi tạo (400).

## Ngoài phạm vi (không làm trong thiết kế này)

- Không xây WebRTC/truyền video riêng.
- Không thêm vai trò TEACHER.
- Không có hệ thống thông báo/nhắc nhở (badge, email...).
- Không ghi âm/lưu lại buổi live thành bài giảng on-demand.
- Không gắn buổi live vào Course/Enrollment.
