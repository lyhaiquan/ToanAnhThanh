import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../lib/store';
import { getDeviceId } from '../lib/device';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get('reason');
  const securityKick = reason === 'security';
  const deviceKick = reason === 'device';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password, deviceId: getDeviceId() });
      login(data.user, data.accessToken, data.refreshToken);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Không kết nối được máy chủ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Ký hiệu toán trôi nổi trang trí */}
      {['∫', 'π', '√', 'Σ', '∞', 'Δ'].map((s, i) => (
        <span
          key={s}
          className="pointer-events-none absolute select-none font-display text-6xl text-ink-500/10 dark:text-white/5 animate-drift"
          style={{
            top: `${12 + i * 14}%`,
            left: i % 2 ? `${78 + (i % 3) * 5}%` : `${5 + (i % 3) * 4}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        >
          {s}
        </span>
      ))}

      <div className="w-full max-w-md animate-pop-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl bg-ink-500 text-5xl shadow-note">
            📐
          </div>
          <h1 className="text-4xl font-bold text-ink-700 dark:text-white">Toán Anh Thành</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Nền tảng học toán trực tuyến</p>
        </div>

        {securityKick && (
          <div className="mb-4 rounded-xl border-2 border-chalk-coral/40 bg-chalk-coral/10 px-4 py-3 text-sm font-medium text-chalk-coral">
            ⚠️ Phiên của bạn đã bị đăng xuất do phát hiện hành vi không được phép (DevTools / quay màn hình).
            Sự việc đã được báo cáo tới quản trị viên.
          </div>
        )}
        {deviceKick && (
          <div className="mb-4 rounded-xl border-2 border-chalk-amber/40 bg-chalk-amber/10 px-4 py-3 text-sm font-medium text-chalk-amber">
            🔒 Tài khoản này chỉ được dùng trên thiết bị đã đăng ký. Nếu bạn cần đổi máy, hãy liên hệ giáo viên để mở khóa thiết bị.
          </div>
        )}

        <form onSubmit={submit} className="card space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hocsinh1@gmail.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Mật khẩu</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-chalk-coral">{error}</p>}
          <button className="btn-primary w-full py-3 text-lg" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Vào lớp học →'}
          </button>
          <div className="rounded-xl bg-ink-500/5 dark:bg-white/5 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            <b>Tài khoản demo:</b><br />
            Admin: admin@toananhthanh.vn / Admin@123<br />
            Học sinh: hocsinh1@gmail.com / Hocsinh@123
          </div>
        </form>
      </div>
    </div>
  );
}
