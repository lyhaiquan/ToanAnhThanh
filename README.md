# 📐 Toán Anh Thành — LMS

Nền tảng học toán trực tuyến: web + desktop, bài giảng video theo chương, quiz gate, tính năng AI, giám sát học sinh và bảo vệ nội dung.

## Chạy demo

Cần **PostgreSQL** (14+). Tạo database và file env trước:

```bash
# 1. Tạo DB (psql):  CREATE DATABASE toananhthanh;
# 2. Cấu hình kết nối:
cp apps/server/.env.example apps/server/.env   # sửa DATABASE_URL (mật khẩu có @ thì encode thành %40)

npm install
npx prisma migrate deploy --schema apps/server/prisma/schema.prisma  # tạo bảng
npm run seed -w apps/server        # dữ liệu mẫu (admin + 3 HS + khóa Toán 12)
npm run fetch-media -w apps/server # tải video mẫu (lần đầu)
npm run dev                        # server :4000 + web :5173
```

Mở http://localhost:5173

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| admin@toananhthanh.vn | Admin@123 | Quản trị |
| hocsinh1@gmail.com (…2, 3) | Hocsinh@123 | Học sinh |

**Desktop (chống quay màn hình thật):**

```bash
npm run desktop   # chế độ dev: cần server + web đang chạy
```

## Đóng gói desktop cho học sinh

```bash
npm run desktop:dist   # build web + đóng gói installer Windows (NSIS)
```

Kết quả: `apps/desktop/release/Toan-Anh-Thanh-Setup-1.0.0.exe` — phát file này cho học sinh.
Học sinh cài xong, lần đầu mở app sẽ nhập **địa chỉ server** (VD `http://192.168.1.10:4000`
hoặc domain đã deploy) — app kiểm tra kết nối rồi lưu lại; đổi server bằng **Ctrl+Alt+S**.

App đóng gói là "vỏ mỏng": giao diện web do server phục vụ (server tự serve `apps/web/dist`
khi đã build), nên **cập nhật giao diện chỉ cần deploy lại server**, không phải phát lại installer.

Sự cố build thường gặp trên Windows:
- `7za.exe` biến mất (Defender xóa nhầm): copy `7z.exe`+`7z.dll` từ 7-Zip hệ thống vào
  `node_modules/7zip-bin/win/x64/` (đổi tên thành `7za.exe`), hoặc thêm exclusion cho thư mục dự án.
- `Cannot create symbolic link` khi giải nén winCodeSign: bật Developer Mode, hoặc tự giải nén
  file 7z đó vào `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0` (2 symlink
  macOS lỗi thì kệ).
- `app.asar ... being used by another process`: thư mục output đang bị phần mềm khác giữ (AV,
  file watcher) — build ra chỗ khác: `electron-builder --win -c.directories.output=D:\Temp\tat-release`.

**Tests:** `npm test` (33 tests: auth, RBAC, stream token, quiz gate, device binding, resilience/batching — cần DATABASE_URL trỏ DB Postgres)

## Kiến trúc

```
apps/web       React + Vite + Tailwind — giao diện LMS (sáng/tối, tiếng Việt)
apps/server    Express + Prisma + PostgreSQL — API, module hóa theo domain
apps/desktop   Electron — setContentProtection chống quay/chụp màn hình
packages/shared Types + labels dùng chung
```

### Bật AI thật (open-notebook)

Mặc định dùng `MockAIProvider` (dữ liệu toán mẫu, chạy không cần key). Khi có LLM API key:

1. Chạy open-notebook: `docker run -p 5055:5055 lfnovo/open_notebook:latest-single`
2. Cấu hình model + API key trong giao diện open-notebook
3. Đặt env cho server: `AI_PROVIDER=opennotebook`, `ON_API_URL=http://localhost:5055`

### Bật Google Drive

Mặc định video lưu local (`apps/server/media|uploads`). Khi có Drive:
đặt `STORAGE_PROVIDER=gdrive`, `GDRIVE_CREDENTIALS_PATH`, `GDRIVE_FOLDER_ID`
(hướng dẫn chi tiết trong `apps/server/src/modules/storage/gdrive.ts`).

## Bảo mật nội dung

- Video stream qua token HMAC 60 giây gắn user — không lộ URL file thật
- Watermark động (email + giờ) trôi trên video
- Web: chặn F12/chuột phải/Ctrl+U/S/P, phát hiện DevTools → **đăng xuất + báo admin**
- Desktop: `setContentProtection(true)` — quay màn hình chỉ thấy màn đen
- Mọi hành vi (play/pause/seek/quiz/đăng nhập) ghi log cho admin xem ở trang Giám sát

> Lưu ý trung thực: trên **web thuần**, chặn quay màn hình 100% là bất khả thi về mặt kỹ thuật —
> các biện pháp web là "gây khó + phát hiện + báo cáo". Kênh chặn cứng là app desktop.

## Giám sát & chống tấn công

- **Metrics Prometheus** tại `GET /metrics` (bảo vệ bằng env `METRICS_TOKEN`): request rate/latency,
  login thất bại, sự kiện bảo mật, buffer log. Gói giám sát đầy đủ (Prometheus + Grafana +
  node-exporter + luật cảnh báo dò mật khẩu/5xx/đĩa cạn) ở [`deploy/monitoring/`](deploy/monitoring/README.md).
- **Chống brute-force login:** giới hạn 10 lần sai/15 phút theo cặp (IP + email) — cả lớp chung
  NAT trường học không chặn nhầm nhau; trần 500 req/15ph/IP chống rải email.
- **Helmet**: bộ header bảo vệ chuẩn, ẩn dấu vết Express.
- Đã có từ trước: JWT + RBAC, bcrypt, device binding, stream token HMAC, log mọi hành vi.

## Chịu tải

Đã load test 100 kết nối đồng thời (autocannon, 2026-07-07, sau khi chuyển PostgreSQL):
đọc API ~730 req/s; ghi activity log ~1.500 req/s (đệm RAM, flush batch 2s — xem
`modules/security/logbuffer.ts`); stream video ~87 MB/s. Async error trong route được
`express-async-errors` đưa về error handler (trả 500, không chết process). Login bcrypt
~6 req/s là điểm chậm chủ đích (chống brute-force).

## Knowledge graph

`graphify-out/` chứa graph kiến trúc dự án (HTML + Obsidian vault). Cập nhật: `/graphify . --update`
