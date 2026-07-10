import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type Tab = 'analyze' | 'exercises' | 'chat' | 'slides';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'analyze', label: 'Phân tích', icon: '🔍' },
  { key: 'exercises', label: 'Bài tập', icon: '✏️' },
  { key: 'chat', label: 'Hỏi đáp', icon: '💬' },
  { key: 'slides', label: 'Slide', icon: '🖥️' },
];

export default function AIPanel({ lessonId }: { lessonId: string }) {
  const [tab, setTab] = useState<Tab>('analyze');

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b-2 border-ink-900/10 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-3 font-display font-semibold transition-colors ${
              tab === t.key
                ? 'border-b-[3px] border-ink-500 bg-ink-500/5 text-ink-600 dark:text-chalk-sky'
                : 'text-slate-500 hover:bg-ink-500/5'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="max-h-[480px] overflow-y-auto p-5">
        {tab === 'analyze' && <AnalyzeTab lessonId={lessonId} />}
        {tab === 'exercises' && <ExercisesTab lessonId={lessonId} />}
        {tab === 'chat' && <ChatTab lessonId={lessonId} />}
        {tab === 'slides' && <SlidesTab lessonId={lessonId} />}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="py-8 text-center text-slate-400">🤖 AI đang xử lý…</div>;
}

function AnalyzeTab({ lessonId }: { lessonId: string }) {
  const [data, setData] = useState<{ summary: string; concepts: string[]; objectives: string[] } | null>(null);
  useEffect(() => {
    setData(null);
    api.get(`/ai/analyze/${lessonId}`).then((r) => setData(r.data));
  }, [lessonId]);
  if (!data) return <Loading />;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="mb-1 font-display font-bold">📝 Tóm tắt bài giảng</h4>
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{data.summary}</p>
      </div>
      <div>
        <h4 className="mb-1 font-display font-bold">🧩 Khái niệm chính</h4>
        <div className="flex flex-wrap gap-2">
          {data.concepts.map((c) => (
            <span key={c} className="badge bg-ink-500/10 text-ink-600 dark:text-chalk-sky">{c}</span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-1 font-display font-bold">🎯 Mục tiêu học tập</h4>
        <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
          {data.objectives.map((o) => <li key={o}>{o}</li>)}
        </ul>
      </div>
    </div>
  );
}

function ExercisesTab({ lessonId }: { lessonId: string }) {
  const [items, setItems] = useState<{ question: string; hint: string; solution: string }[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    setItems(null);
    api.get(`/ai/exercises/${lessonId}`).then((r) => setItems(r.data));
  }, [lessonId]);
  if (!items) return <Loading />;
  return (
    <div className="space-y-3">
      {items.map((ex, i) => (
        <div key={i} className="rounded-xl border-2 border-ink-900/10 dark:border-white/10 p-4">
          <div className="font-semibold">Bài {i + 1}. {ex.question}</div>
          {ex.hint && <div className="mt-1 text-sm text-chalk-amber">💡 Gợi ý: {ex.hint}</div>}
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="mt-2 text-sm font-semibold text-ink-500 dark:text-chalk-sky hover:underline"
          >
            {open === i ? 'Ẩn lời giải ▲' : 'Xem lời giải ▼'}
          </button>
          {open === i && (
            <div className="mt-2 rounded-lg bg-chalk-mint/10 p-3 text-sm text-slate-700 dark:text-slate-200">{ex.solution}</div>
          )}
        </div>
      ))}
    </div>
  );
}

interface MyQuestion {
  id: string;
  content: string;
  answer: string;
  answeredAt: string | null;
  createdAt: string;
}

// Hỏi đáp trực tiếp với giáo viên (không phải AI): câu hỏi gửi về trang admin,
// thầy trả lời thì hiện ở đây. Riêng tư — mỗi em chỉ thấy câu hỏi của mình.
function ChatTab({ lessonId }: { lessonId: string }) {
  const [items, setItems] = useState<MyQuestion[] | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await api.get(`/qa/lessons/${lessonId}/mine`);
    setItems(data);
  }
  useEffect(() => { setItems(null); load(); }, [lessonId]);

  // Chỉ cuộn KHUNG chat, không đụng đến cuộn của cả trang
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/qa/lessons/${lessonId}`, { content });
      setItems((cur) => [...(cur ?? []), data]);
      setInput('');
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <div className="py-8 text-center text-slate-400">Đang tải…</div>;

  return (
    <div className="flex h-[380px] flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-ink-500/8 dark:bg-white/10 px-4 py-2.5 text-sm leading-relaxed">
            Chỗ này để hỏi thầy trực tiếp về bài học. Em cứ gửi câu hỏi, thầy sẽ trả lời sớm nhất có thể nhé 👨‍🏫
          </div>
        </div>
        {items.map((q) => (
          <div key={q.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink-500 px-4 py-2.5 text-sm leading-relaxed text-white">
                {q.content}
              </div>
            </div>
            {q.answer ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-ink-500/8 dark:bg-white/10 px-4 py-2.5 text-sm leading-relaxed">
                  <div className="mb-1 text-xs font-semibold text-chalk-amber">👨‍🏫 Thầy trả lời</div>
                  <div className="whitespace-pre-wrap">{q.answer}</div>
                </div>
              </div>
            ) : (
              <div className="pl-1 text-xs text-slate-400">⏳ Thầy chưa trả lời — em chờ chút nhé</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Câu hỏi được gửi thẳng đến thầy</span>
        <button type="button" onClick={load} className="text-xs font-semibold text-ink-500 dark:text-chalk-sky hover:underline">
          ↻ Xem thầy trả lời chưa
        </button>
      </div>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi thầy về bài học…"
          maxLength={2000}
        />
        <button className="btn-primary" disabled={busy}>Gửi</button>
      </form>
    </div>
  );
}

function SlidesTab({ lessonId }: { lessonId: string }) {
  const [slides, setSlides] = useState<{ title: string; bullets: string[] }[] | null>(null);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setSlides(null);
    setIdx(0);
    api.get(`/ai/slides/${lessonId}`).then((r) => setSlides(r.data));
  }, [lessonId]);
  if (!slides) return <Loading />;
  const slide = slides[idx];
  return (
    <div>
      <div className="flex aspect-[16/9] flex-col justify-center rounded-xl bg-gradient-to-br from-ink-600 to-ink-800 p-8 text-white shadow-inner">
        <h3 className="mb-4 font-display text-2xl font-bold">{slide.title}</h3>
        <ul className="space-y-2">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="mt-0.5 text-chalk-amber">▸</span> {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button className="btn-ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← Trước</button>
        <span className="font-display text-sm font-semibold text-slate-500">{idx + 1} / {slides.length}</span>
        <button className="btn-ghost" onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1}>Sau →</button>
      </div>
    </div>
  );
}
