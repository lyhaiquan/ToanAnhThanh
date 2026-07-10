import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface QuestionRow {
  id: string;
  content: string;
  answer: string;
  answeredAt: string | null;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  courseTitle: string;
}

// Hộp thư câu hỏi của học sinh — thầy trả lời tại đây, học sinh thấy ngay
// trong tab "Hỏi đáp" của bài học tương ứng.
export default function AdminQA() {
  const [onlyUnanswered, setOnlyUnanswered] = useState(true);
  const [items, setItems] = useState<QuestionRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState('');

  async function load(unanswered: boolean) {
    const { data } = await api.get(`/qa/admin${unanswered ? '?unanswered=1' : ''}`);
    setItems(data);
  }
  useEffect(() => { setItems(null); load(onlyUnanswered); }, [onlyUnanswered]);

  async function answer(q: QuestionRow) {
    const text = (drafts[q.id] ?? q.answer).trim();
    if (!text) return;
    setSavingId(q.id);
    try {
      await api.post(`/qa/admin/${q.id}/answer`, { answer: text });
      await load(onlyUnanswered);
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="text-3xl font-bold">Hỏi đáp 💬</h1>
      <p className="mt-1 text-sm text-slate-500">
        Câu hỏi học sinh gửi từ tab "Hỏi đáp" trong bài học. Trả lời xong, học sinh thấy ngay trong bài.
      </p>

      <div className="mt-4 flex gap-2">
        {[
          { key: true, label: '⏳ Chưa trả lời' },
          { key: false, label: 'Tất cả' },
        ].map((f) => (
          <button
            key={String(f.key)}
            onClick={() => setOnlyUnanswered(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              onlyUnanswered === f.key ? 'bg-ink-500 text-white' : 'bg-ink-500/10 text-slate-500 hover:bg-ink-500/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="mt-10 text-center text-slate-400">Đang tải…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-400">
          {onlyUnanswered ? '🎉 Không còn câu hỏi nào chờ trả lời' : 'Chưa có câu hỏi nào'}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((q) => (
            <div key={q.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-ink-600 dark:text-chalk-sky">{q.studentName}</span>
                <span>·</span>
                <span>{q.courseTitle} → {q.lessonTitle}</span>
                <span>·</span>
                <span>{new Date(q.createdAt).toLocaleString('vi-VN')}</span>
                {q.answeredAt && <span className="badge bg-chalk-mint/15 text-chalk-mint">✓ Đã trả lời</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap font-medium">{q.content}</p>
              <div className="mt-3">
                <textarea
                  className="input min-h-[70px] text-sm"
                  placeholder="Nhập câu trả lời cho học sinh…"
                  value={drafts[q.id] ?? q.answer}
                  onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })}
                  maxLength={5000}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => answer(q)}
                    className="btn-primary text-sm"
                    disabled={savingId === q.id || !(drafts[q.id] ?? q.answer).trim()}
                  >
                    {savingId === q.id ? 'Đang gửi…' : q.answeredAt ? 'Cập nhật trả lời' : '📨 Trả lời'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
