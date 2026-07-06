import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../db.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, requireRole('ADMIN'));

analyticsRouter.get('/dashboard', async (_req, res) => {
  const [totalStudents, bannedStudents, totalLessons, unresolvedEvents] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'BANNED' } }),
    prisma.lesson.count(),
    prisma.securityEvent.count({ where: { resolved: false } }),
  ]);

  const attempts = await prisma.quizAttempt.findMany({ select: { passed: true } });
  const passRate = attempts.length === 0 ? 0 : Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100);

  // Tiến độ từng học sinh
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true, name: true, email: true, status: true,
      progress: { where: { completed: true }, select: { lessonId: true } },
      attempts: { select: { score: true, passed: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      activities: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentActivity = await prisma.activityLog.count({ where: { createdAt: { gte: sevenDaysAgo } } });

  res.json({
    totalStudents,
    bannedStudents,
    totalLessons,
    unresolvedEvents,
    passRate,
    totalAttempts: attempts.length,
    recentActivity,
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      completedLessons: s.progress.length,
      totalLessons,
      lastScore: s.attempts[0]?.score ?? null,
      lastActive: s.activities[0]?.createdAt ?? null,
    })),
  });
});
