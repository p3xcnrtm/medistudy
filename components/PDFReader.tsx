import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import JSZip from 'jszip';
import { useAppStore } from '../store';
import { Note, Quiz, QuizQuestion } from '../types';
import { generateQuizFromText } from '../services/geminiService';
import { 
  ChevronLeft, 
  ChevronRight, 
  StickyNote, 
  BrainCircuit, 
  Loader2, 
  X,
  Presentation,
  FileText,
  Edit,
  Save,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Safe UUID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface PDFReaderProps {
  pdfId: string;
}

const PDFReader: React.FC<PDFReaderProps> = ({ pdfId }) => {
  const { documents, notes, addNote, updateNote, addQuiz, navigate } = useAppStore();
  const document = documents.find(d => d.id === pdfId);
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null); 
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [pageText, setPageText] = useState('');
  
  // PPTX Specific State
  const [slidesText, setSlidesText] = useState<string[]>([]);
  const [loadingPptx, setLoadingPptx] = useState(false);

  // Responsive scale initialization
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScale(0.6); // Smaller scale for mobile
      } else {
        setScale(1.2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- PDF HANDLERS ---
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageLoadSuccess = useCallback(async (page: any) => {
    try {
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      setPageText(text);
    } catch (err) {
      console.error("Error getting text content:", err);
    }
  }, []);

  // --- PPTX HANDLERS ---
  useEffect(() => {
    if (document?.fileType === 'pptx') {
      loadPptx(document.file);
    }
  }, [document]);

  // When changing pages in PPTX, update the pageText for the Quiz generator
  useEffect(() => {
    if (document?.fileType === 'pptx' && slidesText.length > 0) {
      setPageText(slidesText[pageNumber - 1] || '');
    }
  }, [pageNumber, slidesText, document?.fileType]);

  const loadPptx = async (file: File) => {
    setLoadingPptx(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const slideFiles: { name: string; content: string }[] = [];

      // Iterate through files to find slides
      const slidePromises: Promise<void>[] = [];
      
      zip.folder("ppt/slides")?.forEach((relativePath, file) => {
        if (relativePath.match(/^slide\d+\.xml$/)) {
          slidePromises.push(
            file.async("string").then((content) => {
              slideFiles.push({ name: relativePath, content });
            })
          );
        }
      });

      await Promise.all(slidePromises);

      // Sort slides by number (slide1, slide2, slide10...)
      slideFiles.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)![0]);
        const numB = parseInt(b.name.match(/\d+/)![0]);
        return numA - numB;
      });

      // Extract text from XML
      const extractedTexts = slideFiles.map(slide => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(slide.content, "text/xml");
        const textElements = xmlDoc.getElementsByTagName("a:t"); // Text elements in PPTX XML
        let text = "";
        for (let i = 0; i < textElements.length; i++) {
          text += textElements[i].textContent + " ";
        }
        return text.trim() || "No text content on this slide.";
      });

      setSlidesText(extractedTexts);
      setNumPages(extractedTexts.length);
      setPageText(extractedTexts[0]); // Set initial text
    } catch (err) {
      console.error("Failed to parse PPTX", err);
      alert("Error parsing PowerPoint file.");
    } finally {
      setLoadingPptx(false);
    }
  };

  // --- COMMON ACTIONS ---

  const handleOpenNote = (note?: Note) => {
    if (note) {
      setNoteContent(note.content);
      setEditingNoteId(note.id);
    } else {
      setNoteContent('');
      setEditingNoteId(null);
    }
    setIsNoteOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    if (editingNoteId) {
      // Update existing
      const updatedNote: Note = {
        id: editingNoteId,
        pdfId,
        pageNumber,
        content: noteContent,
        createdAt: Date.now() // or keep original
      };
      updateNote(updatedNote);
    } else {
      // Create new
      const newNote: Note = {
        id: generateId(),
        pdfId,
        pageNumber,
        content: noteContent,
        createdAt: Date.now()
      };
      addNote(newNote);
    }
    
    setNoteContent('');
    setEditingNoteId(null);
    setIsNoteOpen(false);
  };

  const handleGenerateQuiz = async () => {
    // Check validation based on type
    if (!pageText || pageText.trim().length < 10) {
      alert("Not enough text on this page/slide to generate a quiz. Try a page with more content.");
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const questions = await generateQuizFromText(pageText, 5);
      
      const newQuiz: Quiz = {
        id: generateId(),
        pdfId,
        questions,
        createdAt: Date.now()
      };
      
      addQuiz(newQuiz);
      navigate({ type: 'QUIZ', quizId: newQuiz.id, mode: 'TAKE' });
      
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Filter notes for current page
  const pageNotes = notes.filter(n => n.pdfId === pdfId && n.pageNumber === pageNumber);

  if (!document) return <div>Document not found</div>;

  return (
    <div className="flex h-full bg-slate-100 relative w-full">
      {/* Main Reader Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <button onClick={() => navigate({ type: 'COURSE', course: document.course })} className="text-slate-500 hover:text-slate-800 shrink-0">
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                 {document.fileType === 'pptx' ? <Presentation size={14} className="text-orange-500 shrink-0"/> : <FileText size={14} className="text-red-500 shrink-0" />}
                 <h2 className="font-semibold text-slate-800 truncate max-w-[150px] md:max-w-md text-sm">{document.name}</h2>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">{document.course}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="p-1 hover:bg-white rounded disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs md:text-sm font-medium px-2 md:px-3 text-slate-600">
                {pageNumber} / {numPages || '--'}
              </span>
              <button onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={pageNumber >= (numPages || 1)} className="p-1 hover:bg-white rounded disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>

            <button 
              onClick={() => handleOpenNote()}
              className="flex items-center gap-2 text-slate-600 hover:text-medical-600 font-medium text-sm p-2 hover:bg-slate-50 rounded-lg"
              title="Add Note"
            >
              <StickyNote size={18} />
              <span className="hidden md:inline">Add Note</span>
            </button>

            <button 
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz || (document.fileType === 'pptx' && loadingPptx)}
              className="flex items-center gap-2 bg-gradient-to-r from-medical-600 to-indigo-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-70"
            >
              {isGeneratingQuiz ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
              <span className="hidden md:inline">{isGeneratingQuiz ? 'Generating...' : 'Quiz Me'}</span>
            </button>
          </div>
        </div>

        {/* Content View Area */}
        <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 bg-slate-100/50 w-full relative">
           
           {/* PDF RENDERER */}
           {document.fileType === 'pdf' && (
             <div className="w-full flex justify-center">
               <Document
                file={document.file}
                onLoadSuccess={onDocumentLoadSuccess}
                className="shadow-xl max-w-full"
                loading={<div className="flex flex-col items-center mt-20 text-slate-400"><Loader2 className="animate-spin mb-2" />Loading PDF...</div>}
                error={<div className="text-red-500 mt-20">Failed to load PDF. Please try again.</div>}
               >
                 <div className="relative">
                    <Page 
                      pageNumber={pageNumber} 
                      scale={scale} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={handlePageLoadSuccess}
                      className="bg-white max-w-full"
                    />
                    {/* Note Indicators */}
                    {pageNotes.length > 0 && (
                       <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                          {pageNotes.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => handleOpenNote(n)}
                              className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 rounded text-xs shadow-md w-8 h-8 md:w-48 overflow-hidden flex items-center justify-center md:justify-start md:items-start cursor-pointer hover:scale-110 transition-transform"
                            >
                               <span className="md:hidden"><StickyNote size={14} /></span>
                               <span className="hidden md:block truncate">{n.content}</span>
                            </div>
                          ))}
                       </div>
                    )}
                 </div>
               </Document>
             </div>
           )}

           {/* PPTX RENDERER (Custom Slide View) */}
           {document.fileType === 'pptx' && (
             <div className="w-full max-w-4xl">
               {loadingPptx ? (
                  <div className="flex flex-col items-center mt-20 text-slate-400">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p>Parsing PowerPoint Slides...</p>
                  </div>
               ) : (
                  <div className="relative bg-white min-h-[300px] md:min-h-[500px] shadow-xl rounded-lg p-6 md:p-12 flex flex-col">
                     <h3 className="text-slate-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-4 md:mb-6 border-b pb-2">
                        Slide {pageNumber}
                     </h3>
                     
                     <div className="prose max-w-none flex-1 text-slate-800 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                        {slidesText[pageNumber - 1] || "No text content found on this slide."}
                     </div>

                     {/* Note Indicators for PPTX */}
                     {pageNotes.length > 0 && (
                        <div className="absolute top-16 md:top-20 right-4 md:right-8 flex flex-col gap-2 max-w-[150px] md:max-w-xs">
                           {pageNotes.map(n => (
                             <div 
                               key={n.id} 
                               onClick={() => handleOpenNote(n)}
                               className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-2 md:p-3 rounded shadow-md text-xs md:text-sm animate-in fade-in zoom-in cursor-pointer hover:bg-yellow-50 hover:scale-105 transition-transform group"
                             >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="truncate">
                                    <span className="font-bold block text-[10px] md:text-xs text-yellow-600 mb-1">Note:</span>
                                    {n.content}
                                  </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}
             </div>
           )}

        </div>
      </div>

      {/* Pop-up Note Input */}
      {isNoteOpen && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <StickyNote className="text-yellow-500" size={20} />
                {editingNoteId ? 'Edit Note' : 'Add Note'}
              </h3>
              <button onClick={() => setIsNoteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              autoFocus
              className="w-full h-32 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-medical-500 focus:outline-none resize-none bg-yellow-50/50"
              placeholder="Type your important concept here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex justify-end mt-4 gap-2">
              <button 
                onClick={() => setIsNoteOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="px-4 py-2 text-sm bg-medical-600 text-white rounded-lg hover:bg-medical-700 flex items-center gap-2"
              >
                <Save size={16} />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFReader;