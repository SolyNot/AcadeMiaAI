
import type React from 'react';

export type View = 'dashboard' | 'writer' | 'presenter' | 'visualizer' | 'analyzer' | 'speaker' | 'studier' | 'planner';
export type WriterMode = 'write' | 'enhance' | 'cite' | 'research' | 'explain' | 'plagiarism';

export interface NavItem {
  id: View;
  label: string;
  // Fix: Use React.ReactNode instead of JSX.Element to resolve namespace error.
  icon: React.ReactNode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Slide {
  title: string;
  content: string[];
  speakerNotes?: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Task {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface GroundingChunk {
  web?: {
    // Fix: Made uri and title optional to match the type from @google/genai
    uri?: string;
    title?: string;
  };
  maps?: {
    // Fix: Made uri and title optional to match the type from @google/genai
    uri?: string;
    title?: string;
  };
}

export interface StudyPlanDay {
  day: number;
  topics: string[];
  goals: string[];
  quiz: {
    question: string;
    answer: string;
  };
}

export interface StudyPlan {
  topic: string;
  durationDays: number;
  dailyTasks: StudyPlanDay[];
}
