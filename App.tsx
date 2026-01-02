import React, { useState } from 'react';
import { AppProvider, useAppStore } from './store';
import Sidebar from './components/Sidebar';
import PDFReader from './components/PDFReader';
import QuizView from './components/QuizView';
import { Course, PDFDocument } from './types';
import { UploadCloud, FileText, Trash2, BookOpen, Search, Presentation } from 'lucide-react';

// Safe UUID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const Dashboard: React.FC = () => {
  const { documents, navigate, deleteDocument } = useAppStore();
  
  const recentDocs = documents.slice(0, 5);

  const getIcon = (type: string) => {
    return type === 'pptx' ? <Presentation size={24} /> : <FileText size={24} />;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Dr. Student</h1>
        <p className="text-slate-500 mt-2">You have {documents.length} documents organized.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-medical-500 to-medical-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-semibold text-medical-100">Study Streak</h3>
          <div className="text-4xl font-bold mt-2">12 Days</div>
          <div className="mt-4 text-sm text-medical-100 bg-white/10 w-fit px-3 py-1 rounded-full">Top 10%</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-500">Documents</h3>
          <div className="text-4xl font-bold mt-2 text-slate-800">{documents.length}</div>
          <div className="mt-4 text-sm text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full">+2 this week</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
           <h3 className="font-semibold text-slate-500">Quizzes Taken</h3>
           <div className="text-4xl font-bold mt-2 text-slate-800">0</div>
           <div className="mt-4 text-sm text-orange-600 bg-orange-50 w-fit px-3 py-1 rounded-full">Needs focus</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Uploads</h2>
      {recentDocs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
           <p className="text-slate-400">No documents yet. Upload one to start.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border-b last:border-0 border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${doc.fileType === 'pptx' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                  {getIcon(doc.fileType)}
                </div>
                <div>
                  <h4 onClick={() => navigate({ type: 'READER', pdfId: doc.id })} className="font-semibold text-slate-800 cursor-pointer hover:text-medical-600">{doc.name}</h4>
                  <p className="text-xs text-slate-500">{doc.course} • Added {new Date(doc.addedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => deleteDocument(doc.id)} className="text-slate-400 hover:text-red-500 p-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CourseView: React.FC<{ course: Course }> = ({ course }) => {
  const { documents, addDocument, navigate, deleteDocument } = useAppStore();
  const courseDocs = documents.filter(d => d.course === course);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf';
      const isPptx = file.name.endsWith('.pptx') || file.type.includes('presentation');

      if (!isPdf && !isPptx) {
        return alert('Only PDF and PPTX files are allowed');
      }
      
      const newDoc: PDFDocument = {
        id: generateId(),
        name: file.name,
        course: course,
        file: file,
        fileType: isPptx ? 'pptx' : 'pdf',
        addedAt: Date.now()
      };
      addDocument(newDoc);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">{course}</h1>
           <p className="text-slate-500 mt-2">{courseDocs.length} Documents</p>
        </div>
        <label className="flex items-center gap-2 bg-medical-600 text-white px-4 py-2 rounded-xl hover:bg-medical-700 cursor-pointer transition-all shadow-md hover:shadow-lg">
          <UploadCloud size={20} />
          <span>Upload PDF/PPTX</span>
          <input type="file" accept=".pdf,.pptx" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseDocs.map(doc => (
          <div key={doc.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center py-8 bg-slate-50 rounded-lg mb-4 cursor-pointer" onClick={() => navigate({ type: 'READER', pdfId: doc.id })}>
              {doc.fileType === 'pptx' ? (
                <Presentation size={48} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
              ) : (
                <FileText size={48} className="text-slate-300 group-hover:text-red-500 transition-colors" />
              )}
            </div>
            <div className="flex items-start justify-between">
              <div onClick={() => navigate({ type: 'READER', pdfId: doc.id })} className="cursor-pointer">
                <h3 className="font-semibold text-slate-800 line-clamp-1 hover:text-medical-600">{doc.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                   {doc.fileType.toUpperCase()} • Added today
                </p>
              </div>
              <button onClick={() => deleteDocument(doc.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {courseDocs.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-medium text-slate-600">No files here yet</h3>
             <p className="text-slate-400">Upload your course PDFs or PPTX slides to start studying.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { view } = useAppStore();

  switch (view.type) {
    case 'DASHBOARD': return <Dashboard />;
    case 'COURSE': return <CourseView course={view.course} />;
    case 'READER': return <PDFReader pdfId={view.pdfId} />;
    case 'QUIZ': return <QuizView quizId={view.quizId} />;
    default: return <Dashboard />;
  }
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <MainContent />
        </main>
      </div>
    </AppProvider>
  );
};

export default App;