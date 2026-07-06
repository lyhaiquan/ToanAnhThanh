import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type Q = { text: string; options: string[]; answer: number; explain: string };

function questions(qs: Q[]) {
  return qs.map((q, i) => ({
    order: i,
    text: q.text,
    optionsJson: JSON.stringify(q.options),
    answerIndex: q.answer,
    explanation: q.explain,
  }));
}

async function main() {
  // Users
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const studentPass = await bcrypt.hash('Hocsinh@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@toananhthanh.vn' },
    update: {},
    create: { email: 'admin@toananhthanh.vn', password: adminPass, name: 'Thầy Anh Thành', role: 'ADMIN' },
  });

  const students = [];
  for (let i = 1; i <= 3; i++) {
    students.push(
      await prisma.user.upsert({
        where: { email: `hocsinh${i}@gmail.com` },
        update: {},
        create: {
          email: `hocsinh${i}@gmail.com`,
          password: studentPass,
          name: ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu'][i - 1],
          role: 'STUDENT',
        },
      })
    );
  }

  // Course
  const existing = await prisma.course.findFirst({ where: { title: 'Toán 12' } });
  if (existing) {
    console.log('Seed: course already exists, skipping content seed');
    return;
  }

  const course = await prisma.course.create({
    data: {
      title: 'Toán 12',
      description: 'Khóa học Toán lớp 12 — luyện thi THPT Quốc gia cùng thầy Anh Thành',
      order: 0,
    },
  });

  const chapters = [
    {
      title: 'Chương 1: Ứng dụng đạo hàm — Khảo sát hàm số',
      lessons: [
        {
          title: 'Bài 1: Sự đồng biến, nghịch biến của hàm số',
          description: 'Điều kiện đủ để hàm số đơn điệu trên một khoảng, quy tắc xét tính đơn điệu qua đạo hàm.',
          video: 'sample1.mp4',
          quiz: [
            { text: 'Hàm số y = x³ − 3x đồng biến trên khoảng nào?', options: ['(−1; 1)', '(−∞; −1) và (1; +∞)', '(0; +∞)', '(−∞; 0)'], answer: 1, explain: "y' = 3x² − 3 > 0 ⇔ x < −1 hoặc x > 1." },
            { text: "Cho hàm số có y' ≥ 0 trên (a; b), dấu bằng chỉ tại hữu hạn điểm. Kết luận nào đúng?", options: ['Hàm nghịch biến trên (a; b)', 'Hàm không đổi trên (a; b)', 'Hàm đồng biến trên (a; b)', 'Không kết luận được'], answer: 2, explain: 'Đây là điều kiện đủ để hàm đồng biến.' },
            { text: 'Hàm số y = (x + 1)/(x − 1) nghịch biến trên?', options: ['ℝ', 'ℝ \\ {1}', 'Từng khoảng (−∞; 1) và (1; +∞)', '(−1; 1)'], answer: 2, explain: "y' = −2/(x−1)² < 0 trên từng khoảng xác định; không nói 'trên ℝ \\ {1}'." },
          ],
        },
        {
          title: 'Bài 2: Cực trị của hàm số',
          description: 'Định nghĩa cực đại, cực tiểu; quy tắc 1 và quy tắc 2 tìm cực trị.',
          video: 'sample2.mp4',
          quiz: [
            { text: 'Hàm số y = x³ − 3x² + 2 có bao nhiêu điểm cực trị?', options: ['0', '1', '2', '3'], answer: 2, explain: "y' = 3x² − 6x = 0 ⇔ x = 0 hoặc x = 2; y' đổi dấu qua cả hai nghiệm." },
            { text: "Nếu y'(x₀) = 0 và y''(x₀) > 0 thì x₀ là:", options: ['Điểm cực đại', 'Điểm cực tiểu', 'Điểm uốn', 'Không kết luận được'], answer: 1, explain: 'Quy tắc 2: đạo hàm cấp hai dương → cực tiểu.' },
            { text: 'Hàm số y = x⁴ − 2x² có giá trị cực tiểu bằng?', options: ['0', '−1', '1', '−2'], answer: 1, explain: "y' = 4x³ − 4x = 0 ⇔ x = 0, ±1; y(±1) = −1 là giá trị cực tiểu." },
          ],
        },
        {
          title: 'Bài 3: Giá trị lớn nhất — nhỏ nhất của hàm số',
          description: 'Cách tìm GTLN, GTNN của hàm số trên một đoạn.',
          video: 'sample3.mp4',
          quiz: [
            { text: 'GTLN của y = x³ − 3x + 1 trên đoạn [0; 2] là?', options: ['1', '3', '−1', '5'], answer: 1, explain: "y' = 0 ⇔ x = 1 ∈ [0;2]; so sánh y(0)=1, y(1)=−1, y(2)=3 → max = 3." },
            { text: 'Trên đoạn [a; b], hàm số liên tục luôn đạt GTLN, GTNN. Đúng hay sai?', options: ['Đúng', 'Sai', 'Chỉ đúng khi hàm có đạo hàm', 'Chỉ đúng với đa thức'], answer: 0, explain: 'Định lý Weierstrass: hàm liên tục trên đoạn đạt max, min.' },
          ],
        },
      ],
    },
    {
      title: 'Chương 2: Hàm số lũy thừa — Mũ — Logarit',
      lessons: [
        {
          title: 'Bài 1: Lũy thừa và hàm số lũy thừa',
          description: 'Lũy thừa với số mũ nguyên, hữu tỉ, thực; tính chất và đồ thị hàm lũy thừa.',
          video: 'sample1.mp4',
          quiz: [
            { text: 'Rút gọn a^(2/3) · a^(1/3) (a > 0):', options: ['a^(2/9)', 'a', 'a²', 'a^(1/2)'], answer: 1, explain: 'Cộng số mũ: 2/3 + 1/3 = 1.' },
            { text: 'Tập xác định của y = x^(1/2) là?', options: ['ℝ', '[0; +∞)', '(0; +∞)', 'ℝ \\ {0}'], answer: 2, explain: 'Với số mũ không nguyên, cơ số phải dương.' },
          ],
        },
        {
          title: 'Bài 2: Logarit và phương trình mũ — logarit',
          description: 'Định nghĩa logarit, quy tắc tính, phương trình mũ và logarit cơ bản.',
          video: 'sample2.mp4',
          quiz: [
            { text: 'log₂ 8 + log₂ 4 = ?', options: ['5', '12', '32', '7'], answer: 0, explain: 'log₂ 8 = 3, log₂ 4 = 2 → tổng = 5.' },
            { text: 'Nghiệm của 2^x = 16 là?', options: ['x = 2', 'x = 3', 'x = 4', 'x = 8'], answer: 2, explain: '16 = 2⁴ → x = 4.' },
            { text: 'Điều kiện xác định của log(x − 1) là?', options: ['x ≥ 1', 'x > 1', 'x ≠ 1', 'x > 0'], answer: 1, explain: 'Biểu thức trong log phải dương: x − 1 > 0.' },
          ],
        },
      ],
    },
    {
      title: 'Chương 3: Nguyên hàm — Tích phân',
      lessons: [
        {
          title: 'Bài 1: Nguyên hàm và các phương pháp tìm nguyên hàm',
          description: 'Định nghĩa nguyên hàm, bảng nguyên hàm cơ bản, đổi biến và từng phần.',
          video: 'sample3.mp4',
          quiz: [
            { text: '∫x² dx = ?', options: ['x³ + C', 'x³/3 + C', '2x + C', '3x³ + C'], answer: 1, explain: 'Tăng bậc lên 3 rồi chia 3.' },
            { text: '∫cos x dx = ?', options: ['sin x + C', '−sin x + C', 'cos x + C', '−cos x + C'], answer: 0, explain: 'Đạo hàm của sin x là cos x.' },
          ],
        },
        {
          title: 'Bài 2: Tích phân và ứng dụng tính diện tích',
          description: 'Định nghĩa tích phân, công thức Newton–Leibniz, diện tích hình phẳng.',
          video: 'sample1.mp4',
          quiz: [
            { text: '∫₀¹ 2x dx = ?', options: ['0', '1', '2', '1/2'], answer: 1, explain: 'Nguyên hàm x²; x²|₀¹ = 1.' },
            { text: 'Diện tích hình phẳng giới hạn bởi y = f(x), trục Ox, x = a, x = b là?', options: ['∫ₐᵇ f(x) dx', '∫ₐᵇ |f(x)| dx', '|∫ₐᵇ f(x) dx|', 'f(b) − f(a)'], answer: 1, explain: 'Phải lấy trị tuyệt đối của f(x) trong dấu tích phân.' },
          ],
        },
      ],
    },
  ];

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci];
    const chapter = await prisma.chapter.create({
      data: { title: ch.title, order: ci, courseId: course.id },
    });
    for (let li = 0; li < ch.lessons.length; li++) {
      const l = ch.lessons[li];
      await prisma.lesson.create({
        data: {
          title: l.title,
          description: l.description,
          order: li,
          videoSource: 'local',
          videoRef: l.video,
          chapterId: chapter.id,
          quiz: {
            create: {
              passScore: 70,
              questions: { create: questions(l.quiz) },
            },
          },
        },
      });
    }
  }

  // Enroll all students
  for (const s of students) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: s.id, courseId: course.id } },
      update: {},
      create: { userId: s.id, courseId: course.id },
    });
  }

  console.log('Seed hoàn tất:');
  console.log('  Admin: admin@toananhthanh.vn / Admin@123');
  console.log('  Học sinh: hocsinh1..3@gmail.com / Hocsinh@123');
  console.log(`  Khóa học: ${course.title} (${chapters.length} chương)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
