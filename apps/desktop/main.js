// Desktop app Toán Anh Thành — kênh chặn cứng chống quay màn hình.
// setContentProtection(true): mọi phần mềm quay/chụp màn hình chỉ thấy màn đen
// (Windows: SetWindowDisplayAffinity, macOS: NSWindowSharingNone).
//
// Vỏ mỏng: địa chỉ server lưu trong config.json (userData). Chưa có → trang
// settings nội bộ; đổi lại bất kỳ lúc nào bằng Ctrl+Alt+S.
const { app, BrowserWindow, session, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const IS_DEV = !!process.env.TAT_DEV;

const configPath = () => path.join(app.getPath('userData'), 'config.json');

function readConfig() {
  try {
    // strip BOM — file có thể được sửa tay bằng Notepad
    return JSON.parse(fs.readFileSync(configPath(), 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}

function writeConfig(patch) {
  const next = { ...readConfig(), ...patch };
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

// "192.168.1.10:4000" → "http://192.168.1.10:4000"; bỏ dấu / thừa cuối
function normalizeServerUrl(raw) {
  let url = String(raw || '').trim().replace(/\/+$/, '');
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Toán Anh Thành',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: IS_DEV, // production: không mở được DevTools
    },
  });

  // Chống quay màn hình / chụp màn hình ở tầng hệ điều hành
  win.setContentProtection(true);

  // Chặn mọi yêu cầu chia sẻ màn hình từ trong trang
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    callback({}); // từ chối — không cấp nguồn video nào
  });

  const serverUrl = process.env.TAT_WEB_URL || readConfig().serverUrl;
  if (serverUrl) {
    win.loadURL(serverUrl);
  } else {
    win.loadFile(path.join(__dirname, 'settings.html'));
  }

  // Server chết / sai địa chỉ → quay về trang settings thay vì màn hình lỗi trắng
  win.webContents.on('did-fail-load', (_e, code, _desc, _url, isMainFrame) => {
    if (isMainFrame && code !== -3 /* ERR_ABORTED: điều hướng bình thường */) {
      win.loadFile(path.join(__dirname, 'settings.html'));
    }
  });

  win.webContents.on('before-input-event', (event, input) => {
    // Chặn F12 / Ctrl+Shift+I ngay ở tầng Electron
    if (!IS_DEV && (input.key === 'F12' || (input.control && input.shift && input.key.toUpperCase() === 'I'))) {
      event.preventDefault();
    }
    // Ctrl+Alt+S: mở lại trang cấu hình server
    if (input.type === 'keyDown' && input.control && input.alt && input.key.toUpperCase() === 'S') {
      event.preventDefault();
      win.loadFile(path.join(__dirname, 'settings.html'));
    }
  });

  return win;
}

// IPC cho trang settings — chỉ nhận lệnh từ trang nội bộ (file://), không cho
// trang web remote ghi đè config.
const fromSettingsPage = (e) => e.senderFrame && e.senderFrame.url.startsWith('file://');

ipcMain.handle('settings:get', (e) => {
  if (!fromSettingsPage(e)) return null;
  return readConfig().serverUrl || '';
});

ipcMain.handle('settings:save', async (e, rawUrl) => {
  if (!fromSettingsPage(e)) return { ok: false, error: 'Không được phép.' };
  const url = normalizeServerUrl(rawUrl);
  if (!url) return { ok: false, error: 'Địa chỉ không hợp lệ. VD: http://192.168.1.10:4000' };
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
    const body = await res.json();
    if (!body || body.ok !== true) throw new Error('bad payload');
  } catch {
    return { ok: false, error: 'Không kết nối được server Toán Anh Thành tại địa chỉ này. Kiểm tra lại địa chỉ và mạng.' };
  }
  writeConfig({ serverUrl: url });
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win) win.loadURL(url);
  return { ok: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
