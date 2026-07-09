import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface MySession {
  id: string; title: string; description: string; scheduledAt: string;
  durationMinutes: number; status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  joinedAt: string | null;
}

const STATUS_BADGE: Record<MySession['status'], { label: string; cls: string }> = {
  upcoming: { label: 'Sắp tới', cls: 'bg-chalk-sky/15 text-chalk-sky' },
  ongoing: { label: 'Đang diễn ra', cls: 'bg-chalk-mint/15 text-chalk-mint' },
  past: { label: 'Đã qua', cls: 'bg-slate-200 text-slate-500 dark:bg-white/10' },
  cancelled: { label: 'Đã hủy', cls: 'bg-chalk-coral/15 text-chalk-coral' },
};

function SessionCard({ s, onJoin }: { s: MySession; onJoin: (id: string) => void }) {
  const canJoin = s.status === 'upcoming' || s.status === 'ongoing';
  return (
    <div className="card flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold">{s.title}</span>
          <span className={`badge ${STATUS_BADGE[s.status].cls}`}>{STATUS_BADGE[s.status].label}</span>
        </div>
        {s.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.description}</p>}
        <p className="mt-1 text-sm text-slate-500">
          🕐 {new Date(s.scheduledAt).toLocaleString('vi-VN', { weekday: 'long', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
          <span className="text-slate-400"> · {s.durationMinutes} phút</span>
        </p>
      </div>
      {canJoin && (
        <button className="btn-primary shrink-0" onClick={() => onJoin(s.id)}>
          🎥 Vào lớp
        </button>
      )}
    </div>
  );
}

export default function LiveClasses() {
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/live-sessions/mine').then((r) => setSessions(r.data));
  }, []);

  async function join(id: string) {
    setError('');
    try {
      const { data } = await api.post(`/live-sessions/${id}/join`);
      window.open(data.meetingLink, '_blank', 'noopener');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Không vào được lớp học');
    }
  }

  const active = sessions.filter((s) => s.status === 'upcoming' || s.status === 'ongoing');
  const past = sessions.filter((s) => s.status === 'past' || s.status === 'cancelled');

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-bold">Lớp học live 🎥</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Các buổi học trực tuyến bạn được mời tham gia.</p>

      {error && <p className="mt-4 text-sm text-chalk-coral">{error}</p>}

      <h2 className="mt-6 font-display text-lg font-bold">Sắp tới</h2>
      <div className="mt-3 space-y-3">
        {active.map((s) => <SessionCard key={s.id} s={s} onJoin={join} />)}
        {active.length === 0 && <div className="card p-6 text-center text-slate-400">Chưa có buổi học nào sắp diễn ra.</div>}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-bold">Đã qua</h2>
          <div className="mt-3 space-y-3">
            {past.map((s) => <SessionCard key={s.id} s={s} onJoin={join} />)}
          </div>
        </>
      )}
    </div>
  );
}
