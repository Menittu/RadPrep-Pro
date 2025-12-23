
import { Dexie, Table } from 'dexie';
import { Question, TestResult, TestSession } from './types';

export class RadPrepDatabase extends Dexie {
  questions!: Table<Question>;
  results!: Table<TestResult>;
  sessions!: Table<TestSession & { id: string }>; // Persistent session storage

  constructor() {
    super('RadPrepDB');
    // Fix: Using named import for Dexie ensures 'version' and other inherited methods are correctly typed in TypeScript.
    this.version(2).stores({
      questions: '++id, question_text, chapter_name, isBookmarked',
      results: '++id, date, chapterName',
      sessions: 'id, chapterName' // 'id' will be a constant like 'active_test'
    });
  }

  async addQuestions(chapterName: string, questions: any[]) {
    const formattedQuestions = questions.map((q) => ({
      ...q,
      chapter_name: chapterName,
      isBookmarked: false
    }));
    return await this.questions.bulkAdd(formattedQuestions);
  }

  async getChapters(): Promise<string[]> {
    const questions = await this.questions.toArray();
    const chapters = new Set<string>(questions.map(q => q.chapter_name));
    return Array.from(chapters);
  }

  async deleteChapter(chapterName: string) {
    // Delete all questions for this chapter
    await this.questions.where('chapter_name').equals(chapterName).delete();
    // If there's an active session for this chapter, clear it
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
      .filter(q => q.question_text.toLowerCase().includes(query.toLowerCase()))
      .toArray();
  }

  // Session Management
  async saveActiveSession(session: TestSession) {
    return await this.sessions.put({ ...session, id: 'active_test' });
  }

  async getActiveSession(): Promise<TestSession | null> {
    const session = await this.sessions.get('active_test');
    return session || null;
  }

  async clearActiveSession() {
    return await this.sessions.delete('active_test');
  }
}

export const db = new RadPrepDatabase();
