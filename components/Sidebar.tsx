import React from 'react';
import { useAppStore } from '../store';
import { Course } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  Microscope, 
  FlaskConical, 
  Droplet, 
  Bug, 
  Pill,
  BrainCircuit,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { navigate, view, documents } = useAppStore();

  const handleNavigation = (action: () => void) => {
    action();
    if (onClose) onClose();
  };

  const getIconForCourse = (course: Course) => {
    switch (course) {
      case Course.ANATOMIC_PATHOLOGY: return <Microscope size={18} />;
      case Course.CHEMICAL_PATHOLOGY: return <FlaskConical size={18} />;
      case Course.HEMATOLOGY: return <Droplet size={18} />;
      case Course.MICROBIOLOGY: return <Bug size={18} />;
      case Course.PHARMACOLOGY: return <Pill size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const isActive = (v: any) => {
    if (view.type === 'DASHBOARD' && v === 'DASHBOARD') return true;
    if (view.type === 'COURSE' && view.course === v) return true;
    return false;
  };

  const getDocCount = (course: Course) => documents.filter(d => d.course === course).length;

  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-200 h-full flex flex-col shadow-xl md:shadow-sm">
      <div className="p-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-medical-600 p-2 rounded-lg text-white">
            <BrainCircuit size={24} />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">MediStudy AI</h1>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
        <button 
          onClick={() => handleNavigation(() => navigate({ type: 'DASHBOARD' }))}
          className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
            isActive('DASHBOARD') 
              ? 'text-medical-600 bg-medical-50 border-r-4 border-medical-600' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses</div>
        
        {Object.values(Course).map((course) => (
          <button
            key={course}
            onClick={() => handleNavigation(() => navigate({ type: 'COURSE', course }))}
            className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
              isActive(course)
                ? 'text-medical-600 bg-medical-50 border-r-4 border-medical-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {getIconForCourse(course)}
              <span className="truncate max-w-[120px]">{course}</span>
            </div>
            {getDocCount(course) > 0 && (
              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full shrink-0">
                {getDocCount(course)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <h3 className="font-bold text-sm mb-1">Exam Mode</h3>
          <p className="text-xs text-slate-400 mb-3">Test your knowledge with AI generated questions.</p>
          <div className="h-1 w-full bg-slate-700 rounded-full mb-1">
             <div className="h-1 w-2/3 bg-medical-500 rounded-full"></div>
          </div>
          <span className="text-xs text-slate-400">Ready to review</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;