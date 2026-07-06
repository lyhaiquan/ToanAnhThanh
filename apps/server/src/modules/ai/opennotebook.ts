import { config } from '../../config.js';
import { prisma } from '../../db.js';
import type { AIProvider, ChatMessage, Exercise, LectureAnalysis, Slide } from './provider.js';

/**
 * Adapter gọi REST API của open-notebook (https://github.com/lfnovo/open-notebook).
 *
 * Cách kích hoạt:
 * 1. Chạy open-notebook (Docker): docker run -p 5055:5055 lfnovo/open_notebook:latest-single
 * 2. Cấu hình model/API key trong giao diện open-notebook (OpenAI/Anthropic/Gemini/Ollama).
 * 3. Đặt biến môi trường cho server này:
 *      AI_PROVIDER=opennotebook
 *      ON_API_URL=http://localhost:5055
 *      ON_API_PASSWORD=<nếu có đặt password>
 *
 * Mỗi lesson ánh xạ 1 notebook (tạo lười khi gọi lần đầu, lưu id vào bảng Lesson.description? — không:
 * dùng notebook name = lessonId để tra cứu). Nội dung mô tả bài giảng được đẩy vào notebook làm source.
 */
export class OpenNotebookProvider implements AIProvider {
  constructor() {
    if (!config.openNotebookUrl) {
      throw new Error(
        'OpenNotebookProvider cần ON_API_URL (ví dụ http://localhost:5055). ' +
          'Xem hướng dẫn trong apps/server/src/modules/ai/opennotebook.ts'
      );
    }
  }

  private async api(path: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`${config.openNotebookUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(config.openNotebookPassword ? { Authorization: `Bearer ${config.openNotebookPassword}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`open-notebook API lỗi ${res.status}: ${await res.text()}`);
    return res.json();
  }

  /** Tìm hoặc tạo notebook cho lesson, đẩy mô tả bài học làm source. */
  private async ensureNotebook(lessonId: string): Promise<string> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) throw new Error('Không tìm thấy bài học');

    const notebooks: any[] = await this.api('/api/notebooks');
    const existing = notebooks.find((n) => n.name === `lms-${lessonId}`);
    if (existing) return existing.id;

    const created = await this.api('/api/notebooks', {
      method: 'POST',
      body: JSON.stringify({
        name: `lms-${lessonId}`,
        description: `${lesson.chapter.course.title} / ${lesson.chapter.title} / ${lesson.title}`,
      }),
    });
    await this.api('/api/sources', {
      method: 'POST',
      body: JSON.stringify({
        notebook_id: created.id,
        type: 'text',
        content: `Bài giảng: ${lesson.title}\n\n${lesson.description}`,
      }),
    });
    return created.id;
  }

  private async ask(lessonId: string, question: string): Promise<string> {
    const notebookId = await this.ensureNotebook(lessonId);
    const result = await this.api('/api/search/ask', {
      method: 'POST',
      body: JSON.stringify({ question, notebook_id: notebookId }),
    });
    return result.answer ?? JSON.stringify(result);
  }

  async analyzeLecture(lessonId: string): Promise<LectureAnalysis> {
    const raw = await this.ask(
      lessonId,
      'Phân tích bài giảng này. Trả về JSON: {"summary": "...", "concepts": ["..."], "objectives": ["..."]}. Chỉ trả JSON.'
    );
    try {
      return JSON.parse(raw.replace(/```json?|```/g, '').trim());
    } catch {
      return { summary: raw, concepts: [], objectives: [] };
    }
  }

  async generateExercises(lessonId: string): Promise<Exercise[]> {
    const raw = await this.ask(
      lessonId,
      'Sinh 3 bài tập tương tự nội dung bài giảng. Trả về JSON array: [{"question","hint","solution"}]. Chỉ trả JSON.'
    );
    try {
      return JSON.parse(raw.replace(/```json?|```/g, '').trim());
    } catch {
      return [{ question: raw, hint: '', solution: '' }];
    }
  }

  async chat(lessonId: string, history: ChatMessage[]): Promise<string> {
    const last = history.filter((m) => m.role === 'user').pop();
    return this.ask(lessonId, last?.content ?? 'Tóm tắt bài giảng này.');
  }

  async generateSlides(lessonId: string): Promise<Slide[]> {
    const raw = await this.ask(
      lessonId,
      'Tạo dàn slide (5-7 slide) từ bài giảng. Trả về JSON array: [{"title","bullets":["..."]}]. Chỉ trả JSON.'
    );
    try {
      return JSON.parse(raw.replace(/```json?|```/g, '').trim());
    } catch {
      return [{ title: 'Slide', bullets: [raw] }];
    }
  }
}
