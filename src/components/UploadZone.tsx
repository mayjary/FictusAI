import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, Film, X, Scan, Files } from "lucide-react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "video/mp4", "video/quicktime", "video/x-msvideo"];

export default function UploadZone({ onFileSelected, isAnalyzing }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; type: "image" | "video"; name: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => ACCEPTED_TYPES.includes(file.type));
    if (validFiles.length === 0) return;
    
    const newPreviews = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      return { url, type, name: file.name, file };
    });
    
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Process files one by one
    newPreviews.forEach((preview, index) => {
      setTimeout(() => {
        onFileSelected(preview.file);
      }, index * 100); // Small delay between files
    });
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  };

  const removePreview = (index: number) => {
    const preview = previews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPreviews = () => {
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setPreviews([]);
  };

  return (
    <div className="space-y-4">
      {/* Multiple file drop zone */}
      {!previews.length ? (
        <motion.div
          key="dropzone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-6 sm:p-12 text-center hover:scale-[1.01]
            ${dragOver
              ? "border-primary bg-primary/5 glow-primary"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,.mov,.avi"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload media files"
          />

          <motion.div
            animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300
              ${dragOver 
                ? "bg-primary/10 border border-primary/20" 
                : "bg-primary/5 border border-primary/10"
              }
            `}>
              <Files className={`w-7 h-7 transition-colors duration-300 ${
                dragOver ? "text-primary" : "text-muted-foreground"
              }`} />
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">
                Drop multiple files or a folder here
              </p>
              <p className="text-muted-foreground text-sm">
                Supports JPG, PNG, MP4, MOV, AVI
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5 text-xs">
                <Image className="w-3.5 h-3.5" /> Images
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Film className="w-3.5 h-3.5" /> Videos
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* File list with previews */
        <motion.div
          key="preview-list"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm text-muted-foreground font-mono">
              {previews.length} file{previews.length > 1 ? 's' : ''} selected
            </span>
            {!isAnalyzing && (
              <button
                onClick={clearAllPreviews}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
            {previews.map((preview, index) => (
              <motion.div
                key={preview.url + index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-lg overflow-hidden border border-border bg-muted/20 group"
              >
                {!isAnalyzing && (
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute top-2 right-2 z-10 p-1 rounded bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {preview.type === "image" ? (
                  <img 
                    src={preview.url} 
                    alt={preview.name} 
                    className="w-full h-24 object-cover" 
                  />
                ) : (
                  <div className="w-full h-24 bg-muted/30 flex items-center justify-center">
                    <Film className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                {isAnalyzing && index === previews.length - 1 && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Scan className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                )}

                <div className="px-2 py-1.5 bg-muted/30 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {preview.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

