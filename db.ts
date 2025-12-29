
import Dexie, { type Table } from 'dexie';
import { Question, TestResult, TestSession } from './types';

// Using default import for Dexie to ensure the class and its members like 'version' are correctly recognized.
export class RadPrepDatabase extends Dexie {
  questions!: Table<Question>;
  results!: Table<TestResult>;
  sessions!: Table<TestSession & { id: string }>;

  constructor() {
    super('RadPrepDB');
    // Schema definition for Dexie
    this.version(3).stores({
      questions: '++id, text, chapter, isBookmarked',
      results: '++id, date, chapterName',
      sessions: 'id, chapterName'
    });
  }

  async addQuestions(fallbackChapterName: string, questions: any[]) {
    const formattedQuestions = questions.map((q) => {
      return {
        id: q.id,
        chapter: q.chapter || q.chapter_name || fallbackChapterName,
        text: q.text || q.question_text,
        options: q.options,
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correct_option_index,
        explanation: q.explanation,
        isBookmarked: false
      };
    });
    return await this.questions.bulkAdd(formattedQuestions);
  }

  async getChapters(): Promise<string[]> {
    const questions = await this.questions.toArray();
    const chapters = new Set<string>(questions.map(q => q.chapter));
    return Array.from(chapters);
  }

  async deleteChapter(chapterName: string) {
    await this.questions.where('chapter').equals(chapterName).delete();
    const session = await this.getActiveSession();
    if (session && session.chapterName === chapterName) {
      await this.clearActiveSession();
    }
  }

  async toggleBookmark(questionId: number) {
    const q = await this.questions.get(questionId);
    if (q) {
      return await this.questions.update(questionId, { isBookmarked: !q.isBookmarked });
    }
  }

  async searchQuestions(query: string): Promise<Question[]> {
    return await this.questions
      .filter(q => q.text.toLowerCase().includes(query.toLowerCase()))
      .toArray();
  }

  async saveActiveSession(session: TestSession) {
    return await this.sessions.put({ ...session, id: 'active_test' } as any);
  }

  async getActiveSession(): Promise<TestSession | null> {
    const session = await this.sessions.get('active_test');
    return (session as unknown as TestSession) || null;
  }

  async clearActiveSession() {
    return await this.sessions.delete('active_test');
  }
}

export const db = new RadPrepDatabase();
