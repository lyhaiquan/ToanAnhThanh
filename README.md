# 📐 Toán Anh Thành — LMS

Nền tảng học toán trực tuyến: web + desktop, bài giảng video theo chương, quiz gate, tính năng AI, giám sát học sinh và bảo vệ nội dung.

## Chạy demo

```bash
npm install
npm run seed -w apps/server        # nếu chưa có dữ liệu (dev.db đã seed sẵn khi clone lần đầu thì bỏ qua)
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
npm run desktop   # cần server + web đang chạy
```

**Tests:** `npm test` (17 tests: auth, RBAC, stream token, quiz gate)

## Kiến trúc

```
apps/web       React + Vite + Tailwind — giao diện LMS (sáng/tối, tiếng Việt)
apps/server    Express + Prisma + SQLite — API, module hóa theo domain
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

## Knowledge graph

`graphify-out/` chứa graph kiến trúc dự án (HTML + Obsidian vault). Cập nhật: `/graphify . --update`
