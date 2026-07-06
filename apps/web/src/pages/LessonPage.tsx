import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import VideoPlayer from '../components/VideoPlayer';
import AIPanel from '../components/AIPanel';
import QuizPanel from '../components/QuizPanel';

interface LessonInfo {
  id: string;
  title: string;
  description: string;
  hasVideo: boolean;
  hasQuiz: boolean;
  chapterTitle: string;
  courseId: string;
  courseTitle: string;
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [locked, setLocked] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    setLesson(null);
    setLocked(false);
    setPassed(false);
    api
      .get(`/courses/lessons/${lessonId}`)
      .then((r) => setLesson(r.data))
      .catch((e) => {
        if (e.response?.status === 403) setLocked(true);
      });
  }, [lessonId]);

  if (locked)
    return (
      <div className="mx-auto max-w-lg animate-pop-in card p-10 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-4 text-2xl font-bold">Bài học chưa mở khóa</h1>
        <p className="mt-2 text-slate-500">Bạn cần đạt điểm quiz của bài trước (≥ 70%) để tiếp tục.</p>
        <Link to="/" className="btn-primary mt-6">Về trang khóa học</Link>
      </div>
    );

  if (!lesson) return <div className="p-10 text-center text-slate-400">Đang tải…</div>;

  return (
    <div className="animate-fade-up">
      <Link to={`/courses/${lesson.courseId}`} className="text-sm font-medium text-ink-500 dark:text-chalk-sky hover:underline">
        ← {lesson.courseTitle}
      </Link>
      <div className="mt-1 text-sm text-slate-500">{lesson.chapterTitle}</div>
      <h1 className="mt-1 text-2xl font-bold lg:text-3xl">{lesson.title}</h1>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          {lesson.hasVideo && <VideoPlayer lessonId={lesson.id} />}
          <p className="card p-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{lesson.description}</p>
          {lesson.hasQuiz && <QuizPanel lessonId={lesson.id} onPassed={() => setPassed(true)} />}
          {passed && (
            <div className="card border-chalk-mint/50 p-5 text-center animate-pop-in">
              <span className="font-display font-bold text-chalk-mint">✨ Tuyệt vời! </span>
              <Link to={`/courses/${lesson.courseId}`} className="font-semibold text-ink-500 dark:text-chalk-sky hover:underline">
                Quay lại khóa học để vào bài tiếp theo →
              </Link>
            </div>
          )}
        </div>
        <div>
          <AIPanel lessonId={lesson.id} />
        </div>
      </div>
    </div>
  );
}
