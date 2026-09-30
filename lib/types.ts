// Types pour l'application Arbitres Sensler Cup

export interface Match {
  id: string;
  date: string; // ISO string
  heure: string; // "HH:MM"
  equipeDomicile: string;
  equipeExterieur: string;
  lieu: string;
  categorie: string; // "LNA", "LNB", "1ère ligue", etc.
  arbitre1?: string | null;
  arbitre2?: string | null;
  notes?: string;
}

export interface AppData {
  matches: Match[];
  adminPassword: string;
  lastUpdated: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
