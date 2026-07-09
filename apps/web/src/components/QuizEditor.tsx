import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Question {
  text: string;
  options: string[]; // đúng 4 phương án
  answerIndex: number;
  explanation: string;
}

interface Props {
  lessonId: string;
  lessonTitle: string;
  hasQuiz: boolean;
  onClose: (changed: boolean) => void;
}

const emptyQuestion = (): Question => ({ text: '', options: ['', '', '', ''], answerIndex: 0, explanation: '' });

/**
 * Modal soạn quiz cho một bài học: điểm đạt + danh sách câu hỏi 4 phương án.
 * Lưu = thay toàn bộ đề (PUT) hoặc tạo mới (POST) tùy bài đã có quiz chưa.
 */
export default function QuizEditor({ lessonId, lessonTitle, hasQuiz, onClose }: Props) {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [passScore, setPassScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(hasQuiz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasQuiz) return;
    api
      .get(`/quiz/lesson/${lessonId}/admin`)
      .then((r) => {
        setQuizId(r.data.id);
        setPassScore(r.data.passScore);
        setQuestions(r.data.questions);
      })
      .catch(() => setError('Không tải được đề hiện có'))
      .finally(() => setLoading(false));
  }, [lessonId, hasQuiz]);

  function patchQuestion(i: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function validate(): string {
    if (questions.length === 0) return 'Đề phải có ít nhất 1 câu hỏi.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi.`;
      if (q.options.some((o) => !o.trim())) return `Câu ${i + 1}: cần đủ 4 phương án.`;
    }
    return '';
  }

  async function save() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = { passScore, questions };
      if (quizId) await api.put(`/quiz/${quizId}`, body);
      else await api.post(`/quiz/lesson/${lessonId}`, body);
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Lưu đề thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function removeQuiz() {
    if (!quizId || !confirm('Xóa quiz của bài này? Bài kế tiếp sẽ không bị khóa gate nữa.')) return;
    await api.delete(`/quiz/${quizId}`);
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onClose(false)}>
      <div
        className="card flex max-h-[85vh] w-full max-w-2xl flex-col animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink-900/10 dark:border-white/10 px-5 py-3">
          <h2 className="font-display text-lg font-bold truncate">📝 Quiz — {lessonTitle}</h2>
          <button className="btn-ghost text-sm shrink-0" onClick={() => onClose(false)}>✕</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải đề…</div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <label className="flex items-center gap-3 text-sm font-semibold">
                Điểm đạt (%)
                <input
                  className="input w-24"
                  type="number"
                  min={0}
                  max={100}
                  value={passScore}
                  onChange={(e) => setPassScore(Number(e.target.value))}
                />
                <span className="font-normal text-slate-500">đúng từ {passScore}% trở lên mới mở bài kế tiếp</span>
              </label>

              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border-2 border-ink-900/10 dark:border-white/10 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge bg-ink-500/10 text-ink-600 dark:text-chalk-sky shrink-0">Câu {i + 1}</span>
                    <button
                      className="text-sm text-chalk-coral hover:underline"
                      onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                    >
                      Xóa câu
                    </button>
                  </div>
                  <textarea
                    className="input mt-2"
                    rows={2}
                    placeholder="Nội dung câu hỏi"
                    value={q.text}
                    onChange={(e) => patchQuestion(i, { text: e.target.value })}
                  />
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 ${
                        q.answerIndex === oi ? 'border-chalk-mint bg-chalk-mint/10' : 'border-transparent'
                      }`}>
                        <input
                          type="radio"
                          name={`answer-${i}`}
                          checked={q.answerIndex === oi}
                          onChange={() => patchQuestion(i, { answerIndex: oi })}
                          title="Chọn làm đáp án đúng"
                        />
                        <input
                          className="input flex-1 py-1 text-sm"
                          placeholder={`Phương án ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={(e) =>
                            patchQuestion(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <input
                    className="input mt-2 text-sm"
                    placeholder="Giải thích đáp án (hiện sau khi học sinh nộp — không bắt buộc)"
                    value={q.explanation}
                    onChange={(e) => patchQuestion(i, { explanation: e.target.value })}
                  />
                </div>
              ))}

              <button className="btn-ghost w-full border-2 border-dashed border-ink-900/20 dark:border-white/20" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
                + Thêm câu hỏi
              </button>
            </div>

            <div className="flex items-center gap-2 border-t-2 border-ink-900/10 dark:border-white/10 px-5 py-3">
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Đang lưu…' : quizId ? 'Lưu đề' : 'Tạo quiz'}
              </button>
              {quizId && (
                <button className="btn-ghost text-chalk-coral" onClick={removeQuiz}>Xóa quiz</button>
              )}
              {error && <span className="text-sm text-chalk-coral">{error}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
