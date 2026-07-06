import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db.js';
import { isLessonUnlocked, submitQuiz } from '../src/modules/quiz/service.js';

// Tạo khóa học riêng cho test: 1 chương, 2 bài, bài 1 có quiz 2 câu (pass 70%)
let userId: string;
let lesson1Id: string;
let lesson2Id: string;
let quizId: string;
let courseId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: 'test-gate@example.com', password: await bcrypt.hash('x', 4), name: 'Gate Tester' },
  });
  userId = user.id;

  const course = await prisma.course.create({
    data: {
      title: 'TEST Gate Course',
      order: 999,
      chapters: {
        create: {
          title: 'Chương test',
          order: 0,
          lessons: {
            create: [
              {
                title: 'Bài test 1',
                order: 0,
                quiz: {
                  create: {
                    passScore: 70,
                    questions: {
                      create: [
                        { order: 0, text: '1+1=?', optionsJson: '["1","2","3","4"]', answerIndex: 1 },
                        { order: 1, text: '2+2=?', optionsJson: '["2","3","4","5"]', answerIndex: 2 },
                      ],
                    },
                  },
                },
              },
              { title: 'Bài test 2', order: 1 },
            ],
          },
        },
      },
    },
    include: { chapters: { include: { lessons: { orderBy: { order: 'asc' }, include: { quiz: true } } } } },
  });
  courseId = course.id;
  const lessons = course.chapters[0].lessons;
  lesson1Id = lessons[0].id;
  lesson2Id = lessons[1].id;
  quizId = lessons[0].quiz!.id;
});

afterAll(async () => {
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('quiz gate', () => {
  it('bài đầu tiên luôn mở', async () => {
    expect(await isLessonUnlocked(userId, lesson1Id)).toBe(true);
  });

  it('bài 2 khóa khi chưa pass quiz bài 1', async () => {
    expect(await isLessonUnlocked(userId, lesson2Id)).toBe(false);
  });

  it('nộp quiz sai hết → 0 điểm, không pass, bài 2 vẫn khóa', async () => {
    const result = await submitQuiz(userId, quizId, [0, 0]);
    expect(result!.score).toBe(0);
    expect(result!.passed).toBe(false);
    expect(await isLessonUnlocked(userId, lesson2Id)).toBe(false);
  });

  it('nộp đúng 1/2 → 50 điểm < 70, vẫn khóa', async () => {
    const result = await submitQuiz(userId, quizId, [1, 0]);
    expect(result!.score).toBe(50);
    expect(result!.passed).toBe(false);
    expect(await isLessonUnlocked(userId, lesson2Id)).toBe(false);
  });

  it('nộp đúng hết → 100 điểm, pass, bài 2 mở khóa', async () => {
    const result = await submitQuiz(userId, quizId, [1, 2]);
    expect(result!.score).toBe(100);
    expect(result!.passed).toBe(true);
    expect(await isLessonUnlocked(userId, lesson2Id)).toBe(true);
  });
});
