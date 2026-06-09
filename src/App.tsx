import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  FileCode2, 
  Terminal, 
  Sliders, 
  Play, 
  Search, 
  Plus, 
  Save, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Info, 
  Settings, 
  AlertCircle, 
  Calendar, 
  FileText, 
  ChevronRight,
  Code2
} from "lucide-react";
import { initialJavaProject, JavaFile } from "./data/javaProjectTemplate";

// Types matching the Java structures
interface DiaryEntrySim {
  id: number;
  title: string;
  content: string;
  category: string;
  mood: string;
  rating: number;
  isLocked: boolean;
  passwordHash: string | null;
  entryDate: string;
}

interface SqlLog {
  timestamp: string;
  statement: string;
  parameters: string[];
  status: "success" | "warning" | "error";
  durationMs: number;
}

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"simulator" | "code" | "ai" | "docs">("simulator");
  
  // Files data state (loaded from local template, can be modified via AI)
  const [projectFiles, setProjectFiles] = useState<Record<string, JavaFile>>(initialJavaProject);
  const [selectedFileKey, setSelectedFileKey] = useState<string>("DiarySwingUI.java");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Simulated Database State
  const [dbEntries, setDbEntries] = useState<DiaryEntrySim[]>([]);
  const [sqlLogs, setSqlLogs] = useState<SqlLog[]>([]);
  
  // Swing GUI simulated fields state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("All Categories");
  const [selectedListIndex, setSelectedListIndex] = useState<number | null>(0);
  
  // Active selected item in the simulated Swing fields
  const [fieldId, setFieldId] = useState<number | null>(null);
  const [fieldTitle, setFieldTitle] = useState("");
  const [fieldContent, setFieldContent] = useState("");
  const [fieldCategory, setFieldCategory] = useState("Personal");
  const [fieldMood, setFieldMood] = useState("😊 Happy");
  const [fieldRating, setFieldRating] = useState(5);
  const [fieldDate, setFieldDate] = useState("");
  const [fieldIsLocked, setFieldIsLocked] = useState(false);
  const [fieldPassword, setFieldPassword] = useState("");
  
  // Custom dialog state for the simulated password pop-up
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [dialogInputPass, setDialogInputPass] = useState("");
  const [pendingEntryToDecrypt, setPendingEntryToDecrypt] = useState<DiaryEntrySim | null>(null);
  const [passError, setPassError] = useState(false);

  // Status message for the Swing application status bar
  const [swingStatus, setSwingStatus] = useState("Ready. Simulated JDBC database pool connected.");

  // AI assistant state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Quick info panel toggle
  const [activeInfoPanel, setActiveInfoPanel] = useState<string>("jdbc");

  // Terminal autoscroll helper
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Seed simulated database on load
  useEffect(() => {
    const saved = localStorage.getItem("simulated_digital_diary_db");
    if (saved) {
      try {
        setDbEntries(JSON.parse(saved));
      } catch (e) {
        seedSampleData();
      }
    } else {
      seedSampleData();
    }

    // Set interactive initial date
    const today = new Date().toISOString().split("T")[0];
    setFieldDate(today);

    // Initial connection logs
    addSqlLog(
      "org.diary.db.DatabaseConnection.getConnection()",
      "DriverManager.getConnection('jdbc:mysql://localhost:3306/digital_diary')",
      [],
      "success",
      8
    );
    addSqlLog(
      "org.diary.dao.DiaryDAO.getAllEntries()",
      "SELECT * FROM diary_entries ORDER BY entry_date DESC, id DESC",
      [],
      "success",
      12
    );
  }, []);

  // Save to locale mock state
  useEffect(() => {
    if (dbEntries.length > 0) {
      localStorage.setItem("simulated_digital_diary_db", JSON.stringify(dbEntries));
    }
  }, [dbEntries]);

  // Terminal scroll to bottom on logs update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sqlLogs]);

  const seedSampleData = () => {
    const today = new Date().toISOString().split("T")[0];
    const initialList: DiaryEntrySim[] = [
      {
        id: 1,
        title: "My First Digital Diary Journey",
        content: "Today, I set up my Java + MySQL Digital Diary. The SQLite/MySQL setup went perfectly fine! Excited to persist my memories digitally in a secure relational database.",
        category: "Work",
        mood: "😊 Happy",
        rating: 5,
        isLocked: false,
        passwordHash: null,
        entryDate: today,
      },
      {
        id: 2,
        title: "Exploring Java GUI programming with Swing",
        content: "Building Swing interfaces can be tedious, but with proper layouts like GridBagLayout and custom renderers, we can make it look highly modern. Pairing it with a robust JDBC layer is satisfying!",
        category: "Personal",
        mood: "🧠 Productive",
        rating: 4,
        isLocked: false,
        passwordHash: null,
        entryDate: today,
      },
      {
        id: 3,
        title: "Securing private thoughts in MySQL",
        content: "This entry contains some private notes from my Java coding sprints. Locked with custom password encryption checks inside our DAO code to prevent unauthorized reading.",
        category: "Ideas",
        mood: "☕ Calm",
        rating: 5,
        isLocked: true,
        passwordHash: "1234",
        entryDate: today,
      }
    ];
    setDbEntries(initialList);
  };

  // Helper to log SQL interactions
  const addSqlLog = (
    className: string,
    statement: string,
    parameters: string[],
    status: "success" | "warning" | "error" = "success",
    customDuration: number | null = null
  ) => {
    const duration = customDuration ?? Math.floor(Math.random() * 8) + 2;
    const log: SqlLog = {
      timestamp: new Date().toLocaleTimeString(),
      statement: `[JDBC] ${className}\nSQL: ${statement}`,
      parameters,
      status,
      durationMs: duration
    };
    setSqlLogs(prev => [...prev, log]);
  };

  // Handle Swing entry selection
  const handleSelectEntry = (entry: DiaryEntrySim, index: number) => {
    if (entry.isLocked) {
      setPendingEntryToDecrypt(entry);
      setDialogInputPass("");
      setPassError(false);
      setShowPasswordDialog(true);
      return;
    }

    bindEntryToFields(entry);
    setSelectedListIndex(index);
    setSwingStatus(`Active diary record selected: ${entry.title}`);
    
    addSqlLog(
      "org.diary.dao.DiaryDAO.mapResultSetToEntry(ResultSet rs)",
      "Fetched diary_entries Row with values for Title: ?",
      [entry.title],
      "success",
      2
    );
  };

  const bindEntryToFields = (entry: DiaryEntrySim) => {
    setFieldId(entry.id);
    setFieldTitle(entry.title);
    setFieldContent(entry.content);
    setFieldCategory(entry.category);
    setFieldMood(entry.mood);
    setFieldRating(entry.rating);
    setFieldDate(entry.entryDate);
    setFieldIsLocked(entry.isLocked);
    setFieldPassword(entry.passwordHash || "");
  };

  const handlePasswordSubmit = () => {
    if (!pendingEntryToDecrypt) return;

    if (dialogInputPass === pendingEntryToDecrypt.passwordHash) {
      // Success
      bindEntryToFields(pendingEntryToDecrypt);
      const index = dbEntries.findIndex(e => e.id === pendingEntryToDecrypt.id);
      setSelectedListIndex(index !== -1 ? index : null);
      setSwingStatus(`Unlocked & selected: ${pendingEntryToDecrypt.title}`);
      
      addSqlLog(
        "org.diary.dao.DiaryDAO.mapResultSetToEntry()",
        "Entry decryption matching password checked. Unlock SUCCESS for query record ID: ?",
        [String(pendingEntryToDecrypt.id)],
        "success",
        4
      );

      setShowPasswordDialog(false);
      setPendingEntryToDecrypt(null);
    } else {
      // Failed
      setPassError(true);
      setSwingStatus("Access Denied: Invalid credentials.");
      addSqlLog(
        "org.diary.ui.DiarySwingUI.selectDiaryEntry()",
        "Password validation FAILED for locked record ID: ? (Decryption halted)",
        [String(pendingEntryToDecrypt.id)],
        "warning",
        3
      );
    }
  };

  // Simulated DB updates
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldTitle.trim() || !fieldContent.trim()) {
      alert("Title and Content fields cannot be empty in Swing!");
      setSwingStatus("Validation Warning: Empty fields cannot be saved.");
      return;
    }

    const isNew = fieldId === null;
    let targetPassword = fieldPassword;

    if (fieldIsLocked && !fieldPassword.trim()) {
      const pass = prompt("Set a simple passcode to view this entry:");
      if (!pass || !pass.trim()) {
        alert("Lock cancelled: A password is required to encrypt the entry.");
        setFieldIsLocked(false);
        return;
      }
      targetPassword = pass.trim();
      setFieldPassword(targetPassword);
    }

    if (isNew) {
      const newEntry: DiaryEntrySim = {
        id: Math.max(0, ...dbEntries.map(e => e.id)) + 1,
        title: fieldTitle,
        content: fieldContent,
        category: fieldCategory,
        mood: fieldMood,
        rating: fieldRating,
        isLocked: fieldIsLocked,
        passwordHash: fieldIsLocked ? targetPassword : null,
        entryDate: fieldDate || new Date().toISOString().split("T")[0],
      };

      setDbEntries(prev => [newEntry, ...prev]);
      setFieldId(newEntry.id);
      setSwingStatus(`Digital diary entry saved and committed to MySQL DB! (ID: ${newEntry.id})`);
      
      addSqlLog(
        "org.diary.dao.DiaryDAO.addEntry(DiaryEntry entry)",
        "INSERT INTO diary_entries (title, content, category, mood, rating, is_locked, password_hash, entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newEntry.title,
          newEntry.content.substring(0, 30) + "...",
          newEntry.category,
          newEntry.mood,
          String(newEntry.rating),
          String(newEntry.isLocked),
          newEntry.passwordHash || "NULL",
          newEntry.entryDate
        ],
        "success",
        15
      );
    } else {
      // Update
      const updatedEntries = dbEntries.map(item => {
        if (item.id === fieldId) {
          return {
            ...item,
            title: fieldTitle,
            content: fieldContent,
            category: fieldCategory,
            mood: fieldMood,
            rating: fieldRating,
            isLocked: fieldIsLocked,
            passwordHash: fieldIsLocked ? targetPassword : null,
            entryDate: fieldDate,
          };
        }
        return item;
      });

      setDbEntries(updatedEntries);
      setSwingStatus(`Entry (ID: ${fieldId}) successfully updated inside MySQL!`);
      
      addSqlLog(
        "org.diary.dao.DiaryDAO.updateEntry(DiaryEntry entry)",
        "UPDATE diary_entries SET title = ?, content = ?, category = ?, mood = ?, rating = ?, is_locked = ?, password_hash = ?, entry_date = ? WHERE id = ?",
        [
          fieldTitle,
          fieldContent.substring(0, 30) + "...",
          fieldCategory,
          fieldMood,
          String(fieldRating),
          String(fieldIsLocked),
          fieldIsLocked ? targetPassword : "NULL",
          fieldDate,
          String(fieldId)
        ],
        "success",
        11
      );
    }
  };

  const handleDeleteEntry = () => {
    if (fieldId === null) {
      alert("No active entry selected to delete.");
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to permanently delete: "${fieldTitle}"?`)) {
      setDbEntries(prev => prev.filter(e => e.id !== fieldId));
      handleResetFields();
      setSwingStatus("Entry permanently expunged from database rows.");
      
      addSqlLog(
        "org.diary.dao.DiaryDAO.deleteEntry(int id)",
        "DELETE FROM diary_entries WHERE id = ?",
        [String(fieldId)],
        "success",
        14
      );
    }
  };

  const handleResetFields = () => {
    setFieldId(null);
    setFieldTitle("");
    setFieldContent("");
    setFieldCategory("Personal");
    setFieldMood("😊 Happy");
    setFieldRating(5);
    setFieldDate(new Date().toISOString().split("T")[0]);
    setFieldIsLocked(false);
    setFieldPassword("");
    setSelectedListIndex(null);
    setSwingStatus("Fields reset. Ready to compose a brand new digital memory.");
  };

  // Searching swing JList
  const filteredEntries = dbEntries.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      selectedFilterCategory === "All Categories" || 
      entry.category === selectedFilterCategory;

    return matchesSearch && matchesFilter;
  });

  const triggerSearchLog = () => {
    addSqlLog(
      "org.diary.dao.DiaryDAO.searchEntries(String query)",
      "SELECT * FROM diary_entries WHERE title LIKE ? OR content LIKE ? ORDER BY entry_date DESC",
      [`%${searchQuery}%`, `%${searchQuery}%`],
      "success"
    );
    setSwingStatus(`Search query completed on table. Returned ${filteredEntries.length} matches.`);
  };

  const triggerCategoryFilterLog = (cat: string) => {
    addSqlLog(
      "org.diary.dao.DiaryDAO.getEntriesByCategory(String category)",
      "SELECT * FROM diary_entries WHERE category = ? ORDER BY entry_date DESC",
      [cat],
      "success"
    );
    setSwingStatus(`Filtered by category "${cat}". Returned ${filteredEntries.length} entries.`);
  };

  // Copy helper
  const copyToClipboard = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => {
      setCopiedFile(null);
    }, 2000);
  };

  // AI Code Gen Agent Trigger
  const handleRefactorCode = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    setAiSuccessMessage(null);

    // Format current files to pass as dynamic context
    const currentFilesPayload: Record<string, string> = {};
    Object.entries(projectFiles).forEach(([key, val]: [string, any]) => {
      currentFilesPayload[key] = val.content;
    });

    try {
      const response = await fetch("/api/java-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          files: currentFilesPayload
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.files)) {
        // Map back
        const updatedObj: Record<string, JavaFile> = { ...projectFiles };
        resData.files.forEach((file: any) => {
          if (file.filename && file.newContent) {
            updatedObj[file.filename] = {
              filename: file.filename,
              language: file.filename.endsWith(".sql") ? "sql" : file.filename.endsWith(".md") ? "markdown" : "java",
              description: projectFiles[file.filename]?.description || "AI augmented file source code update.",
              content: file.newContent
            };
          }
        });
        setProjectFiles(updatedObj);
        setAiSuccessMessage(`Successfully updated Java project files with instruction: "${aiPrompt}"! Check the Source Code tab.`);
        setAiPrompt("");
      } else {
        throw new Error(resData.error || "Unexpected response schema from developer model runtime.");
      }
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || "Failed to call backend Java modification generation microservice.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 rounded-xl shadow-lg shadow-emerald-950/40">
            <Database className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Java Digital Diary <span className="text-xs bg-slate-800 text-emerald-400 border border-slate-700/60 font-semibold px-2 py-0.5 rounded-full">Swing + JDBC + MySQL</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Interactive design playground, actual JDBC controller viewer, and automated code-generation suite
            </p>
          </div>
        </div>

        {/* Global tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "simulator" ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Live Simulator</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab("code");
              // default selected to main JFrame
              if (!selectedFileKey) setSelectedFileKey("DiarySwingUI.java");
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "code" ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            <FileCode2 className="w-4 h-4" />
            <span className="hidden sm:inline">Source Code</span>
          </button>

          <button 
            onClick={() => setActiveTab("ai")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "ai" ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Refactor</span>
          </button>

          <button 
            onClick={() => setActiveTab("docs")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "docs" ? "bg-slate-800 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Setup Guides</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sub-column with dynamic UI dependent on tab */}
        <div className="lg:col-span-9 flex flex-col space-y-6">
          
          {/* TAB 1: SIMULATOR & PLAYGROUND */}
          {activeTab === "simulator" && (
            <div className="space-y-6">
              
              {/* Swing Java frame container widget */}
              <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
                
                {/* Titlebar mockup */}
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300 text-xs font-mono pl-2">org.diary.ui.DiarySwingUI (Running Frame Node.js JVM)</span>
                  </div>
                  <div className="text-xs bg-slate-950 font-mono px-3 py-1 text-slate-400 rounded-md border border-slate-700">
                    Host: localhost:3306 [MySQL Active]
                  </div>
                </div>

                {/* Simulated JFrame body */}
                <div className="bg-slate-100 text-slate-800 p-4 md:p-6 font-sans">
                  
                  {/* Top Swing Title Panel */}
                  <div className="border-b border-slate-300 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                        📓 Digital Diary Interface <span className="text-xs font-mono font-normal text-slate-500 px-1.5 py-0.5 bg-slate-200 rounded">v1.4 - JDBC Direct</span>
                      </h2>
                      <p className="text-xs text-slate-600">Simulating Java Swing UI Components mapping to database rows</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={seedSampleData}
                        title="Re-seed SQL entries to default"
                        className="p-1 px-2.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        Reset Database
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Left sidebar panel (JList) & Right main form panel */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* LEFT PANEL: Search / JList */}
                    <div className="md:col-span-4 flex flex-col space-y-3.5">
                      
                      {/* Search panel border mimicking JGroup */}
                      <div className="bg-slate-50 border border-slate-300 rounded p-3">
                        <label className="text-xs font-bold text-slate-600 block mb-1">Search & Category Filters</label>
                        
                        {/* Search input group */}
                        <div className="flex space-x-1.5 mb-2.5">
                          <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                              <Search className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                            <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search title/text..."
                              className="w-full bg-white border border-slate-300 rounded pl-8 pr-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <button 
                            onClick={triggerSearchLog}
                            className="bg-[#2980b9] text-white px-2.5 py-1 text-xs font-semibold rounded hover:bg-[#1a6294] transition"
                          >
                            Go
                          </button>
                        </div>

                        {/* Category Dropdown */}
                        <select 
                          value={selectedFilterCategory}
                          onChange={(e) => {
                            setSelectedFilterCategory(e.target.value);
                            triggerCategoryFilterLog(e.target.value);
                          }}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="All Categories">All Categories</option>
                          <option value="Personal">Personal</option>
                          <option value="Work">Work</option>
                          <option value="Ideas">Ideas</option>
                          <option value="Travel">Travel</option>
                          <option value="Health">Health</option>
                        </select>
                      </div>

                      {/* JList mock container */}
                      <div className="flex-1 min-h-[220px] bg-white border border-slate-300 rounded shadow-inner overflow-y-auto">
                        <div className="px-3 py-2 bg-slate-100 text-xs font-bold border-b border-slate-200 text-slate-700 flex justify-between">
                          <span>entryJList (Diary Records)</span>
                          <span className="text-[10px] text-slate-500">Rows: {filteredEntries.length}</span>
                        </div>
                        
                        {filteredEntries.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 italic">No entries match filters</div>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {filteredEntries.map((entry, idx) => {
                              const isSelected = selectedListIndex !== null && dbEntries[selectedListIndex]?.id === entry.id;
                              return (
                                <li 
                                  key={entry.id}
                                  onClick={() => handleSelectEntry(entry, dbEntries.indexOf(entry))}
                                  className={`px-3 py-2.5 text-xs cursor-pointer transition flex items-center justify-between ${isSelected ? "bg-blue-100 text-blue-900 font-semibold border-l-4 border-blue-600" : "hover:bg-slate-50 text-slate-700"}`}
                                >
                                  <div className="truncate mr-2">
                                    <span className="text-slate-400 mr-1.5">
                                      {entry.isLocked ? "🔒" : "📝"}
                                    </span>
                                    <span>{entry.title}</span>
                                  </div>
                                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded flex-shrink-0 font-medium">
                                    {entry.category}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* Add new memory button mimicking Swing Border Button */}
                      <button 
                        onClick={handleResetFields}
                        className="w-full bg-[#2980b9] hover:bg-[#216d9b] text-white py-2 text-xs font-bold rounded shadow-sm flex items-center justify-center space-x-1.5 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>➕ Create New Entry</span>
                      </button>
                    </div>

                    {/* RIGHT PANEL: Form inputs */}
                    <div className="md:col-span-8 bg-slate-50 border border-slate-300 rounded p-4 flex flex-col space-y-3.5">
                      <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center text-slate-600 text-xs font-semibold">
                        <span>Workspace Editor</span>
                        <span className="font-mono text-[10px]">
                          {fieldId ? `Record ID: ${fieldId}` : "★ New Record"}
                        </span>
                      </div>

                      <form onSubmit={handleSaveEntry} className="space-y-3">
                        
                        {/* Title line */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                          <input 
                            type="text"
                            value={fieldTitle}
                            onChange={(e) => setFieldTitle(e.target.value)}
                            placeholder="Enter diary title here..."
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Date, Category row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                            <input 
                              type="date"
                              value={fieldDate}
                              onChange={(e) => setFieldDate(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                            <select 
                              value={fieldCategory}
                              onChange={(e) => setFieldCategory(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Personal">Personal</option>
                              <option value="Work">Work</option>
                              <option value="Ideas">Ideas</option>
                              <option value="Travel">Travel</option>
                              <option value="Health">Health</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Mood</label>
                            <select 
                              value={fieldMood}
                              onChange={(e) => setFieldMood(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="😊 Happy">😊 Happy</option>
                              <option value="🧠 Productive">🧠 Productive</option>
                              <option value="☕ Calm">☕ Calm</option>
                              <option value="😔 Tired">😔 Tired</option>
                              <option value="⚡ Excited">⚡ Excited</option>
                              <option value="🤯 Stressed">🤯 Stressed</option>
                            </select>
                          </div>
                        </div>

                        {/* Slider and Password line */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          
                          {/* Rating slider mockup */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-bold text-slate-600">Rating (1 to 5 Stars)</label>
                              <span className="text-xs font-semibold text-amber-600 font-mono">
                                {"★".repeat(fieldRating)} ({fieldRating})
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="1"
                              max="5"
                              value={fieldRating}
                              onChange={(e) => setFieldRating(Number(e.target.value))}
                              className="w-full accent-[#2980b9] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                              <span>1 (Poor)</span>
                              <span>3</span>
                              <span>5 (Great)</span>
                            </div>
                          </div>

                          {/* Security Password integration layout */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                Password Lock
                              </label>
                              <span className="text-[10px] text-slate-500">Encrypt Entry</span>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="flex items-center text-xs text-slate-700 font-semibold cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={fieldIsLocked}
                                  onChange={(e) => setFieldIsLocked(e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                Require authentication path
                              </label>

                              {fieldIsLocked && (
                                <input 
                                  type="password"
                                  value={fieldPassword}
                                  onChange={(e) => setFieldPassword(e.target.value)}
                                  placeholder="Define passcode..."
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Content / Journal Text</label>
                          <textarea 
                            value={fieldContent}
                            onChange={(e) => setFieldContent(e.target.value)}
                            placeholder="Write your beautiful thoughts, metrics, study reminders, or meeting records here..."
                            rows={5}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed resize-none"
                          />
                        </div>

                        {/* Action buttons mirroring JButton Grid layout */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <button 
                            type="submit"
                            className="bg-[#2ecc71] hover:bg-[#27ae60] text-white py-2 text-xs font-bold rounded shadow-sm text-center flex items-center justify-center space-x-1.5 transition transition-all duration-150 active:scale-95 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Entry</span>
                          </button>

                          <button 
                            type="button"
                            onClick={handleResetFields}
                            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 py-2 text-xs font-bold rounded shadow-sm text-center transition active:scale-95 cursor-pointer"
                          >
                            Reset Fields
                          </button>

                          <button 
                            type="button"
                            onClick={handleDeleteEntry}
                            className="bg-[#e74c3c] hover:bg-[#c0392b] text-white py-2 text-xs font-bold rounded shadow-sm text-center flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Simulated Swing Status bar */}
                  <div className="mt-4 bg-slate-200 border border-slate-300 rounded px-3 py-1.5 text-[11px] font-semibold text-slate-700 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-mono">Swing Status:</span>
                    <span>{swingStatus}</span>
                  </div>

                </div>
              </div>

              {/* LIVE MYSQL JDBC CONSOLE TERMINAL FOOTER */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs tracking-wide text-slate-300 uppercase">Live JDBC Connection Client & MySQL Operations Logger</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSqlLogs([]);
                      setSwingStatus("Cleared SQL terminal diagnostic history.");
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear Log Stream
                  </button>
                </div>

                {/* Database Command stream output */}
                <div className="p-4 bg-black font-mono text-xs max-h-56 overflow-y-auto space-y-3">
                  {sqlLogs.length === 0 ? (
                    <div className="text-slate-500 italic text-[11px] py-2">
                      Waiting for Swing user interactions... All operations run actual prepared statement logic and bind relational parameters live inside logs below.
                    </div>
                  ) : (
                    sqlLogs.map((log, index) => (
                      <div key={index} className="border-l-2 pl-3 border-slate-800 space-y-1 py-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{log.timestamp} | thread-main</span>
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${log.status === "success" ? "bg-emerald-950/40 text-emerald-400" : "bg-amber-950/40 text-amber-400"}`}>
                            {log.status.toUpperCase()} ({log.durationMs}ms)
                          </span>
                        </div>
                        <pre className="text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed">{log.statement}</pre>
                        {log.parameters.length > 0 && (
                          <div className="text-[10px] text-teal-400 bg-teal-950/20 px-2 py-0.5 rounded inline-block">
                            Params: {JSON.stringify(log.parameters)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COMPLETE SOURCE CODE VIEWER */}
          {activeTab === "code" && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col md:flex-row h-[720px]">
              
              {/* Left Bar selector listing files */}
              <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-4 shrink-0 flex flex-col">
                <div className="text-xs font-bold text-slate-400 px-2 mb-3 tracking-wider uppercase">Project File Tree</div>
                
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {Object.values(projectFiles).map((file: any) => {
                    const isSelected = selectedFileKey === file.filename;
                    return (
                      <button
                        key={file.filename}
                        onClick={() => setSelectedFileKey(file.filename)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${isSelected ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"}`}
                      >
                        <FileCode2 className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className="truncate">{file.filename}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="font-bold text-slate-300 block mb-0.5">Architecture Model</span>
                  MVC (Model-View-Controller) separating data layouts, direct MySQL statement DAO pools, and UI controls.
                </div>
              </div>

              {/* Right View content */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
                
                {/* File description header */}
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{selectedFileKey}</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 capitalize border border-slate-700">
                        {projectFiles[selectedFileKey]?.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{projectFiles[selectedFileKey]?.description}</p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(selectedFileKey, projectFiles[selectedFileKey]?.content || "")}
                    className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition active:scale-95"
                  >
                    {copiedFile === selectedFileKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preformatted code block */}
                <div className="flex-1 overflow-auto p-5 bg-slate-950 font-mono text-[12px] leading-relaxed">
                  <pre className="text-slate-300 selection:bg-emerald-600">
                    <code>{projectFiles[selectedFileKey]?.content}</code>
                  </pre>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: AI REFACTORING SUITE */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              
              {/* Introduction Alert */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-950 p-6 rounded-2xl border border-emerald-800/30">
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-base">Gemini Relational Java Architecture Assistant</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      This workspace features a live connection to a backend LLM assistant powered by <strong>Gemini 3.5 Flash</strong>. 
                      You can submit requirements to automatically modify, scale, or adapt any portion of the Java code! 
                      The engine parses your prompt, applies modifications, and updates the local files in the interactive workspace immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Interaction Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
                <label className="block text-sm font-semibold text-slate-200">
                  State your Java refactoring instruction or feature request:
                </label>
                
                <div className="space-y-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Include password hashing verification logic in DatabaseConnection or secure the entries with simple SHA-256 strings; or modify the schema to include tags; or add title text length validation to prevent short entries..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none"
                    disabled={isGenerating}
                  />

                  {/* Quick suggestion tags */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="font-medium self-center text-slate-500 mr-1">Suggestions:</span>
                    <button 
                      onClick={() => setAiPrompt("Add a custom date-range SQL filter in DiaryDAO and connect it representing a search helper.")}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-full cursor-pointer transition"
                    >
                      Filter by Dates
                    </button>
                    <button 
                      onClick={() => setAiPrompt("Include title character length validation in DiaryDAO before inserting a record to ensure entries are descriptive.")}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-full cursor-pointer transition"
                    >
                      Validation checks
                    </button>
                    <button 
                      onClick={() => setAiPrompt("Add a SHA-256 hashing utility inside org.diary.db to encrypt passwords before testing against diary entry lock passwords.")}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-full cursor-pointer transition"
                    >
                      SHA-256 encryption
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleRefactorCode}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg transition ${
                      isGenerating || !aiPrompt.trim()
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-950/20 active:scale-95 cursor-pointer"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Refactored Code...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Submit Instruction</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status messages */}
                {aiError && (
                  <div className="p-4 bg-rose-950/30 border border-rose-800/40 text-rose-300 rounded-xl text-xs flex items-start space-x-2.5">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                {aiSuccessMessage && (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs flex items-start space-x-2.5">
                    <Check className="w-4.5 h-4.5 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* Workflow breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">1. Extraction</span>
                  <p className="text-[11px] text-slate-400">
                    The prompt extracts and serializes all files (`schema.sql`, POJO models, controllers) to preserve absolute context alignment.
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">2. LLM Processing</span>
                  <p className="text-[11px] text-slate-400">
                    Gemini updates SQL statements, updates Java Swing event-listeners, validates models, and formats outputs into a structured JSON array.
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">3. Immediate Feedback</span>
                  <p className="text-[11px] text-slate-400">
                    Source code instantly updates above! Swing UI displays corresponding states live after processing has finalized.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SETUP & PRODUCTION WALKTHROUGHS */}
          {activeTab === "docs" && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Comprehensive Production Set Up Guide
                </h3>
                <p className="text-xs text-slate-400">
                  Follow these step-by-step procedures to deploy and run the Swing application against a real production MySQL server.
                </p>
              </div>

              {/* Interactive Step sequence */}
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex items-start space-x-4 border-l-2 border-emerald-500 pl-4 py-1">
                  <div className="text-emerald-400 font-bold font-mono text-sm">01</div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-200">Prepare local MySQL Database</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Log in to your local MySQL utility/shell and execute the SQL file:
                    </p>
                    <pre className="bg-slate-950 p-2.5 rounded text-[11px] text-teal-400 font-mono">
                      mysql -u root -p<br />
                      mysql&gt; SOURCE schema.sql;
                    </pre>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4 border-l-2 border-emerald-500 pl-4 py-1">
                  <div className="text-emerald-400 font-bold font-mono text-sm">02</div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-200">Update MySQL Password credentials</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Open <span className="font-semibold text-emerald-400 font-mono">DatabaseConnection.java</span> and replace <span className="font-mono text-[11px] underline">your_mysql_password</span> with your real root server password.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4 border-l-2 border-emerald-500 pl-4 py-1">
                  <div className="text-emerald-400 font-bold font-mono text-sm">03</div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-200">Get JDBC Connector/J driver</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The MySQL driver handles Java classes connecting to standard TCP ports:
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-1.5">
                      <li>For Maven, add the dependency block in the README to your <code className="text-slate-300 font-mono">pom.xml</code></li>
                      <li>For standard raw terminal execution, download the <code className="text-slate-300 font-mono">mysql-connector-j-8.3.0.jar</code> manually and place it in the compilation directory root</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4 border-l-2 border-emerald-500 pl-4 py-1">
                  <div className="text-emerald-400 font-bold font-mono text-sm">04</div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-200">Compile & Execute</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Run standard compilation and runtime directives matching your system OS (detailed script terminal arguments available inside the README tab).
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* SIDE ARCHITECTURE & INFO COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section: Schema Highlight */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              MySQL Table Structure
            </h3>

            <div className="space-y-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-[11px] font-mono">
                <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1 text-xs">diary_entries</span>
                <div className="flex justify-between">
                  <span className="text-emerald-400">id</span>
                  <span className="text-slate-500">INT (PK, AI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">title</span>
                  <span className="text-slate-500">VARCHAR(150)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">content</span>
                  <span className="text-slate-500">TEXT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">category</span>
                  <span className="text-slate-500">VARCHAR(50)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">mood</span>
                  <span className="text-slate-500">VARCHAR(50)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">rating</span>
                  <span className="text-slate-500">INT (1-5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">is_locked</span>
                  <span className="text-slate-500">BOOLEAN</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-teal-500">entry_date</span>
                  <span className="text-slate-500">DATE</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic leading-snug">
                Equipped with custom constraints and indexes to handle highly performant queries during large volume inserts.
              </p>
            </div>
          </div>

          {/* Section: Architecture explanations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              Java + MySQL Paradigm
            </h3>

            {/* Panel Selector buttons */}
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button 
                onClick={() => setActiveInfoPanel("jdbc")}
                className={`px-1 py-1.5 text-[9px] font-bold rounded-md transition ${activeInfoPanel === "jdbc" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
              >
                JDBC Driver
              </button>
              <button 
                onClick={() => setActiveInfoPanel("dao")}
                className={`px-1 py-1.5 text-[9px] font-bold rounded-md transition ${activeInfoPanel === "dao" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
              >
                DAO Design
              </button>
              <button 
                onClick={() => setActiveInfoPanel("security")}
                className={`px-1 py-1.5 text-[9px] font-bold rounded-md transition ${activeInfoPanel === "security" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
              >
                Prevention
              </button>
            </div>

            {/* Small dynamic explanatory text */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 min-h-[140px] flex flex-col justify-between">
              {activeInfoPanel === "jdbc" && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-200 block text-[11px]">Java Database Connectivity</span>
                  <p className="text-[11px] text-slate-400">
                    Java uses JDBC drivers to convert standard Java runtime parameters into standard direct socket commands understood by the listening MySQL server on port 3306.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Always load classes using <code className="text-slate-300 font-mono">Class.forName()</code> to initialize driver parameters properly!
                  </p>
                </div>
              )}

              {activeInfoPanel === "dao" && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-200 block text-[11px]">Data Access Object (DAO) Pattern</span>
                  <p className="text-[11px] text-slate-400">
                    Isolates SQL query strings and database transactions away from the UI code. 
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This keeps source code clean because Swing files like <code className="text-emerald-400 font-mono">DiarySwingUI.java</code> only invoke pure Java methods like <code className="text-slate-300 font-mono">diaryDAO.addEntry()</code> without writing raw SQL.
                  </p>
                </div>
              )}

              {activeInfoPanel === "security" && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-200 block text-[11px]">SQL Injection Protection</span>
                  <p className="text-[11px] text-slate-400">
                    Never concatenate query parameters! (e.g. <code className="text-rose-400 font-mono">"WHERE field = " + value</code>).
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Always use <code className="text-emerald-400 font-mono">PreparedStatement</code> placeholders (<code className="font-mono">?</code>). MySQL compiles query sequences *before* parameters register, preventing hostile SQL injection vectors.
                  </p>
                </div>
              )}
              
              <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between text-[9px] text-slate-500">
                <span>Enterprise Suite</span>
                <span>Oracle Standard compliant</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Security Credentials</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              To edit API features or prompt refinements, you can use your **GEMINI_API_KEY** found under the **Settings &gt; Secrets** panel in Google AI Studio.
            </p>
          </div>

        </div>

      </main>

      {/* FOOTER credit line bar */}
      <footer className="border-t border-slate-800 py-6 mt-12 bg-slate-950 text-slate-500 text-xs text-center shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Java Digital Diary Relational Workspace. Built with standard Swing, MySQL JDBC drivers, and React IDE simulators.</p>
          <div className="flex space-x-4 text-[11px] font-semibold">
            <span className="text-slate-400">MySQL Direct Client 8.x compliant</span>
            <span>•</span>
            <span className="text-slate-400">Java Standard Edition 17+</span>
          </div>
        </div>
      </footer>

      {/* DECRYPTION DIALOG / POPUP MOCK */}
      {showPasswordDialog && pendingEntryToDecrypt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            
            {/* Dialog header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Decryption Verification Standard
              </span>
              <button 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPendingEntryToDecrypt(null);
                }}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-5 space-y-4 text-slate-300 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">Protected Memory Entry</p>
                <p className="text-slate-400 leading-normal">
                  The item &quot;{pendingEntryToDecrypt.title}&quot; is secured using SQL lock parameters. Please enter the password hash configured in MySQL database to unlock:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Secret password</label>
                <input 
                  type="password"
                  value={dialogInputPass}
                  onChange={(e) => setDialogInputPass(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasswordSubmit();
                  }}
                  autoFocus
                />
                
                {passError && (
                  <p className="text-rose-500 text-[10px] font-semibold animate-pulse">
                    ⚠️ Invalid credentials. SQL decrypt rejected. Try &quot;1234&quot; for the preloaded template.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button 
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPendingEntryToDecrypt(null);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasswordSubmit}
                  className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold hover:shadow-lg transition cursor-pointer"
                >
                  Verify JDBC
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
