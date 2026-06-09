export interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  category: string;
  mood: string;
  rating: number;
  isLocked: boolean;
  passwordHash: string | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SqlLog {
  timestamp: string;
  statement: string;
  parameters: string[];
  status: "success" | "warning" | "error";
  durationMs: number;
}
