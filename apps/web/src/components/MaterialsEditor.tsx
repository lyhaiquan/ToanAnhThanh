import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Exercise { question: string; hint: string; solution: string }
interface Slide { title: string; bullets: string[] }
type Mode = 'ai' | 'teacher';

/**
 * Soạn tài liệu bài học: tab "Bài tập" và "Slide" phía học sinh mỗi tab có 2 nguồn —
 * 🤖 AI tự sinh (mặc định) hoặc 👨‍🏫 thầy tự soạn. Hiển thị phía học sinh không đổi.
 */
export default function MaterialsEditor({
  lessonId,
  lessonTitle,
  onClose,
}: {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}) {
  const [exerciseMode, setExerciseMode] = useState<Mode>('ai');
  const [slideMode, setSlideMode] = useState<Mode>('ai');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/courses/lessons/${lessonId}/materials`).then((r) => {
      setExerciseMode(r.data.exerciseMode);
      setSlideMode(r.data.slideMode);
      setExercises(r.data.exercises);
      setSlides(r.data.slides);
      setLoaded(true);
    });
  }, [lessonId]);

  async function save() {
    setError('');
    const cleanEx = exercises
      .map((e) => ({ question: e.question.trim(), hint: e.hint.trim(), solution: e.solution.trim() }))
      .filter((e) => e.question);
    const cleanSl = slides
      .map((s) => ({ title: s.title.trim(), bullets: s.bullets.map((b) => b.trim()).filter(Boolean) }))
      .filter((s) => s.title);
    if (exerciseMode === 'teacher' && cleanEx.length === 0) {
      setError('Chế độ "Thầy soạn" cho Bài tập đang trống — thêm ít nhất 1 bài, hoặc chuyển về AI tự sinh.');
      return;
    }
    if (slideMode === 'teacher' && cleanSl.length === 0) {
      setError('Chế độ "Thầy soạn" cho Slide đang trống — thêm ít nhất 1 slide, hoặc chuyển về AI tự sinh.');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/courses/lessons/${lessonId}/materials`, {
        exerciseMode,
        exercises: cleanEx,
        slideMode,
        slides: cleanSl,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Lưu thất bại, thử lại nhé');
    } finally {
      setSaving(false);
    }
  }

  function ModePicker({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
    return (
      <div className="flex gap-2">
        {([
          { key: 'ai', label: '🤖 AI tự sinh' },
          { key: 'teacher', label: '👨‍🏫 Thầy soạn' },
        ] as const).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              value === o.key ? 'bg-ink-500 text-white' : 'bg-ink-500/10 text-slate-500 hover:bg-ink-500/20'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-ink-900/10 dark:border-white/10 px-5 py-4">
          <h2 className="font-display font-bold">📚 Bài tập &amp; Slide — {lessonTitle}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Chọn nguồn cho từng phần. Học sinh nhìn thấy giao diện như cũ.</p>
        </div>

        {!loaded ? (
          <div className="p-10 text-center text-slate-400">Đang tải…</div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <section>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold">✏️ Bài tập</h3>
                <ModePicker value={exerciseMode} onChange={setExerciseMode} />
              </div>
              {exerciseMode === 'teacher' && (
                <div className="mt-3 space-y-3">
                  {exercises.map((ex, i) => (
                    <div key={i} className="rounded-xl border-2 border-ink-900/10 dark:border-white/10 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Bài {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setExercises(exercises.filter((_, j) => j !== i))}
                          className="text-xs text-chalk-coral hover:underline"
                        >Xóa</button>
                      </div>
                      <input
                        className="input mt-1 text-sm"
                        placeholder="Đề bài (bắt buộc)"
                        value={ex.question}
                        onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                      />
                      <input
                        className="input mt-2 text-sm"
                        placeholder="Gợi ý (tùy chọn)"
                        value={ex.hint}
                        onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)))}
                      />
                      <textarea
                        className="input mt-2 min-h-[60px] text-sm"
                        placeholder="Lời giải (hiện khi học sinh bấm 'Xem lời giải')"
                        value={ex.solution}
                        onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, solution: e.target.value } : x)))}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setExercises([...exercises, { question: '', hint: '', solution: '' }])}
                    className="btn-ghost w-full text-sm"
                  >＋ Thêm bài tập</button>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold">🖥️ Slide</h3>
                <ModePicker value={slideMode} onChange={setSlideMode} />
              </div>
              {slideMode === 'teacher' && (
                <div className="mt-3 space-y-3">
                  {slides.map((s, i) => (
                    <div key={i} className="rounded-xl border-2 border-ink-900/10 dark:border-white/10 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Slide {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setSlides(slides.filter((_, j) => j !== i))}
                          className="text-xs text-chalk-coral hover:underline"
                        >Xóa</button>
                      </div>
                      <input
                        className="input mt-1 text-sm"
                        placeholder="Tiêu đề slide (bắt buộc)"
                        value={s.title}
                        onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      />
                      <textarea
                        className="input mt-2 min-h-[70px] text-sm"
                        placeholder={'Các ý chính — mỗi dòng một gạch đầu dòng'}
                        value={s.bullets.join('\n')}
                        onChange={(e) => setSlides(slides.map((x, j) => (j === i ? { ...x, bullets: e.target.value.split('\n') } : x)))}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSlides([...slides, { title: '', bullets: [] }])}
                    className="btn-ghost w-full text-sm"
                  >＋ Thêm slide</button>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="border-t-2 border-ink-900/10 dark:border-white/10 p-4">
          {error && <p className="mb-2 text-sm text-chalk-coral">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary flex-1" disabled={saving || !loaded}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button onClick={onClose} className="btn-ghost flex-1">Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
