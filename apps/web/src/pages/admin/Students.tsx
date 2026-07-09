import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Student {
  id: string; email: string; name: string; status: string; createdAt: string;
  deviceBound: boolean; boundDeviceLabel: string | null; boundDeviceAt: string | null;
  _count: { attempts: number; activities: number; securityEvents: number };
}

interface BulkResult {
  created: { name: string; email: string; password: string }[];
  skipped: { email: string; reason: string }[];
}

// Mật khẩu ngẫu nhiên đạt chính sách (≥8, chữ+số), tránh ký tự dễ nhầm khi chép tay
function genPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (pool: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => pool[b % pool.length]).join('');
  return pick(letters, 1).toUpperCase() + pick(letters, 4) + pick(digits, 4);
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [resetFor, setResetFor] = useState<{ id: string; name: string; password: string; done: boolean } | null>(null);

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

  async function resetDevice(id: string, name: string) {
    if (!confirm(`Mở khóa thiết bị cho "${name}"? Học sinh sẽ đăng nhập được trên một máy mới (máy đầu tiên đăng nhập sau đó sẽ bị khóa lại).`)) return;
    await api.patch(`/users/${id}/reset-device`);
    load();
  }

  async function submitReset() {
    if (!resetFor) return;
    try {
      await api.patch(`/users/${resetFor.id}/password`, { password: resetFor.password });
      setResetFor({ ...resetFor, done: true });
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Đặt lại mật khẩu thất bại');
    }
  }

  // Mỗi dòng: "Tên, email" hoặc "Tên, email, mật khẩu" — dấu phẩy hoặc tab đều được
  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    setBulkError('');
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const students = lines.map((l) => {
      const parts = l.split(/[,\t;]/).map((p) => p.trim());
      return { name: parts[0] ?? '', email: parts[1] ?? '', password: parts[2] || undefined };
    });
    if (students.length === 0) {
      setBulkError('Chưa có dòng nào. Mỗi dòng: Tên, email (mật khẩu bỏ trống sẽ tự sinh).');
      return;
    }
    try {
      const { data } = await api.post('/users/bulk', { students });
      setBulkResult(data);
      setBulkText('');
      load();
    } catch (err: any) {
      setBulkError(err.response?.data?.error ?? 'Tạo hàng loạt thất bại');
    }
  }

  function copyBulkResult() {
    if (!bulkResult) return;
    const text = bulkResult.created.map((c) => `${c.name}\t${c.email}\t${c.password}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Đã copy danh sách tài khoản (tên, email, mật khẩu) — dán vào Excel/Zalo để phát cho học sinh.');
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Học sinh 🧑‍🎓</h1>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => { setShowBulk(!showBulk); setBulkResult(null); }}>
            {showBulk ? 'Đóng' : '📥 Thêm hàng loạt'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Đóng' : '+ Thêm học sinh'}
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="card mt-4 p-5 animate-pop-in">
          {bulkResult ? (
            <div>
              <h2 className="font-display font-bold">Kết quả: tạo {bulkResult.created.length} tài khoản{bulkResult.skipped.length > 0 && `, bỏ qua ${bulkResult.skipped.length}`}</h2>
              {bulkResult.created.length > 0 && (
                <>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-500">
                        <th className="py-1">Tên</th><th>Email</th><th>Mật khẩu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.created.map((c) => (
                        <tr key={c.email} className="border-t border-ink-900/5 dark:border-white/5">
                          <td className="py-1.5">{c.name}</td>
                          <td>{c.email}</td>
                          <td className="font-mono font-semibold">{c.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-chalk-amber">⚠️ Mật khẩu chỉ hiện MỘT LẦN ở đây — hãy copy ngay để phát cho học sinh.</p>
                  <button className="btn-primary mt-2" onClick={copyBulkResult}>📋 Copy danh sách tài khoản</button>
                </>
              )}
              {bulkResult.skipped.length > 0 && (
                <ul className="mt-3 text-sm text-chalk-coral">
                  {bulkResult.skipped.map((s) => <li key={s.email}>⚠️ {s.email}: {s.reason}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <form onSubmit={submitBulk}>
              <p className="text-sm text-slate-500">
                Dán danh sách lớp, mỗi dòng một em: <b>Tên, email</b> (thêm <b>, mật khẩu</b> nếu muốn tự đặt — bỏ trống sẽ tự sinh).
              </p>
              <textarea
                className="input mt-2 font-mono text-sm"
                rows={6}
                placeholder={'Nguyễn Văn An, an@gmail.com\nTrần Thị Bích, bich@gmail.com, MatKhau123'}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              {bulkError && <p className="mt-1 text-sm text-chalk-coral">{bulkError}</p>}
              <button className="btn-primary mt-2">Tạo {bulkText.split('\n').filter((l) => l.trim()).length || ''} tài khoản</button>
            </form>
          )}
        </div>
      )}

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
              <th className="px-4 py-3">Thiết bị</th>
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
                  {s.deviceBound ? (
                    <span className="badge bg-ink-500/10 text-ink-600 dark:text-chalk-sky" title={`${s.boundDeviceLabel ?? ''}\nKhóa lúc ${s.boundDeviceAt ? new Date(s.boundDeviceAt).toLocaleString('vi-VN') : ''}`}>
                      🔒 Đã khóa
                    </span>
                  ) : (
                    <span className="badge bg-slate-200 text-slate-500 dark:bg-white/10">Chưa khóa</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.status === 'BANNED' ? 'bg-chalk-coral/15 text-chalk-coral' : 'bg-chalk-mint/15 text-chalk-mint'}`}>
                    {s.status === 'BANNED' ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {s.deviceBound && (
                    <button onClick={() => resetDevice(s.id, s.name)} className="btn-ghost text-sm" title="Mở khóa để học sinh đổi máy">
                      📱 Đổi máy
                    </button>
                  )}
                  <button
                    onClick={() => setResetFor({ id: s.id, name: s.name, password: genPassword(), done: false })}
                    className="btn-ghost text-sm"
                    title="Đặt mật khẩu mới khi học sinh quên"
                  >
                    🔑 Mật khẩu
                  </button>
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

      {resetFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResetFor(null)}>
          <div className="card w-full max-w-sm p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold">🔑 Đặt lại mật khẩu — {resetFor.name}</h2>
            {resetFor.done ? (
              <div className="mt-3">
                <p className="text-sm">Đã đặt lại. Mật khẩu mới:</p>
                <p className="mt-1 rounded-lg bg-ink-500/5 dark:bg-white/5 px-3 py-2 text-center font-mono text-lg font-bold">{resetFor.password}</p>
                <p className="mt-2 text-xs text-chalk-amber">⚠️ Chỉ hiện một lần — copy gửi cho học sinh ngay. Các phiên đăng nhập cũ đã bị thoát.</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary flex-1" onClick={() => { navigator.clipboard.writeText(resetFor.password); }}>📋 Copy</button>
                  <button className="btn-ghost flex-1" onClick={() => setResetFor(null)}>Đóng</button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <label className="text-sm font-semibold">Mật khẩu mới (≥8 ký tự, có chữ và số)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    className="input flex-1 font-mono"
                    value={resetFor.password}
                    onChange={(e) => setResetFor({ ...resetFor, password: e.target.value })}
                  />
                  <button className="btn-ghost shrink-0" onClick={() => setResetFor({ ...resetFor, password: genPassword() })} title="Sinh mật khẩu ngẫu nhiên khác">🎲</button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-primary flex-1" onClick={submitReset}>Đặt lại</button>
                  <button className="btn-ghost flex-1" onClick={() => setResetFor(null)}>Hủy</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
