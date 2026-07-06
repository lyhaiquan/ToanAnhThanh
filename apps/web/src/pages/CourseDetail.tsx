import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

interface LessonRow {
  id: string;
  title: string;
  description: string;
  hasQuiz: boolean;
  unlocked: boolean;
  completed: boolean;
}
interface ChapterRow { id: string; title: string; lessons: LessonRow[] }
interface CourseTree { id: string; title: string; description: string; chapters: ChapterRow[] }

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<CourseTree | null>(null);

  useEffect(() => {
    api.get(`/courses/${courseId}`).then((r) => setCourse(r.data));
  }, [courseId]);

  if (!course) return <div className="p-10 text-center text-slate-400">Đang tải…</div>;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Link to="/" className="text-sm font-medium text-ink-500 dark:text-chalk-sky hover:underline">← Tất cả khóa học</Link>
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">{course.description}</p>

      <div className="mt-8 space-y-6">
        {course.chapters.map((ch, ci) => (
          <div key={ch.id} className="card overflow-hidden animate-fade-up" style={{ animationDelay: `${ci * 100}ms` }}>
            <div className="flex items-center gap-3 border-b-2 border-ink-900/10 dark:border-white/10 bg-ink-500/5 dark:bg-white/5 px-6 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-500 font-display font-bold text-white">
                {ci + 1}
              </span>
              <h2 className="font-display text-lg font-bold">{ch.title}</h2>
            </div>
            <ul>
              {ch.lessons.map((l) => (
                <li key={l.id} className="border-b border-ink-900/5 dark:border-white/5 last:border-0">
                  {l.unlocked ? (
                    <Link to={`/lessons/${l.id}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-ink-500/5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
                        l.completed ? 'bg-chalk-mint/15 text-chalk-mint' : 'bg-ink-500/10 text-ink-500 dark:text-chalk-sky'
                      }`}>
                        {l.completed ? '✓' : '▶'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{l.title}</div>
                        <div className="truncate text-sm text-slate-500 dark:text-slate-400">{l.description}</div>
                      </div>
                      {l.hasQuiz && (
                        <span className={`badge ${l.completed ? 'bg-chalk-mint/15 text-chalk-mint' : 'bg-chalk-amber/15 text-chalk-amber'}`}>
                          {l.completed ? 'Đã đạt' : 'Quiz'}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 px-6 py-4 opacity-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-lg">🔒</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{l.title}</div>
                        <div className="text-sm text-slate-500">Hoàn thành quiz bài trước để mở khóa</div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
