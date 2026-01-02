export enum Course {
  ANATOMIC_PATHOLOGY = 'Anatomic Pathology',
  CHEMICAL_PATHOLOGY = 'Chemical Pathology',
  HEMATOLOGY = 'Hematology',
  MICROBIOLOGY = 'Microbiology',
  PHARMACOLOGY = 'Pharmacology',
  GENERAL = 'General Medicine'
}

export interface Note {
  id: string;
  pdfId: string;
  pageNumber: number; // For PPTX, this refers to Slide Number
  content: string;
  createdAt: number;
}

export interface PDFDocument {
  id: string;
  name: string;
  course: Course;
  file: File;
  fileType: 'pdf' | 'pptx';
  addedAt: number;
  pageCount?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
}

export interface Quiz {
  id: string;
  pdfId: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: number;
  createdAt: number;
}

export type ViewState = 
  | { type: 'DASHBOARD' }
  | { type: 'COURSE', course: Course }
  | { type: 'READER', pdfId: string }
  | { type: 'QUIZ', quizId: string, mode: 'TAKE' | 'RESULT' };