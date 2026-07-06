// Desktop app Toán Anh Thành — kênh chặn cứng chống quay màn hình.
// setContentProtection(true): mọi phần mềm quay/chụp màn hình chỉ thấy màn đen
// (Windows: SetWindowDisplayAffinity, macOS: NSWindowSharingNone).
const { app, BrowserWindow, session } = require('electron');

const WEB_URL = process.env.TAT_WEB_URL || 'http://localhost:5173';
const IS_DEV = !!process.env.TAT_DEV;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Toán Anh Thành',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: IS_DEV, // production: không mở được DevTools
    },
  });

  // Chống quay màn hình / chụp màn hình ở tầng hệ điều hành
  win.setContentProtection(true);

  // Chặn mọi yêu cầu chia sẻ màn hình từ trong trang
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    callback({}); // từ chối — không cấp nguồn video nào
  });

  win.loadURL(WEB_URL);

  win.webContents.on('before-input-event', (event, input) => {
    // Chặn F12 / Ctrl+Shift+I ngay ở tầng Electron
    if (!IS_DEV && (input.key === 'F12' || (input.control && input.shift && input.key.toUpperCase() === 'I'))) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
