import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, History, LogOut, Upload, FileUp, CheckCircle, AlertCircle, Menu } from "lucide-react";
import { DetectionResult, HistoryItem } from "@/lib/types";
import { analyzeMedia } from "@/lib/api";
import UploadZone from "./UploadZone";
import ResultDisplay from "./ResultDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExportAuditReportButton from "./ExportAuditReportButton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

const HISTORY_KEY = "df_analysis_history";

function loadHistory(): HistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((item: HistoryItem) => ({
        ...item,
        previewUrl: item.previewUrl || undefined,
      }));
    }
  } catch (e) {
    console.error("Failed to load history:", e);
  }
  return [];
}

function saveHistory(history: HistoryItem[]) {
  try {
    const toSave = history.map((item) => ({
      ...item,
      previewUrl: undefined,
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [results, setResults] = useState<{ file: File; result: DetectionResult; previewUrl: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentMedia, setCurrentMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleFileSelected = useCallback(async (file: File) => {
    setIsAnalyzing(true);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video") ? "video" : "image";

    try {
      const res = await analyzeMedia(file, username);
      
      // Add to results
      const newResult = { file, result: res, previewUrl };
      setResults(prev => [...prev, newResult]);
      
      // Add to history
      const newItem: HistoryItem = {
        id: Date.now() + Math.random(),
        filename: file.name,
        filepath: file.name,
        prediction: res.label,
        confidence: res.confidence,
        timestamp: new Date().toISOString(),
        fileType: mediaType,
        previewUrl: previewUrl,
      };
      setHistory((prev) => [newItem, ...prev]);
      
      // Select the new result
      setSelectedIndex(results.length);
      setCurrentMedia({ url: previewUrl, type: mediaType });
    } catch (err) {
      console.error("Analysis failed:", err);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsAnalyzing(false);
    }
  }, [username, results.length]);

  const handleSelectResult = (index: number) => {
    setSelectedIndex(index);
    const result = results[index];
    if (result) {
      setCurrentMedia({ url: result.previewUrl, type: result.result.timeline ? "video" : "image" });
    }
  };

  const handleDeleteItem = (id: number) => {
    const item = history.find((h) => h.id === id);
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleDeleteAll = () => {
    history.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    results.forEach(r => URL.revokeObjectURL(r.previewUrl));
    setHistory([]);
    setResults([]);
    setSelectedIndex(0);
    setCurrentMedia(null);
  };

  const handleNewAnalysis = () => {
    results.forEach(r => URL.revokeObjectURL(r.previewUrl));
    setResults([]);
    setSelectedIndex(0);
    setCurrentMedia(null);
  };

  const currentResult = results[selectedIndex];
  const hasResults = results.length > 0;

  const Sidebar = (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-sidebar-foreground font-mono tracking-tight truncate">
              CLARIUM AI
            </h1>
            <p className="text-xs text-muted-foreground">AI-powered deepfake analysis</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Operator</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-sm font-medium text-sidebar-foreground truncate mt-1">{username}</p>
      </div>

      {/* History section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <History className="w-3.5 h-3.5" /> Analysis ({history.length})
          </span>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {history.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center mx-auto mb-3">
                <FileUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No analysis history yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    if (hasResults) handleSelectResult(idx);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-all group ${
                    hasResults && selectedIndex === idx
                      ? "bg-sidebar-accent border border-sidebar-border"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-sidebar-foreground truncate flex-1 font-mono">{item.filename}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete item"
                    >
                      <svg
                        className="w-3 h-3 text-muted-foreground hover:text-destructive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${
                        item.prediction === "REAL"
                          ? "text-success"
                          : item.prediction === "FAKE"
                            ? "text-danger"
                            : "text-warning"
                      }`}
                    >
                      {item.prediction}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      · {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:h-screen bg-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-72 md:h-screen">{Sidebar}</aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85vw] max-w-sm bg-sidebar border-sidebar-border">
          {Sidebar}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Mobile top bar */}
          <div className="md:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/80 backdrop-blur border-b border-border mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open history sidebar"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Operator</p>
                  <p className="text-sm font-medium text-foreground truncate">{username}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6 sm:mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground font-mono tracking-tight">
                Deepfake Detection
              </h2>
              <p className="text-xs text-muted-foreground">
                AI-powered forensic media analysis
              </p>
            </div>
          </motion.div>

          {/* Content */}
          <div className="space-y-6">
            {/* Upload zone */}
            {!hasResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-card hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 font-mono">
                      <Upload className="w-5 h-5 text-primary" />
                      Upload Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UploadZone onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Results grid for multiple files */}
            {hasResults && !isAnalyzing && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm text-muted-foreground font-mono">
                    {results.length} file{results.length > 1 ? "s" : ""} analyzed
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="w-full sm:w-auto">
                      <ExportAuditReportButton results={results} />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleNewAnalysis}
                      className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                  </div>
                </div>

                {/* Results list */}
                <div className="grid gap-4">
                  {results.map((r, idx) => (
                    <motion.div
                      key={r.file.name + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card 
                        className={`glass-card cursor-pointer transition-all hover:scale-[1.01] ${
                          selectedIndex === idx ? 'border-primary/50 glow-primary' : ''
                        }`}
                        onClick={() => handleSelectResult(idx)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              r.result.label === "REAL" 
                                ? "bg-success/10 border border-success/20"
                                : r.result.label === "FAKE"
                                ? "bg-danger/10 border border-danger/20"
                                : "bg-warning/10 border border-warning/20"
                            }`}>
                              {r.result.label === "REAL" ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : r.result.label === "FAKE" ? (
                                <AlertCircle className="w-5 h-5 text-danger" />
                              ) : (
                                <Shield className="w-5 h-5 text-warning" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate font-mono">
                                {r.file.name}
                              </p>
                              <p className={`text-xs font-mono ${
                                r.result.label === "REAL" 
                                  ? "text-success"
                                  : r.result.label === "FAKE"
                                  ? "text-danger"
                                  : "text-warning"
                              }`}>
                                {r.result.label} · {Math.round(r.result.confidence * 100)}%
                              </p>
                            </div>
                            {selectedIndex === idx && (
                              <div className="text-xs text-primary font-mono">
                                Viewing
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Selected result detail */}
                {currentResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <ResultDisplay result={currentResult.result} media={currentMedia} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}

            {/* Loading state */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground font-mono mb-2">
                  ANALYZING MEDIA
                </h3>
                <p className="text-sm text-muted-foreground">
                  Processing your file for deepfake detection...
                </p>
                <div className="w-64 h-2 bg-muted rounded-full mt-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

