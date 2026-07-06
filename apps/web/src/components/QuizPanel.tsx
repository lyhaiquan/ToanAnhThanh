import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface QuizData {
  id: string;
  passScore: number;
  questions: { id: string; text: string; options: string[] }[];
}
interface Result {
  score: number;
  passed: boolean;
  passScore: number;
  correct: number;
  total: number;
  detail: { chosen: number; correctIndex: number; isCorrect: boolean; explanation: string }[];
}

export default function QuizPanel({ lessonId, onPassed }: { lessonId: string; onPassed: () => void }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuiz(null);
    setResult(null);
    setAnswers({});
    api.get(`/quiz/lesson/${lessonId}`).then((r) => setQuiz(r.data)).catch(() => setQuiz(null));
  }, [lessonId]);

  if (!quiz) return null;

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    try {
      const payload = quiz.questions.map((_, i) => answers[i] ?? -1);
      const { data } = await api.post<Result>(`/quiz/${quiz.id}/submit`, { answers: payload });
      setResult(data);
      if (data.passed) onPassed();
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">📝 Kiểm tra cuối bài</h3>
        <span className="badge bg-chalk-amber/15 text-chalk-amber">Cần ≥ {quiz.passScore}% để qua bài</span>
      </div>

      {result && (
        <div
          className={`mb-5 rounded-2xl border-2 p-5 text-center animate-pop-in ${
            result.passed
              ? 'border-chalk-mint/40 bg-chalk-mint/10'
              : 'border-chalk-coral/40 bg-chalk-coral/10'
          }`}
        >
          <div className="font-display text-5xl font-bold">
            {result.score}<span className="text-2xl">/100</span>
          </div>
          <div className={`mt-1 font-display text-lg font-bold ${result.passed ? 'text-chalk-mint' : 'text-chalk-coral'}`}>
            {result.passed ? '🎉 Đạt yêu cầu — bài tiếp theo đã mở khóa!' : `😢 Chưa đạt (cần ${result.passScore}%). Xem lại bài giảng rồi thử lại nhé!`}
          </div>
          <div className="mt-1 text-sm text-slate-500">Đúng {result.correct}/{result.total} câu</div>
          {!result.passed && (
            <button onClick={retry} className="btn-primary mt-3">Làm lại</button>
          )}
        </div>
      )}

      <ol className="space-y-5">
        {quiz.questions.map((q, qi) => (
          <li key={q.id}>
            <div className="mb-2 font-semibold">Câu {qi + 1}. {q.text}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                let cls = 'border-ink-900/15 dark:border-white/15 hover:border-ink-500';
                if (result) {
                  const d = result.detail[qi];
                  if (oi === d.correctIndex) cls = 'border-chalk-mint bg-chalk-mint/10';
                  else if (chosen && !d.isCorrect) cls = 'border-chalk-coral bg-chalk-coral/10';
                  else cls = 'border-ink-900/10 dark:border-white/10 opacity-60';
                } else if (chosen) {
                  cls = 'border-ink-500 bg-ink-500/10';
                }
                return (
                  <button
                    key={oi}
                    disabled={!!result}
                    onClick={() => setAnswers({ ...answers, [qi]: oi })}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm font-medium transition-all ${cls}`}
                  >
                    <span className="mr-2 font-display font-bold text-ink-500 dark:text-chalk-sky">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {result && result.detail[qi].explanation && (
              <div className="mt-2 rounded-lg bg-ink-500/5 dark:bg-white/5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                💡 {result.detail[qi].explanation}
              </div>
            )}
          </li>
        ))}
      </ol>

      {!result && (
        <button
          onClick={submit}
          disabled={busy || Object.keys(answers).length < quiz.questions.length}
          className="btn-primary mt-6 w-full py-3"
        >
          {busy ? 'Đang chấm…' : `Nộp bài (${Object.keys(answers).length}/${quiz.questions.length} câu)`}
        </button>
      )}
    </div>
  );
}
