# Đóng gói Desktop (Windows installer) — Design

**Ngày:** 2026-07-07 · **Trạng thái:** Approved

## Mục tiêu

Đóng gói `apps/desktop` (Electron) thành installer Windows (.exe, NSIS) phát cho học sinh. Địa chỉ server **nhập được khi mở app lần đầu** (không ghi cứng), lưu lại và đổi được về sau.

## Phương án đã chọn: Thin shell (A)

- **Server phục vụ luôn web build**: Express serve tĩnh `apps/web/dist` + SPA fallback (trừ `/api/*`). Một địa chỉ `http://server:4000` vừa là API vừa là giao diện → `api.ts` giữ nguyên (`/api` cùng origin), cập nhật giao diện chỉ cần deploy server, không phát lại installer.
- **Electron là vỏ mỏng**: đọc `config.json` trong `app.getPath('userData')`. Chưa có `serverUrl` → mở trang settings nội bộ (HTML tiếng Việt, kiểm tra `GET /api/health` trước khi lưu). Có rồi → `loadURL(serverUrl)`. Giữ nguyên toàn bộ content protection (setContentProtection, chặn display media, chặn F12, devTools tắt prod).
- **Health endpoint**: `GET /api/health` → `{ ok: true, name: 'toan-anh-thanh' }` để app xác nhận đúng server.
- **Đóng gói**: `electron-builder`, target NSIS x64, output `apps/desktop/release/`. Đổi server sau này: phím tắt `Ctrl+Alt+S` mở lại trang settings.

## Phương án loại

- **B — nhúng web vào app**: phải sửa api.ts/stream URL sang absolute + CORS, và mỗi lần sửa UI phải phát lại installer → loại.

## Kiểm chứng

Build web → chạy server → cài installer trên máy này → nhập địa chỉ server, login học sinh, xem video, đổi địa chỉ server. Tests server vẫn xanh.

## Sau khi xong

Cập nhật README (mục đóng gói desktop) + ghi trạng thái vào vault Obsidian.
