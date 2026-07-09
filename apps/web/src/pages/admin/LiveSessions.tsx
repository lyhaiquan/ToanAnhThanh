import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Session {
  id: string; title: string; description: string; scheduledAt: string;
  durationMinutes: number; meetingLink: string;
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'; cancelled: boolean;
  invitedCount: number; joinedCount: number;
}

interface Student { id: string; name: string; email: string; status: string }

interface InviteDetail { user: { id: string; name: string; email: string }; joinedAt: string | null }

const STATUS_BADGE: Record<Session['status'], { label: string; cls: string }> = {
  upcoming: { label: 'Sắp tới', cls: 'bg-chalk-sky/15 text-chalk-sky' },
  ongoing: { label: 'Đang diễn ra', cls: 'bg-chalk-mint/15 text-chalk-mint' },
  past: { label: 'Đã qua', cls: 'bg-slate-200 text-slate-500 dark:bg-white/10' },
  cancelled: { label: 'Đã hủy', cls: 'bg-chalk-coral/15 text-chalk-coral' },
};

const emptyForm = { title: '', description: '', scheduledAt: '', durationMinutes: 60, meetingLink: '' };

export default function AdminLiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState<{ title: string; invites: InviteDetail[] } | null>(null);

  function load() {
    api.get('/live-sessions').then((r) => setSessions(r.data));
  }
  useEffect(() => {
    load();
    api.get('/users').then((r) => setStudents(r.data.filter((s: Student) => s.status === 'ACTIVE')));
  }, []);

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (selected.size === 0) {
      setError('Hãy chọn ít nhất một học sinh để mời.');
      return;
    }
    try {
      await api.post('/live-sessions', {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        studentIds: [...selected],
      });
      setForm(emptyForm);
      setSelected(new Set());
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Lỗi tạo buổi học');
    }
  }

  async function cancel(id: string, title: string) {
    if (!confirm(`Hủy buổi "${title}"? Học sinh sẽ không vào lớp được nữa.`)) return;
    await api.patch(`/live-sessions/${id}`, { status: 'CANCELLED' });
    load();
  }

  async function viewAttendance(s: Session) {
    const { data } = await api.get(`/live-sessions/${s.id}`);
    setAttendance({ title: s.title, invites: data.invites });
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lớp học live 🎥</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : '+ Tạo buổi mới'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card mt-4 space-y-3 p-5 animate-pop-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Tiêu đề buổi học" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className="input" placeholder="Link Google Meet / Zoom" type="url" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} required />
            <input className="input" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
            <div className="flex items-center gap-2">
              <input className="input" type="number" min={5} max={600} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} required />
              <span className="shrink-0 text-sm text-slate-500">phút</span>
            </div>
          </div>
          <textarea className="input" rows={2} placeholder="Mô tả (không bắt buộc)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div>
            <div className="mb-2 text-sm font-semibold">Mời học sinh ({selected.size} đã chọn)</div>
            <div className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
              {students.map((st) => (
                <label key={st.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-500/10">
                  <input type="checkbox" checked={selected.has(st.id)} onChange={() => toggleStudent(st.id)} />
                  <span className="font-medium">{st.name}</span>
                  <span className="truncate text-xs text-slate-500">{st.email}</span>
                </label>
              ))}
              {students.length === 0 && <div className="text-sm text-slate-400">Chưa có học sinh đang hoạt động.</div>}
            </div>
          </div>

          {error && <p className="text-sm text-chalk-coral">{error}</p>}
          <button className="btn-primary">Tạo buổi học</button>
        </form>
      )}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 dark:border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Buổi học</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Điểm danh</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-ink-900/5 dark:border-white/5 last:border-0">
                <td className="px-6 py-3">
                  <div className="font-semibold">{s.title}</div>
                  {s.description && <div className="text-xs text-slate-500">{s.description}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>{new Date(s.scheduledAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                  <div className="text-xs text-slate-500">{s.durationMinutes} phút</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{s.joinedCount}</span>
                  <span className="text-slate-400">/{s.invitedCount} đã vào</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[s.status].cls}`}>{STATUS_BADGE[s.status].label}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => viewAttendance(s)} className="btn-ghost text-sm">📋 Điểm danh</button>
                  <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">🔗 Mở link</a>
                  {!s.cancelled && (
                    <button onClick={() => cancel(s.id, s.title)} className="btn-ghost text-sm text-chalk-coral">Hủy</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && <div className="p-8 text-center text-slate-400">Chưa có buổi học live nào.</div>}
      </div>

      {attendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAttendance(null)}>
          <div className="card max-h-[80vh] w-full max-w-md overflow-y-auto p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Điểm danh — {attendance.title}</h2>
              <button className="btn-ghost text-sm" onClick={() => setAttendance(null)}>✕</button>
            </div>
            <ul className="space-y-2">
              {attendance.invites.map((i) => (
                <li key={i.user.id} className="flex items-center justify-between rounded-lg bg-ink-500/5 px-3 py-2 text-sm dark:bg-white/5">
                  <div>
                    <div className="font-medium">{i.user.name}</div>
                    <div className="text-xs text-slate-500">{i.user.email}</div>
                  </div>
                  {i.joinedAt ? (
                    <span className="badge bg-chalk-mint/15 text-chalk-mint">
                      ✓ {new Date(i.joinedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                  ) : (
                    <span className="badge bg-slate-200 text-slate-500 dark:bg-white/10">Chưa vào</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
