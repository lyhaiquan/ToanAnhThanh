import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface StudentRow {
  id: string; name: string; email: string; status: string;
  completedLessons: number; totalLessons: number;
  lastScore: number | null; lastActive: string | null;
}
interface Dash {
  totalStudents: number; bannedStudents: number; totalLessons: number;
  unresolvedEvents: number; passRate: number; totalAttempts: number;
  recentActivity: number; students: StudentRow[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="p-10 text-center text-slate-400">Đang tải…</div>;

  const stats = [
    { label: 'Học sinh', value: data.totalStudents, icon: '🧑‍🎓', color: 'bg-ink-500/10 text-ink-600 dark:text-chalk-sky' },
    { label: 'Tỉ lệ đạt quiz', value: `${data.passRate}%`, icon: '🎯', color: 'bg-chalk-mint/15 text-chalk-mint' },
    { label: 'Hoạt động 7 ngày', value: data.recentActivity, icon: '⚡', color: 'bg-chalk-amber/15 text-chalk-amber' },
    { label: 'Cảnh báo bảo mật', value: data.unresolvedEvents, icon: '🚨', color: 'bg-chalk-coral/15 text-chalk-coral' },
  ];

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-bold">Dashboard 📊</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${s.color}`}>{s.icon}</div>
            <div className="font-display text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {data.unresolvedEvents > 0 && (
        <Link to="/admin/monitor" className="mt-4 block rounded-2xl border-2 border-chalk-coral/40 bg-chalk-coral/10 px-5 py-3 font-semibold text-chalk-coral transition-transform hover:scale-[1.01]">
          🚨 Có {data.unresolvedEvents} sự kiện bảo mật chưa xử lý — bấm để xem chi tiết
        </Link>
      )}

      <div className="card mt-6 overflow-hidden">
        <div className="border-b-2 border-ink-900/10 dark:border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold">Tiến độ học sinh</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 dark:border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Học sinh</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Điểm gần nhất</th>
              <th className="px-4 py-3">Hoạt động cuối</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => {
              const pct = s.totalLessons ? Math.round((s.completedLessons / s.totalLessons) * 100) : 0;
              return (
                <tr key={s.id} className="border-b border-ink-900/5 dark:border-white/5 last:border-0">
                  <td className="px-6 py-3">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-ink-500/10 dark:bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-ink-500 to-chalk-sky" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-display font-bold">{s.lastScore ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.lastActive ? new Date(s.lastActive).toLocaleString('vi-VN') : 'Chưa hoạt động'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'BANNED' ? 'bg-chalk-coral/15 text-chalk-coral' : 'bg-chalk-mint/15 text-chalk-mint'}`}>
                      {s.status === 'BANNED' ? 'Bị khóa' : 'Hoạt động'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
