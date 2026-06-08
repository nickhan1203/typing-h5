export type PracticeMode = 'free' | 'timed';

export interface ArticleGroup {
  id: string;
  name: string;
  createdAt: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  groupId: string | null;
  createdAt: number;
}

export interface TypingRecord {
  id: string;
  date: number;
  mode: PracticeMode;
  speed: number; // WPM - characters per minute
  accuracy: number; // percentage 0-100
  duration: number; // seconds
  totalChars: number;
  correctChars: number;
  wrongChars: number;
}

export interface TypingState {
  currentIndex: number;
  inputHistory: string[];
  isStarted: boolean;
  isFinished: boolean;
  startTime: number | null;
  endTime: number | null;
  timerDuration: number; // for timed mode
  timeLeft: number;
}
