export type Role = 'ADMIN' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'BANNED';

export type ActivityType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAGE_VIEW'
  | 'VIDEO_PLAY'
  | 'VIDEO_PAUSE'
  | 'VIDEO_SEEK'
  | 'VIDEO_ENDED'
  | 'QUIZ_START'
  | 'QUIZ_SUBMIT'
  | 'AI_ANALYZE'
  | 'AI_EXERCISES'
  | 'AI_CHAT'
  | 'AI_SLIDES';

export type SecurityEventType =
  | 'DEVTOOLS_OPENED'
  | 'SCREEN_CAPTURE_DETECTED'
  | 'CONTEXT_MENU'
  | 'SUSPICIOUS_KEY'
  | 'PRINT_ATTEMPT';

export const SECURITY_EVENT_LABELS: Record<SecurityEventType, string> = {
  DEVTOOLS_OPENED: 'Mở DevTools (F12)',
  SCREEN_CAPTURE_DETECTED: 'Phát hiện quay màn hình',
  CONTEXT_MENU: 'Chuột phải trên video',
  SUSPICIOUS_KEY: 'Tổ hợp phím đáng ngờ',
  PRINT_ATTEMPT: 'Cố gắng in trang',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  PAGE_VIEW: 'Xem trang',
  VIDEO_PLAY: 'Phát video',
  VIDEO_PAUSE: 'Tạm dừng video',
  VIDEO_SEEK: 'Tua video',
  VIDEO_ENDED: 'Xem hết video',
  QUIZ_START: 'Bắt đầu quiz',
  QUIZ_SUBMIT: 'Nộp quiz',
  AI_ANALYZE: 'Phân tích bài giảng',
  AI_EXERCISES: 'Xem bài tập tương tự',
  AI_CHAT: 'Hỏi đáp chatbot',
  AI_SLIDES: 'Xem slide bài giảng',
};

export const DEFAULT_PASS_SCORE = 70;
