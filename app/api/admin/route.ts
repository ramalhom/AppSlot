import { NextRequest, NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/data';
import { Match } from '@/lib/types';

// POST /api/admin - Actions admin (login, modifier matchs, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password, ...payload } = body as {
      action: string;
      password: string;
      [key: string]: unknown;
    };

    const data = await getData();

    // Vérifier le mot de passe admin
    if (password !== data.adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe administrateur incorrect' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'login':
        return NextResponse.json({ success: true, message: 'Connecté avec succès' });

      case 'addMatch': {
        const newMatch = payload.match as Omit<Match, 'id'>;
        const newId = String(Date.now());
        data.matches.push({ ...newMatch, id: newId, arbitre1: null, arbitre2: null });
        data.matches.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.heure}`);
          const dateB = new Date(`${b.date}T${b.heure}`);
          return dateA.getTime() - dateB.getTime();
        });
        await saveData(data);
        return NextResponse.json({ success: true, data: data.matches });
      }

      case 'updateMatch': {
        const updatedMatch = payload.match as Match;
        const matchIndex = data.matches.findIndex((m) => m.id === updatedMatch.id);
        if (matchIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Match introuvable' },
            { status: 404 }
          );
        }
        data.matches[matchIndex] = updatedMatch;
        data.matches.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.heure}`);
          const dateB = new Date(`${b.date}T${b.heure}`);
          return dateA.getTime() - dateB.getTime();
        });
        await saveData(data);
        return NextResponse.json({ success: true, data: data.matches });
      }

      case 'deleteMatch': {
        const { matchId } = payload as { matchId: string };
        data.matches = data.matches.filter((m) => m.id !== matchId);
        await saveData(data);
        return NextResponse.json({ success: true, data: data.matches });
      }

      case 'forceSignup': {
        // L'admin peut inscrire/désinscrire malgré le blocage 24h
        const { matchId, slot, nomArbitre } = payload as {
          matchId: string;
          slot: 'arbitre1' | 'arbitre2';
          nomArbitre: string | null;
        };
        const matchIndex = data.matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Match introuvable' },
            { status: 404 }
          );
        }
        data.matches[matchIndex] = {
          ...data.matches[matchIndex],
          [slot]: nomArbitre,
        };
        await saveData(data);
        return NextResponse.json({ success: true, data: data.matches[matchIndex] });
      }

      case 'changePassword': {
        const { newPassword } = payload as { newPassword: string };
        if (!newPassword || newPassword.length < 6) {
          return NextResponse.json(
            { success: false, error: 'Le mot de passe doit faire au moins 6 caractères' },
            { status: 400 }
          );
        }
        data.adminPassword = newPassword;
        await saveData(data);
        return NextResponse.json({ success: true, message: 'Mot de passe modifié' });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Action inconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/admin error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
