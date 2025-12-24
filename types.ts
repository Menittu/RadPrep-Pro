
export interface Question {
  id: number;
  chapter: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isBookmarked?: boolean;
}

export enum TestMode {
  PRACTICE = 'PRACTICE',
  MOCK = 'MOCK'
}

export interface TestSession {
  chapterName: string;
  mode: TestMode;
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>; // questionId -> optionIndex
  startTime: number;
  isCompleted: boolean;
  questionIds: number[];
}

export interface TestResult {
  id?: number;
  date: number;
  chapterName: string;
  mode: TestMode;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  percentage: number;
}

export interface AppState {
  darkMode: boolean;
  currentSession: TestSession | null;
}
