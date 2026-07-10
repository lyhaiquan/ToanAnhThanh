import { useEffect, useLayoutEffect, useState } from 'react';

interface Step {
  icon: string;
  title: string;
  body: string;
  /** data-tour của phần tử cần chỉ vào; không có = hiện thẻ giữa màn hình */
  target?: string;
}

const studentSteps: Step[] = [
  {
    icon: '👋',
    title: 'Chào mừng đến với Toán Anh Thành!',
    body: 'Đây là hướng dẫn nhanh giúp em bắt đầu học. Chỉ mất 30 giây — thầy sẽ chỉ từng chỗ trên màn hình nhé.',
  },
  {
    icon: '📚',
    title: 'Xem bài giảng ở đây',
    body: 'Bấm vào "Khóa học", chọn chương rồi bấm vào bài để xem video thầy giảng. Xem xong bài, em làm quiz — đạt điểm yêu cầu thì bài kế tiếp mới mở khóa.',
    target: 'nav-courses',
  },
  {
    icon: '🎥',
    title: 'Lớp học trực tuyến',
    body: 'Khi thầy có buổi dạy live, mục này sẽ hiện chấm đỏ. Vào đây bấm "Vào lớp" để tham gia đúng giờ.',
    target: 'nav-live',
  },
  {
    icon: '📈',
    title: 'Theo dõi tiến độ',
    body: 'Mục này cho biết em đã học tới đâu, điểm quiz từng bài ra sao.',
    target: 'nav-progress',
  },
  {
    icon: '🔑',
    title: 'Đổi mật khẩu',
    body: 'Cần đổi mật khẩu thì bấm nút này. Nên đổi ngay lần đầu đăng nhập cho an toàn.',
    target: 'btn-password',
  },
  {
    icon: '❓',
    title: 'Xem lại hướng dẫn',
    body: 'Quên chỗ nào thì bấm nút này để xem lại hướng dẫn bất cứ lúc nào. Chúc em học tốt! 🎉',
    target: 'btn-guide',
  },
];

const adminSteps: Step[] = [
  {
    icon: '👋',
    title: 'Chào mừng thầy!',
    body: 'Hướng dẫn nhanh các khu vực quản lý chính — mũi tên sẽ chỉ lần lượt từng mục trên menu bên trái.',
  },
  {
    icon: '🎬',
    title: 'Nội dung & bài giảng',
    body: 'Tạo khóa học, thêm chương, kéo-thả (hoặc bấm chọn) video để thêm bài. Bấm "📝 Quiz" cạnh mỗi bài để soạn câu hỏi.',
    target: 'nav-content',
  },
  {
    icon: '🧑‍🎓',
    title: 'Quản lý học sinh',
    body: 'Thêm từng em, hoặc "Thêm hàng loạt" để dán cả danh sách lớp. Có thể đặt lại mật khẩu (🔑) và khóa/mở thiết bị cho học sinh.',
    target: 'nav-students',
  },
  {
    icon: '🎥',
    title: 'Lớp học trực tuyến',
    body: 'Tạo buổi dạy, dán link Zoom/Meet, mời học sinh, và xem điểm danh ai đã vào lớp.',
    target: 'nav-admin-live',
  },
  {
    icon: '🕵️',
    title: 'Giám sát',
    body: 'Theo dõi hoạt động học sinh và cảnh báo bảo mật (mở DevTools, quay màn hình...).',
    target: 'nav-monitor',
  },
  {
    icon: '❓',
    title: 'Xem lại hướng dẫn',
    body: 'Thầy có thể mở lại hướng dẫn này bất cứ lúc nào bằng nút này. Chúc thầy dạy tốt!',
    target: 'btn-guide',
  },
];

const PAD = 6; // khoảng hở giữa phần tử và vùng khoét sáng

export default function OnboardingGuide({ role, onClose }: { role: 'ADMIN' | 'STUDENT'; onClose: () => void }) {
  const steps = role === 'ADMIN' ? adminSteps : studentSteps;
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const last = i === steps.length - 1;
  const step = steps[i];

  // Tìm vị trí phần tử đích mỗi khi đổi bước / đổi kích thước cửa sổ
  useLayoutEffect(() => {
    function measure() {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.target]);

  // Điều khiển bằng bàn phím cho tiện
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !last) setI((v) => v + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI((v) => v - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const hasTarget = !!(step.target && rect);

  // Thẻ chú thích đặt bên phải phần tử (menu nằm sát trái màn hình), kẹp trong khung nhìn
  const cardW = 340;
  const cardStyle = hasTarget
    ? {
        left: Math.min(rect!.right + PAD + 26, window.innerWidth - cardW - 12),
        top: Math.max(12, Math.min(rect!.top + rect!.height / 2 - 90, window.innerHeight - 260)),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[60]" onClick={last ? onClose : () => setI(i + 1)}>
      {/* Vùng khoét sáng: box-shadow phủ tối toàn màn hình trừ phần tử đích */}
      {hasTarget ? (
        <div
          className="absolute rounded-xl transition-all duration-300 ease-out"
          style={{
            left: rect!.left - PAD,
            top: rect!.top - PAD,
            width: rect!.width + PAD * 2,
            height: rect!.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.9)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Mũi tên chỉ vào phần tử */}
      {hasTarget && (
        <div
          className="absolute animate-arrow-nudge text-3xl drop-shadow-lg"
          style={{ left: rect!.right + PAD + 2, top: rect!.top + rect!.height / 2 - 18 }}
        >
          👈
        </div>
      )}

      {/* Thẻ chú thích */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`card animate-pop-in space-y-3 p-5 ${
          hasTarget ? 'absolute' : 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
        style={{ width: cardW, ...cardStyle }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-500/10 text-2xl">
            {step.icon}
          </div>
          <h2 className="font-display text-lg font-bold leading-snug">{step.title}</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{step.body}</p>

        <div className="flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-ink-500' : 'w-1.5 bg-ink-500/25'}`}
            />
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {i + 1}/{steps.length}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} className="btn-ghost text-sm text-slate-500">
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="btn-ghost text-sm">
                ← Lại
              </button>
            )}
            {last ? (
              <button onClick={onClose} className="btn-primary text-sm">
                {role === 'ADMIN' ? 'Bắt đầu' : 'Bắt đầu học 🎉'}
              </button>
            ) : (
              <button onClick={() => setI(i + 1)} className="btn-primary text-sm">
                Tiếp →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
