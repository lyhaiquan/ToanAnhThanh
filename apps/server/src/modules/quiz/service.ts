import { prisma } from '../../db.js';

/**
 * Gate logic: bài học mở khi
 *  - là bài đầu tiên của toàn khóa học, HOẶC
 *  - quiz của bài liền trước (theo thứ tự chương → bài) đã pass.
 * Bài không có quiz coi như pass khi đã xem (Progress.completed).
 */

export async function getOrderedLessons(courseId: string) {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' }, include: { quiz: { select: { id: true } } } } },
  });
  return chapters.flatMap((c) => c.lessons);
}

export async function isLessonUnlocked(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });
  if (!lesson) return false;

  const ordered = await getOrderedLessons(lesson.chapter.courseId);
  const idx = ordered.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return true; // bài đầu tiên luôn mở

  const prev = ordered[idx - 1];
  return isLessonCompleted(userId, prev.id, prev.quiz?.id ?? null);
}

async function isLessonCompleted(userId: string, lessonId: string, quizId: string | null): Promise<boolean> {
  if (quizId) {
    const passed = await prisma.quizAttempt.findFirst({ where: { userId, quizId, passed: true } });
    return !!passed;
  }
  const progress = await prisma.progress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  return !!progress?.completed;
}

export async function submitQuiz(userId: string, quizId: string, answers: number[]) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) return null;

  let correct = 0;
  const detail = quiz.questions.map((q, i) => {
    const chosen = answers[i] ?? -1;
    const isCorrect = chosen === q.answerIndex;
    if (isCorrect) correct++;
    return { questionId: q.id, chosen, correctIndex: q.answerIndex, isCorrect, explanation: q.explanation };
  });

  const score = quiz.questions.length === 0 ? 0 : Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passScore;

  await prisma.quizAttempt.create({
    data: { userId, quizId, answersJson: JSON.stringify(answers), score, passed },
  });

  if (passed) {
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId: quiz.lessonId } },
      update: { completed: true },
      create: { userId, lessonId: quiz.lessonId, completed: true },
    });
  }

  await prisma.activityLog.create({
    data: { userId, type: 'QUIZ_SUBMIT', metadata: JSON.stringify({ quizId, score, passed }) },
  });

  return { score, passed, passScore: quiz.passScore, correct, total: quiz.questions.length, detail };
}
