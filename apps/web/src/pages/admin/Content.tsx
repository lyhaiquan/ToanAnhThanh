import { DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface LessonRow { id: string; title: string; hasQuiz: boolean }
interface ChapterRow { id: string; title: string; lessons: LessonRow[] }
interface CourseTree { id: string; title: string; chapters: ChapterRow[] }

// Trạng thái upload của một chương: file thứ mấy / tổng số, % file hiện tại
interface UploadState { fileName: string; percent: number; index: number; total: number }
interface ChapterMsg { kind: 'ok' | 'err'; text: string }

const ACCEPT = '.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime';
const isVideoFile = (f: File) =>
  /video\/(mp4|webm|quicktime)/.test(f.type) || /\.(mp4|webm|mov)$/i.test(f.name);

/**
 * Quản lý nội dung: cây khóa học, mỗi chương là một vùng nhận video.
 * Nhận file bằng cả kéo-thả LẪN bấm chọn; upload nhiều file tuần tự có % tiến độ;
 * đổi tên bài/chương tại chỗ bằng nút ✏️.
 */
export default function AdminContent() {
  const [courses, setCourses] = useState<CourseTree[]>([]);
  const [uploads, setUploads] = useState<Record<string, UploadState | undefined>>({});
  const [msgs, setMsgs] = useState<Record<string, ChapterMsg | undefined>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [newChapter, setNewChapter] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ type: 'lesson' | 'chapter'; id: string; value: string } | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    const list = await api.get('/courses');
    const trees = await Promise.all(list.data.map((c: { id: string }) => api.get(`/courses/${c.id}`)));
    setCourses(trees.map((t) => t.data));
  }
  useEffect(() => { load(); }, []);

  function setMsg(chapterId: string, msg: ChapterMsg | undefined) {
    setMsgs((m) => ({ ...m, [chapterId]: msg }));
  }

  async function uploadFiles(chapterId: string, fileList: FileList | File[]) {
    const all = [...fileList];
    const videos = all.filter(isVideoFile);
    const skipped = all.length - videos.length;
    if (videos.length === 0) {
      setMsg(chapterId, { kind: 'err', text: '⚠️ Không có file video hợp lệ (nhận MP4 / WebM / MOV)' });
      return;
    }
    setMsg(chapterId, undefined);

    let done = 0;
    const failed: string[] = [];
    for (let i = 0; i < videos.length; i++) {
      const file = videos[i];
      setUploads((u) => ({ ...u, [chapterId]: { fileName: file.name, percent: 0, index: i + 1, total: videos.length } }));
      try {
        const fd = new FormData();
        fd.append('video', file);
        await api.post(`/storage/upload/${chapterId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setUploads((u) => ({ ...u, [chapterId]: { fileName: file.name, percent, index: i + 1, total: videos.length } }));
          },
        });
        done++;
      } catch (err: any) {
        failed.push(`${file.name}: ${err.response?.data?.error ?? 'lỗi mạng'}`);
      }
    }
    setUploads((u) => ({ ...u, [chapterId]: undefined }));

    const parts: string[] = [];
    if (done > 0) parts.push(`✅ Đã thêm ${done} bài giảng`);
    if (skipped > 0) parts.push(`⚠️ Bỏ qua ${skipped} file không phải video`);
    if (failed.length > 0) parts.push(`❌ Lỗi: ${failed.join('; ')}`);
    setMsg(chapterId, { kind: failed.length > 0 ? 'err' : 'ok', text: parts.join(' · ') });
    await load();
  }

  function handleDrop(e: DragEvent, chapterId: string) {
    e.preventDefault();
    setDragOver(null);
    if (uploads[chapterId]) return; // đang upload thì bỏ qua thả thêm
    uploadFiles(chapterId, e.dataTransfer.files);
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

  async function saveEdit() {
    if (!editing) return;
    const title = editing.value.trim();
    const { type, id } = editing;
    setEditing(null);
    if (!title) return;
    await api.patch(type === 'lesson' ? `/courses/lessons/${id}` : `/courses/chapters/${id}`, { title });
    await load();
  }

  function editKeys(e: KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditing(null);
  }

  const editInput = (
    <input
      className="input py-1 text-sm"
      value={editing?.value ?? ''}
      onChange={(e) => setEditing(editing && { ...editing, value: e.target.value })}
      onBlur={saveEdit}
      onKeyDown={editKeys}
      autoFocus
    />
  );

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <h1 className="text-3xl font-bold">Nội dung 🎬</h1>
      <p className="mt-1 text-sm text-slate-500">
        Kéo-thả video vào chương hoặc bấm vào ô để chọn file. Đổi tên bài/chương bằng nút ✏️.
      </p>

      {courses.map((course) => (
        <div key={course.id} className="mt-6">
          <h2 className="font-display text-xl font-bold">{course.title}</h2>
          <div className="mt-3 space-y-4">
            {course.chapters.map((ch) => {
              const up = uploads[ch.id];
              const msg = msgs[ch.id];
              return (
                <div
                  key={ch.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(ch.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, ch.id)}
                  className={`card overflow-hidden transition-all ${
                    dragOver === ch.id ? 'scale-[1.01] border-ink-500 ring-4 ring-ink-500/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b-2 border-ink-900/10 dark:border-white/10 bg-ink-500/5 dark:bg-white/5 px-5 py-3">
                    {editing?.type === 'chapter' && editing.id === ch.id ? (
                      <div className="flex-1">{editInput}</div>
                    ) : (
                      <h3 className="font-display font-bold">
                        {ch.title}
                        <button
                          onClick={() => setEditing({ type: 'chapter', id: ch.id, value: ch.title })}
                          className="ml-2 opacity-40 hover:opacity-100"
                          title="Đổi tên chương"
                        >✏️</button>
                      </h3>
                    )}
                    <span className="shrink-0 text-xs text-slate-500">{ch.lessons.length} bài</span>
                  </div>

                  <ul className="divide-y divide-ink-900/5 dark:divide-white/5">
                    {ch.lessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <span>🎞️</span>
                        {editing?.type === 'lesson' && editing.id === l.id ? (
                          <div className="flex-1">{editInput}</div>
                        ) : (
                          <span className="flex-1 font-medium">
                            {l.title}
                            <button
                              onClick={() => setEditing({ type: 'lesson', id: l.id, value: l.title })}
                              className="ml-2 opacity-40 hover:opacity-100"
                              title="Đổi tên bài"
                            >✏️</button>
                          </span>
                        )}
                        {l.hasQuiz && <span className="badge bg-chalk-amber/15 text-chalk-amber">Quiz</span>}
                        <button onClick={() => removeLesson(l.id, l.title)} className="text-chalk-coral hover:underline">Xóa</button>
                      </li>
                    ))}
                  </ul>

                  {/* Vùng nhận file: bấm để chọn hoặc kéo-thả; đang upload thì hiện tiến độ */}
                  <input
                    ref={(el) => { fileInputs.current[ch.id] = el; }}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) uploadFiles(ch.id, e.target.files);
                      e.target.value = ''; // cho phép chọn lại cùng file lần sau
                    }}
                  />
                  {up ? (
                    <div className="m-3 rounded-xl border-2 border-chalk-amber bg-chalk-amber/10 px-4 py-4">
                      <div className="flex items-center justify-between text-sm font-medium text-chalk-amber">
                        <span className="truncate">⏳ {up.fileName}</span>
                        <span className="ml-3 shrink-0">
                          {up.total > 1 && `file ${up.index}/${up.total} · `}{up.percent}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-chalk-amber/20">
                        <div
                          className="h-full rounded-full bg-chalk-amber transition-all duration-200"
                          style={{ width: `${up.percent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputs.current[ch.id]?.click()}
                      className={`m-3 flex w-[calc(100%-1.5rem)] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-sm font-medium transition-colors ${
                        dragOver === ch.id
                          ? 'border-ink-500 bg-ink-500/10 text-ink-600 dark:text-chalk-sky'
                          : 'border-ink-900/20 dark:border-white/20 text-slate-400 hover:border-ink-500/50 hover:text-ink-600 dark:hover:text-chalk-sky'
                      }`}
                    >
                      <span>⬇️ Thả video vào đây, hoặc bấm để chọn file</span>
                      <span className="text-xs font-normal text-slate-400">MP4 / WebM / MOV · tối đa 2GB · chọn được nhiều file</span>
                    </button>
                  )}

                  {msg && (
                    <div className={`mx-3 mb-3 rounded-lg px-3 py-2 text-sm font-medium animate-pop-in ${
                      msg.kind === 'ok' ? 'bg-chalk-mint/10 text-chalk-mint' : 'bg-chalk-coral/10 text-chalk-coral'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}

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
