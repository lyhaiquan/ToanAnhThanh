import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../lib/store';
import { api } from '../lib/api';

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

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch { /* offline vẫn logout được */ }
    logout();
    navigate('/login');
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
          <div className="flex gap-2">
            <button onClick={toggle} className="btn-ghost flex-1 text-sm" title="Đổi giao diện sáng/tối">
              {dark ? '☀️ Sáng' : '🌙 Tối'}
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
    </div>
  );
}
