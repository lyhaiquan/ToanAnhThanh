import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Row { lessonId: string; lessonTitle: string; chapterTitle: string; watchedSec: number; completed: boolean }
interface Attempt { id: string; lessonTitle: string; score: number; passed: boolean; at: string }

export default function MyProgress() {
  const [rows, setRows] = useState<Row[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    api.get('/progress/me').then((r) => setRows(r.data));
    api.get('/quiz/attempts/me').then((r) => setAttempts(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <h1 className="text-3xl font-bold">Tiến độ của tôi 📈</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Bài học đã xem</h2>
          {rows.length === 0 && <p className="text-sm text-slate-500">Chưa có dữ liệu — bắt đầu học thôi!</p>}
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.lessonId} className="flex items-center gap-3 text-sm">
                <span className={`text-lg ${r.completed ? '' : 'grayscale opacity-50'}`}>{r.completed ? '✅' : '⏳'}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.lessonTitle}</div>
                  <div className="text-xs text-slate-500">{r.chapterTitle} · đã xem {Math.round(r.watchedSec / 60)} phút</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Lịch sử làm quiz</h2>
          {attempts.length === 0 && <p className="text-sm text-slate-500">Chưa làm quiz nào.</p>}
          <ul className="space-y-3">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display font-bold ${
                    a.passed ? 'bg-chalk-mint/15 text-chalk-mint' : 'bg-chalk-coral/15 text-chalk-coral'
                  }`}
                >
                  {a.score}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.lessonTitle}</div>
                  <div className="text-xs text-slate-500">{new Date(a.at).toLocaleString('vi-VN')}</div>
                </div>
                <span className={`badge ${a.passed ? 'bg-chalk-mint/15 text-chalk-mint' : 'bg-chalk-coral/15 text-chalk-coral'}`}>
                  {a.passed ? 'Đạt' : 'Chưa đạt'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
