import { put, head, list } from '@vercel/blob';
import { AppData, Match } from './types';

const BLOB_KEY = 'sensler-cup-data.json';

// Données initiales avec des matchs de la saison Sensler Cup 2025-2026
const DEFAULT_DATA: AppData = {
  matches: [
    {
      id: '1',
      date: '2026-10-04',
      heure: '15:30',
      equipeDomicile: 'Sensler FHC',
      equipeExterieur: 'HC Murten',
      lieu: 'Sportzentrum Sense, Tafers',
      categorie: '1ère ligue',
      arbitre1: null,
      arbitre2: null,
    },
  ],
  adminPassword: 'SenslerCup2025!',
  lastUpdated: new Date().toISOString(),
};

// Vérifie si on est en développement local (pas de blob storage disponible)
const isLocalDev = !process.env.BLOB_READ_WRITE_TOKEN;

// Stockage en mémoire pour le développement local
let localData: AppData | null = null;

export async function getData(): Promise<AppData> {
  // Mode développement sans Vercel Blob
  if (isLocalDev) {
    if (!localData) {
      localData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return localData!;
  }

  try {
    // Essayer de récupérer le blob existant
    const blobs = await list({ prefix: BLOB_KEY });

    if (blobs.blobs.length > 0) {
      const response = await fetch(blobs.blobs[0].url);
      const data = await response.json() as AppData;
      return data;
    }

    // Premier démarrage : créer le blob avec les données par défaut
    return await saveData(DEFAULT_DATA);
  } catch (error) {
    console.error('Erreur lecture données:', error);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

export async function saveData(data: AppData): Promise<AppData> {
  const updatedData = { ...data, lastUpdated: new Date().toISOString() };

  // Mode développement sans Vercel Blob
  if (isLocalDev) {
    localData = updatedData;
    return updatedData;
  }

  try {
    await put(BLOB_KEY, JSON.stringify(updatedData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return updatedData;
  } catch (error) {
    console.error('Erreur sauvegarde données:', error);
    throw new Error('Impossible de sauvegarder les données');
  }
}

// Vérifier si un match peut encore être modifié (pas dans les 24h)
export function isMatchLocked(match: Match): boolean {
  const matchDateTime = new Date(`${match.date}T${match.heure}:00`);
  const now = new Date();
  const diffMs = matchDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 24;
}

// Vérifier si un match est passé
export function isMatchPast(match: Match): boolean {
  const matchDateTime = new Date(`${match.date}T${match.heure}:00`);
  return matchDateTime < new Date();
}
