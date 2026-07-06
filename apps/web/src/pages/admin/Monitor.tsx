import { useEffect, useState } from 'react';
import { ACTIVITY_LABELS, SECURITY_EVENT_LABELS } from '@tat/shared';
import { api } from '../../lib/api';

interface Activity {
  id: string; type: string; metadata: Record<string, unknown>; at: string;
  userName: string; userEmail: string; userId: string;
}
interface SecEvent {
  id: string; type: string; detail: string; resolved: boolean; at: string;
  userName: string; userEmail: string;
}

export default function AdminMonitor() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [filterUser, setFilterUser] = useState('');

  function load() {
    api.get('/security/activities', { params: filterUser ? { userId: filterUser } : {} }).then((r) => setActivities(r.data));
    api.get('/security/security-events').then((r) => setEvents(r.data));
  }
  useEffect(load, [filterUser]);

  // Tự refresh mỗi 10s để theo dõi "trực tiếp"
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [filterUser]);

  async function resolve(id: string) {
    await api.patch(`/security/security-events/${id}/resolve`);
    load();
  }

  const users = [...new Map(activities.map((a) => [a.userId, a])).values()];

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-bold">Giám sát 🕵️</h1>
      <p className="mt-1 text-sm text-slate-500">Theo dõi mọi hoạt động của học sinh — tự làm mới mỗi 10 giây.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b-2 border-chalk-coral/30 bg-chalk-coral/5 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-chalk-coral">🚨 Sự kiện bảo mật</h2>
          </div>
          <ul className="max-h-[560px] divide-y divide-ink-900/5 dark:divide-white/5 overflow-y-auto">
            {events.length === 0 && <li className="p-6 text-center text-sm text-slate-400">Chưa có sự kiện nào — lớp học đang ngoan 👍</li>}
            {events.map((e) => (
              <li key={e.id} className={`px-6 py-3 text-sm ${e.resolved ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-chalk-coral">
                    {SECURITY_EVENT_LABELS[e.type as keyof typeof SECURITY_EVENT_LABELS] ?? e.type}
                  </span>
                  {!e.resolved && (
                    <button onClick={() => resolve(e.id)} className="shrink-0 text-xs font-semibold text-ink-500 dark:text-chalk-sky hover:underline">
                      Đánh dấu đã xử lý
                    </button>
                  )}
                </div>
                <div className="mt-0.5 text-slate-600 dark:text-slate-300">
                  {e.userName} <span className="text-slate-400">({e.userEmail})</span>
                </div>
                {e.detail && <div className="text-xs text-slate-500">{e.detail}</div>}
                <div className="text-xs text-slate-400">{new Date(e.at).toLocaleString('vi-VN')}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-ink-900/10 dark:border-white/10 px-6 py-3">
            <h2 className="font-display text-lg font-bold">📋 Nhật ký hoạt động</h2>
            <select className="input w-44 py-1.5 text-sm" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Tất cả học sinh</option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>{u.userName}</option>
              ))}
            </select>
          </div>
          <ul className="max-h-[560px] divide-y divide-ink-900/5 dark:divide-white/5 overflow-y-auto">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                <span className="w-40 shrink-0 text-xs text-slate-400">{new Date(a.at).toLocaleString('vi-VN')}</span>
                <span className="flex-1">
                  <b>{a.userName}</b>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    {(ACTIVITY_LABELS[a.type as keyof typeof ACTIVITY_LABELS] ?? a.type).toLowerCase()}
                  </span>
                  {'lessonId' in a.metadata && a.metadata.title ? <span className="text-slate-400"> — {String(a.metadata.title)}</span> : null}
                  {'score' in a.metadata ? (
                    <span className={`ml-1 font-semibold ${a.metadata.passed ? 'text-chalk-mint' : 'text-chalk-coral'}`}>
                      {String(a.metadata.score)} điểm
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
            {activities.length === 0 && <li className="p-6 text-center text-sm text-slate-400">Chưa có hoạt động.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
