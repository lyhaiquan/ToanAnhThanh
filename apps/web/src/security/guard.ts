import { reportSecurityEvent } from '../lib/api';
import { useAuth } from '../lib/store';

/**
 * Security guard cho học sinh (không áp dụng cho admin):
 * - Chặn chuột phải, các phím mở DevTools / view-source / save / print
 * - Phát hiện DevTools mở (heuristic kích thước cửa sổ) → báo cáo + đăng xuất
 * - Chặn getDisplayMedia (quay màn hình qua trình duyệt) → báo cáo + đăng xuất
 *
 * Lưu ý trung thực: trên web thuần đây là các biện pháp GÂY KHÓ (deterrent).
 * Chặn tuyệt đối quay màn hình chỉ có ở app desktop (Electron content protection).
 */

let installed = false;

function punish(type: string, detail: string) {
  reportSecurityEvent(type, detail);
  // Cho request kịp đi rồi mới logout + đá về trang đăng nhập
  setTimeout(() => {
    useAuth.getState().logout();
    window.location.href = '/login?reason=security';
  }, 300);
}

export function installGuard() {
  if (installed) return;
  installed = true;

  document.addEventListener('contextmenu', (e) => {
    if (useAuth.getState().user?.role !== 'STUDENT') return;
    e.preventDefault();
    reportSecurityEvent('CONTEXT_MENU', 'Chuột phải bị chặn');
  });

  document.addEventListener('keydown', (e) => {
    if (useAuth.getState().user?.role !== 'STUDENT') return;
    const combo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toUpperCase()}`;
    const banned = ['F12', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C', 'Ctrl+U', 'Ctrl+S', 'Ctrl+P'];
    if (banned.includes(e.key === 'F12' ? 'F12' : combo)) {
      e.preventDefault();
      if (e.key === 'F12' || combo === 'Ctrl+Shift+I') {
        punish('SUSPICIOUS_KEY', `Tổ hợp phím: ${e.key === 'F12' ? 'F12' : combo}`);
      } else if (combo === 'Ctrl+P') {
        reportSecurityEvent('PRINT_ATTEMPT', 'Ctrl+P bị chặn');
      } else {
        reportSecurityEvent('SUSPICIOUS_KEY', `Tổ hợp phím: ${combo}`);
      }
    }
  });

  // DevTools heuristic: chênh lệch outer/inner tăng ĐỘT NGỘT so với baseline.
  // Dùng baseline + đổi mức thay vì ngưỡng tuyệt đối để tránh oan cho
  // webview nhúng (Electron/preview) và trình duyệt đang zoom.
  // Cần 2 lần phát hiện liên tiếp khi tab đang focus mới xử phạt.
  let baseW = window.outerWidth - window.innerWidth;
  let baseH = window.outerHeight - window.innerHeight;
  let strikes = 0;
  setInterval(() => {
    if (useAuth.getState().user?.role !== 'STUDENT' || !document.hasFocus()) return;
    const dW = window.outerWidth - window.innerWidth;
    const dH = window.outerHeight - window.innerHeight;
    const jump = 170;
    if (dW - baseW > jump || dH - baseH > jump) {
      strikes++;
      if (strikes >= 2) {
        punish('DEVTOOLS_OPENED', `delta tăng từ ${baseW}x${baseH} lên ${dW}x${dH}`);
      }
    } else {
      strikes = 0;
      // Trượt baseline chậm để thích ứng resize cửa sổ bình thường
      baseW = Math.min(baseW, dW);
      baseH = Math.min(baseH, dH);
    }
  }, 1500);

  // Chặn quay màn hình qua browser API
  if (navigator.mediaDevices?.getDisplayMedia) {
    navigator.mediaDevices.getDisplayMedia = async function () {
      if (useAuth.getState().user?.role === 'STUDENT') {
        punish('SCREEN_CAPTURE_DETECTED', 'getDisplayMedia bị gọi');
        throw new DOMException('Screen capture blocked', 'NotAllowedError');
      }
      return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    } as typeof navigator.mediaDevices.getDisplayMedia;
  }
}
