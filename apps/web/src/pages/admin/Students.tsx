import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Student {
  id: string; email: string; name: string; status: string; createdAt: string;
  _count: { attempts: number; activities: number; securityEvents: number };
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function load() {
    api.get('/users').then((r) => setStudents(r.data));
  }
  useEffect(load, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Lỗi tạo học sinh');
    }
  }

  async function toggleBan(id: string) {
    await api.patch(`/users/${id}/ban`);
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Xóa học sinh "${name}"? Toàn bộ dữ liệu học tập sẽ mất.`)) return;
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Học sinh 🧑‍🎓</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : '+ Thêm học sinh'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card mt-4 grid gap-3 p-5 sm:grid-cols-3 animate-pop-in">
          <input className="input" placeholder="Họ tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div className="flex gap-2">
            <input className="input" type="text" placeholder="Mật khẩu (≥6 ký tự)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            <button className="btn-primary shrink-0">Tạo</button>
          </div>
          {error && <p className="text-sm text-chalk-coral sm:col-span-3">{error}</p>}
        </form>
      )}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 dark:border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Học sinh</th>
              <th className="px-4 py-3">Quiz đã làm</th>
              <th className="px-4 py-3">Hoạt động</th>
              <th className="px-4 py-3">Cảnh báo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-ink-900/5 dark:border-white/5 last:border-0">
                <td className="px-6 py-3">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </td>
                <td className="px-4 py-3">{s._count.attempts}</td>
                <td className="px-4 py-3">{s._count.activities}</td>
                <td className="px-4 py-3">
                  {s._count.securityEvents > 0 ? (
                    <span className="badge bg-chalk-coral/15 text-chalk-coral">⚠️ {s._count.securityEvents}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.status === 'BANNED' ? 'bg-chalk-coral/15 text-chalk-coral' : 'bg-chalk-mint/15 text-chalk-mint'}`}>
                    {s.status === 'BANNED' ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleBan(s.id)} className="btn-ghost text-sm">
                    {s.status === 'BANNED' ? '🔓 Mở khóa' : '🚫 Khóa'}
                  </button>
                  <button onClick={() => remove(s.id, s.name)} className="btn-ghost text-sm text-chalk-coral">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className="p-8 text-center text-slate-400">Chưa có học sinh nào.</div>}
      </div>
    </div>
  );
}
