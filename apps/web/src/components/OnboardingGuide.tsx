import { useState } from 'react';

interface Step {
  icon: string;
  title: string;
  body: string;
}

const studentSteps: Step[] = [
  {
    icon: '👋',
    title: 'Chào mừng đến với Toán Anh Thành!',
    body: 'Đây là hướng dẫn nhanh giúp em bắt đầu học. Chỉ mất 30 giây thôi — kéo qua từng bước nhé.',
  },
  {
    icon: '📚',
    title: 'Xem bài giảng',
    body: 'Vào mục "Khóa học" ở menu bên trái, chọn chương rồi bấm vào bài để xem video thầy giảng.',
  },
  {
    icon: '📝',
    title: 'Làm quiz để mở bài tiếp theo',
    body: 'Xem xong bài, em làm quiz. Phải đạt điểm yêu cầu thì bài kế tiếp mới được mở khóa — cứ từ từ chắc chắn nhé.',
  },
  {
    icon: '🎥',
    title: 'Lớp học trực tuyến',
    body: 'Khi thầy có buổi dạy live, mục "Lớp học live" sẽ hiện chấm đỏ. Vào đó bấm "Vào lớp" để tham gia đúng giờ.',
  },
  {
    icon: '📈',
    title: 'Theo dõi tiến độ',
    body: 'Mục "Tiến độ của tôi" cho biết em đã học tới đâu. Cần đổi mật khẩu thì bấm nút 🔑 ở góc dưới bên trái. Chúc em học tốt!',
  },
];

const adminSteps: Step[] = [
  {
    icon: '👋',
    title: 'Chào mừng thầy!',
    body: 'Hướng dẫn nhanh các khu vực quản lý chính. Thầy có thể mở lại hướng dẫn này bất cứ lúc nào bằng nút "Hướng dẫn" ở menu.',
  },
  {
    icon: '🎬',
    title: 'Nội dung & bài giảng',
    body: 'Mục "Nội dung": tạo khóa học, thêm chương, kéo-thả (hoặc bấm chọn) video để thêm bài. Bấm "📝 Quiz" cạnh mỗi bài để soạn câu hỏi.',
  },
  {
    icon: '🧑‍🎓',
    title: 'Quản lý học sinh',
    body: 'Mục "Học sinh": thêm từng em, hoặc "Thêm hàng loạt" để dán cả danh sách lớp. Có thể đặt lại mật khẩu (🔑) và khóa/mở thiết bị cho học sinh.',
  },
  {
    icon: '🎥',
    title: 'Lớp học trực tuyến',
    body: 'Mục "Lớp học live": tạo buổi dạy, dán link Zoom/Meet, mời học sinh, và xem điểm danh ai đã vào lớp.',
  },
  {
    icon: '🕵️',
    title: 'Giám sát',
    body: 'Mục "Giám sát" theo dõi hoạt động học sinh và cảnh báo bảo mật (mở DevTools, quay màn hình...). Chúc thầy dạy tốt!',
  },
];

export default function OnboardingGuide({ role, onClose }: { role: 'ADMIN' | 'STUDENT'; onClose: () => void }) {
  const steps = role === 'ADMIN' ? adminSteps : studentSteps;
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  const step = steps[i];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-0 overflow-hidden animate-pop-in">
        <div className="flex flex-col items-center gap-3 bg-ink-500/5 dark:bg-white/5 px-6 pt-8 pb-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-500/10 text-5xl">{step.icon}</div>
          <h2 className="font-display text-xl font-bold">{step.title}</h2>
          <p className="text-slate-600 dark:text-slate-300">{step.body}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-4">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-ink-500' : 'w-2 bg-ink-500/25'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 pb-6">
          <button onClick={onClose} className="btn-ghost text-sm text-slate-500">
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="btn-ghost text-sm">
                ← Quay lại
              </button>
            )}
            {last ? (
              <button onClick={onClose} className="btn-primary">
                {role === 'ADMIN' ? 'Bắt đầu' : 'Bắt đầu học 🎉'}
              </button>
            ) : (
              <button onClick={() => setI(i + 1)} className="btn-primary">
                Tiếp →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
