import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, Trash2, HelpCircle } from 'lucide-react';
import { ProjectMaterial } from '../../store/useAppStore';

interface DragAndDropZoneProps {
  onMaterialsChange: (materials: ProjectMaterial[]) => void;
  initialMaterials?: ProjectMaterial[];
}

export const DragAndDropZone: React.FC<DragAndDropZoneProps> = ({
  onMaterialsChange,
  initialMaterials = []
}) => {
  const [materials, setMaterials] = useState<ProjectMaterial[]>(initialMaterials);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyChange = (updated: ProjectMaterial[]) => {
    setMaterials(updated);
    onMaterialsChange(updated);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    const newMaterials: ProjectMaterial[] = Array.from(files).map((file, idx) => {
      // Determine default type based on file name characteristics
      let detectedType: ProjectMaterial['type'] = 'reference';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('rubric') || lowerName.includes('syllabus') || lowerName.includes('criteria')) {
        detectedType = 'rubrics';
      } else if (lowerName.includes('require') || lowerName.includes('instruction') || lowerName.includes('prompt')) {
        detectedType = 'requirement';
      } else if (lowerName.includes('draft') || lowerName.includes('version') || lowerName.includes('paper') || lowerName.includes('essay')) {
        detectedType = 'current-draft';
      }

      return {
        id: `mat-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type: detectedType,
        fileSize: file.size
      };
    });

    const updated = [...materials, ...newMaterials];
    notifyChange(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const updateMaterialType = (id: string, type: ProjectMaterial['type']) => {
    const updated = materials.map(m => m.id === id ? { ...m, type } : m);
    notifyChange(updated);
  };

  const removeMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    notifyChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Upload Zone Panel */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative overflow-hidden cursor-pointer p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
          isDragActive
            ? 'border-brand-formative-primary bg-brand-formative-light/10 scale-[1.02]'
            : 'border-slate-300 hover:border-brand-formative-primary/50 bg-white/40 hover:bg-white/60'
        } glass-panel`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Dynamic Breathing Ring Animation */}
        <div
          className={`p-4 rounded-full transition-all duration-500 ${
            isDragActive
              ? 'bg-brand-formative-primary text-white scale-110 shadow-lg shadow-cyan-200/50'
              : 'bg-slate-100 text-slate-500 hover:scale-105'
          }`}
        >
          <Upload className={`w-6 h-6 ${isDragActive ? 'animate-bounce' : ''}`} />
        </div>

        <div className="text-center">
          <p className="font-heading font-semibold text-sm text-slate-800">
            Drag & drop materials here, or <span className="text-brand-formative-primary hover:underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Accepting Rubrics, Guidelines, Draft Essays, and Reference Materials
          </p>
        </div>

        {isDragActive && (
          <div className="absolute inset-0 bg-brand-formative-primary/5 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="font-heading font-bold text-sm text-brand-formative-primary animate-pulse">
              Drop files to attach to project
            </span>
          </div>
        )}
      </div>

      {/* Materials Queue List */}
      {materials.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-heading font-bold text-slate-500 tracking-wider uppercase mb-1">
            Attached Materials ({materials.length})
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-white/80 border border-slate-150 rounded-lg shadow-sm hover:border-slate-300 transition-all duration-300 glass-panel"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-slate-100 rounded text-slate-500 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-body font-semibold text-slate-800 truncate" title={m.name}>
                      {m.name}
                    </p>
                    <p className="text-[10px] font-body text-slate-400">
                      {formatSize(m.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Categorizer Buttons & Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-heading font-semibold text-slate-400 text-right">
                      Document Role
                    </label>
                    <select
                      value={m.type}
                      onChange={(e) => updateMaterialType(m.id, e.target.value as ProjectMaterial['type'])}
                      className="text-xs font-body font-medium bg-slate-100 border-none outline-none py-1 px-2 rounded cursor-pointer text-slate-700 hover:bg-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-formative-primary"
                    >
                      <option value="rubrics">Syllabus / Rubric</option>
                      <option value="requirement">Assignment Prompt</option>
                      <option value="current-draft">Draft Submission</option>
                      <option value="reference">Reference Document</option>
                    </select>
                  </div>

                  <button
                    onClick={() => removeMaterial(m.id)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors duration-200 self-end"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
