import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PDFDocument, Note, Quiz, ViewState, Course } from './types';
import { storageService } from './services/storage';

interface AppState {
  documents: PDFDocument[];
  notes: Note[];
  quizzes: Quiz[];
  view: ViewState;
  isLoading: boolean;
  addDocument: (doc: PDFDocument) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuizScore: (quizId: string, score: number) => void;
  navigate: (view: ViewState) => void;
  deleteDocument: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'DASHBOARD' });
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedDocs, loadedNotes, loadedQuizzes] = await Promise.all([
          storageService.getAllDocuments(),
          storageService.getAllNotes(),
          storageService.getAllQuizzes()
        ]);

        // Fix: Sort documents by addedAt desc
        loadedDocs.sort((a, b) => b.addedAt - a.addedAt);

        setDocuments(loadedDocs);
        setNotes(loadedNotes);
        setQuizzes(loadedQuizzes);
      } catch (error) {
        console.error("Failed to load data from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addDocument = (doc: PDFDocument) => {
    // Optimistic update
    setDocuments(prev => [doc, ...prev]);
    // Persist
    storageService.saveDocument(doc).catch(err => {
      console.error("Failed to save document:", err);
      // Rollback could happen here in a complex app
    });
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setNotes(prev => prev.filter(n => n.pdfId !== id));
    setQuizzes(prev => prev.filter(q => q.pdfId !== id));
    
    storageService.deleteDocument(id);
    // We implicitly leave orphaned notes/quizzes in DB for now to avoid complex transactions,
    // they just won't be shown in UI as the parent doc is gone.
  };

  const addNote = (note: Note) => {
    setNotes(prev => [...prev, note]);
    storageService.saveNote(note);
  };

  const updateNote = (note: Note) => {
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    storageService.saveNote(note);
  };

  const addQuiz = (quiz: Quiz) => {
    setQuizzes(prev => [...prev, quiz]);
    storageService.saveQuiz(quiz);
  };

  const updateQuizScore = (quizId: string, score: number) => {
    setQuizzes(prev => {
      const newQuizzes = prev.map(q => {
        if (q.id === quizId) {
          const updated = { ...q, score, completedAt: Date.now() };
          storageService.saveQuiz(updated); // Persist update
          return updated;
        }
        return q;
      });
      return newQuizzes;
    });
  };

  const navigate = (newView: ViewState) => {
    setView(newView);
  };

  return (
    <AppContext.Provider value={{ 
      documents, 
      notes, 
      quizzes, 
      view,
      isLoading, 
      addDocument, 
      addNote, 
      updateNote,
      addQuiz, 
      updateQuizScore, 
      navigate,
      deleteDocument
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};