export interface LectureAnalysis {
  summary: string;
  concepts: string[];
  objectives: string[];
}

export interface Exercise {
  question: string;
  hint: string;
  solution: string;
}

export interface Slide {
  title: string;
  bullets: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  analyzeLecture(lessonId: string): Promise<LectureAnalysis>;
  generateExercises(lessonId: string): Promise<Exercise[]>;
  chat(lessonId: string, history: ChatMessage[]): Promise<string>;
  generateSlides(lessonId: string): Promise<Slide[]>;
}
