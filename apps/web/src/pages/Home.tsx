import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/store';

interface CourseCard {
  id: string;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
}

export default function Home() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    api.get('/courses').then((r) => setCourses(r.data));
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chào {user?.name?.split(' ').pop()}! 👋</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Hôm nay học gì nào? Hoàn thành quiz để mở bài tiếp theo nhé.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c, i) => {
          const pct = c.totalLessons === 0 ? 0 : Math.round((c.completedLessons / c.totalLessons) * 100);
          return (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="card card-hover p-6 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-3 flex h-12 w-12 -rotate-2 items-center justify-center rounded-xl bg-chalk-amber/15 text-2xl">
                🧮
              </div>
              <h2 className="text-xl font-bold">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>{c.completedLessons}/{c.totalLessons} bài</span>
                  <span className="text-ink-500 dark:text-chalk-sky">{pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-500/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ink-500 to-chalk-sky transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="card p-10 text-center text-slate-500">Chưa có khóa học nào. Quay lại sau nhé!</div>
      )}
    </div>
  );
}
