import { DragEvent, FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface LessonRow { id: string; title: string; hasQuiz: boolean }
interface ChapterRow { id: string; title: string; lessons: LessonRow[] }
interface CourseTree { id: string; title: string; chapters: ChapterRow[] }

/**
 * Quản lý nội dung: cây khóa học với dropzone kéo-thả video vào từng chương.
 * Thả file .mp4 vào chương → upload → tự tạo bài học mới trong chương đó.
 */
export default function AdminContent() {
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [uploading, setUploading] = useState<string | null>(null); // chapterId đang upload
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [newChapter, setNewChapter] = useState<Record<string, string>>({});

  async function load() {
    const list = await api.get('/courses');
    const trees = await Promise.all(list.data.map((c: { id: string }) => api.get(`/courses/${c.id}`)));
    setCourses(trees.map((t) => t.data));
  }
  useEffect(() => { load(); }, []);

  async function handleDrop(e: DragEvent, chapterId: string) {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setMessage('⚠️ Chỉ nhận file video (mp4/webm)');
      return;
    }
    setUploading(chapterId);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('video', file);
      await api.post(`/storage/upload/${chapterId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`✅ Đã thêm "${file.name}" vào chương`);
      await load();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.error ?? 'Upload thất bại'}`);
    } finally {
      setUploading(null);
    }
  }

  async function addChapter(e: FormEvent, courseId: string) {
    e.preventDefault();
    const title = newChapter[courseId]?.trim();
    if (!title) return;
    await api.post(`/courses/${courseId}/chapters`, { title });
    setNewChapter({ ...newChapter, [courseId]: '' });
    await load();
  }

  async function removeLesson(id: string, title: string) {
    if (!confirm(`Xóa bài "${title}"?`)) return;
    await api.delete(`/courses/lessons/${id}`);
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="text-3xl font-bold">Nội dung 🎬</h1>
      <p className="mt-1 text-sm text-slate-500">
        Kéo-thả file video vào chương để thêm bài giảng — thao tác giống hệt thả file vào thư mục Google Drive.
      </p>
      {message && <div className="card mt-3 px-4 py-2.5 text-sm font-medium animate-pop-in">{message}</div>}

      {courses.map((course) => (
        <div key={course.id} className="mt-6">
          <h2 className="font-display text-xl font-bold">{course.title}</h2>
          <div className="mt-3 space-y-4">
            {course.chapters.map((ch) => (
              <div
                key={ch.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(ch.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, ch.id)}
                className={`card overflow-hidden transition-all ${
                  dragOver === ch.id ? 'scale-[1.01] border-ink-500 ring-4 ring-ink-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b-2 border-ink-900/10 dark:border-white/10 bg-ink-500/5 dark:bg-white/5 px-5 py-3">
                  <h3 className="font-display font-bold">{ch.title}</h3>
                  <span className="text-xs text-slate-500">{ch.lessons.length} bài</span>
                </div>
                <ul className="divide-y divide-ink-900/5 dark:divide-white/5">
                  {ch.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                      <span>🎞️</span>
                      <span className="flex-1 font-medium">{l.title}</span>
                      {l.hasQuiz && <span className="badge bg-chalk-amber/15 text-chalk-amber">Quiz</span>}
                      <button onClick={() => removeLesson(l.id, l.title)} className="text-chalk-coral hover:underline">Xóa</button>
                    </li>
                  ))}
                </ul>
                <div
                  className={`m-3 flex items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-sm font-medium transition-colors ${
                    uploading === ch.id
                      ? 'border-chalk-amber bg-chalk-amber/10 text-chalk-amber'
                      : dragOver === ch.id
                        ? 'border-ink-500 bg-ink-500/10 text-ink-600 dark:text-chalk-sky'
                        : 'border-ink-900/20 dark:border-white/20 text-slate-400'
                  }`}
                >
                  {uploading === ch.id ? '⏳ Đang tải lên…' : '⬇️ Thả video vào đây để thêm bài giảng'}
                </div>
              </div>
            ))}

            <form onSubmit={(e) => addChapter(e, course.id)} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Tên chương mới (VD: Chương 4: Số phức)"
                value={newChapter[course.id] ?? ''}
                onChange={(e) => setNewChapter({ ...newChapter, [course.id]: e.target.value })}
              />
              <button className="btn-primary shrink-0">+ Thêm chương</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
