import { FormEvent, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../lib/store';
import { api } from '../lib/api';
import OnboardingGuide from './OnboardingGuide';

const studentLinks = [
  { to: '/', label: 'Khóa học', icon: '📚' },
  { to: '/live', label: 'Lớp học live', icon: '🎥' },
  { to: '/progress', label: 'Tiến độ của tôi', icon: '📈' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/students', label: 'Học sinh', icon: '🧑‍🎓' },
  { to: '/admin/content', label: 'Nội dung', icon: '🎬' },
  { to: '/admin/live', label: 'Lớp học live', icon: '🎥' },
  { to: '/admin/monitor', label: 'Giám sát', icon: '🕵️' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? [...adminLinks, ...studentLinks] : studentLinks;
  const [liveSoon, setLiveSoon] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Hiện hướng dẫn tự động lần đầu mỗi tài khoản đăng nhập (nhớ trong localStorage)
  const guideKey = user ? `tat_guide_seen_${user.id}` : '';
  useEffect(() => {
    if (user && !localStorage.getItem(guideKey)) setShowGuide(true);
  }, [user, guideKey]);

  function closeGuide() {
    if (guideKey) localStorage.setItem(guideKey, '1');
    setShowGuide(false);
  }

  // Chấm đỏ nhắc lớp live: học sinh có buổi đang diễn ra hoặc bắt đầu trong 24h tới
  useEffect(() => {
    if (user?.role !== 'STUDENT') return;
    api
      .get('/live-sessions/mine')
      .then((r) => {
        const soon = r.data.some(
          (s: { status: string; scheduledAt: string }) =>
            s.status === 'ongoing' ||
            (s.status === 'upcoming' && new Date(s.scheduledAt).getTime() - Date.now() < 24 * 60 * 60 * 1000)
        );
        setLiveSoon(soon);
      })
      .catch(() => {});
  }, [user?.role]);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch { /* offline vẫn logout được */ }
    logout();
    navigate('/login');
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', pwForm);
      // Đổi xong mọi refresh token cũ bị thu hồi → đăng nhập lại cho sạch phiên
      alert('Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.');
      logout();
      navigate('/login');
    } catch (err: any) {
      setPwError(err.response?.data?.error ?? 'Đổi mật khẩu thất bại');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r-2 border-ink-900/10 dark:border-white/10 bg-white/80 dark:bg-boardcard/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-11 w-11 rotate-3 items-center justify-center rounded-xl bg-ink-500 text-2xl shadow-note">📐</div>
          <div>
            <div className="font-display text-lg font-bold leading-tight">Toán Anh Thành</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Học toán cùng thầy</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/' || l.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-500 text-white shadow-note'
                    : 'text-ink-700 dark:text-slate-300 hover:bg-ink-500/10'
                }`
              }
            >
              <span>{l.icon}</span> {l.label}
              {l.to === '/live' && liveSoon && (
                <span className="ml-auto h-2.5 w-2.5 animate-pulse rounded-full bg-chalk-coral" title="Có buổi học sắp diễn ra" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t-2 border-ink-900/10 dark:border-white/10 p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chalk-amber/20 font-display font-bold text-chalk-amber">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}</div>
            </div>
          </div>
          <button onClick={() => setShowGuide(true)} className="btn-ghost w-full text-sm" title="Xem lại hướng dẫn sử dụng">
            ❓ Hướng dẫn sử dụng
          </button>
          <div className="flex gap-2">
            <button onClick={toggle} className="btn-ghost flex-1 text-sm" title="Đổi giao diện sáng/tối">
              {dark ? '☀️ Sáng' : '🌙 Tối'}
            </button>
            <button onClick={() => { setShowPw(true); setPwForm({ oldPassword: '', newPassword: '' }); setPwError(''); }} className="btn-ghost flex-1 text-sm" title="Đổi mật khẩu tài khoản">
              🔑 Mật khẩu
            </button>
            <button onClick={handleLogout} className="btn-ghost flex-1 text-sm text-chalk-coral">
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 px-8 py-8">
        <Outlet />
      </main>

      {showGuide && user && <OnboardingGuide role={user.role} onClose={closeGuide} />}

      {showPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPw(false)}>
          <form onSubmit={changePassword} className="card w-full max-w-sm space-y-3 p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold">🔑 Đổi mật khẩu</h2>
            <div>
              <label className="text-sm font-semibold">Mật khẩu hiện tại</label>
              <input
                className="input mt-1"
                type="password"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Mật khẩu mới (≥8 ký tự, có chữ và số)</label>
              <input
                className="input mt-1"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            {pwError && <p className="text-sm text-chalk-coral">{pwError}</p>}
            <div className="flex gap-2">
              <button className="btn-primary flex-1" disabled={pwSaving}>{pwSaving ? 'Đang đổi…' : 'Đổi mật khẩu'}</button>
              <button type="button" className="btn-ghost flex-1" onClick={() => setShowPw(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
