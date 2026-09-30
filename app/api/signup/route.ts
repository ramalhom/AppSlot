import { NextRequest, NextResponse } from 'next/server';
import { getData, saveData, isMatchLocked } from '@/lib/data';

// POST /api/signup - Inscription d'un arbitre
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, slot, nomArbitre } = body as {
      matchId: string;
      slot: 'arbitre1' | 'arbitre2';
      nomArbitre: string;
    };

    if (!matchId || !slot || !nomArbitre?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (!['arbitre1', 'arbitre2'].includes(slot)) {
      return NextResponse.json(
        { success: false, error: 'Slot invalide' },
        { status: 400 }
      );
    }

    const data = await getData();
    const matchIndex = data.matches.findIndex((m) => m.id === matchId);

    if (matchIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Match introuvable' },
        { status: 404 }
      );
    }

    const match = data.matches[matchIndex];

    // Vérifier le blocage 24h
    if (isMatchLocked(match)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ce match est verrouillé (moins de 24h avant le coup de sifflet). Contactez l\'administrateur.',
        },
        { status: 403 }
      );
    }

    // Vérifier si le slot est déjà pris
    if (match[slot]) {
      return NextResponse.json(
        { success: false, error: 'Ce poste est déjà pris par un autre arbitre' },
        { status: 409 }
      );
    }

    // Vérifier que l'arbitre n'est pas déjà inscrit sur ce match
    const nomTrimmed = nomArbitre.trim();
    if (
      match.arbitre1?.toLowerCase() === nomTrimmed.toLowerCase() ||
      match.arbitre2?.toLowerCase() === nomTrimmed.toLowerCase()
    ) {
      return NextResponse.json(
        { success: false, error: 'Vous êtes déjà inscrit sur ce match' },
        { status: 409 }
      );
    }

    // Enregistrer l'arbitre
    data.matches[matchIndex] = { ...match, [slot]: nomTrimmed };
    await saveData(data);

    return NextResponse.json({ success: true, data: data.matches[matchIndex] });
  } catch (error) {
    console.error('POST /api/signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/signup - Désinscription d'un arbitre
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, slot, nomArbitre } = body as {
      matchId: string;
      slot: 'arbitre1' | 'arbitre2';
      nomArbitre: string;
    };

    if (!matchId || !slot || !nomArbitre?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const data = await getData();
    const matchIndex = data.matches.findIndex((m) => m.id === matchId);

    if (matchIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Match introuvable' },
        { status: 404 }
      );
    }

    const match = data.matches[matchIndex];

    // Vérifier le blocage 24h
    if (isMatchLocked(match)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ce match est verrouillé (moins de 24h avant le coup de sifflet). Contactez l\'administrateur.',
        },
        { status: 403 }
      );
    }

    // Vérifier que c'est bien cet arbitre qui est inscrit
    const nomTrimmed = nomArbitre.trim();
    if (match[slot]?.toLowerCase() !== nomTrimmed.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Vous n\'êtes pas inscrit à ce poste' },
        { status: 403 }
      );
    }

    // Retirer l'arbitre
    data.matches[matchIndex] = { ...match, [slot]: null };
    await saveData(data);

    return NextResponse.json({ success: true, data: data.matches[matchIndex] });
  } catch (error) {
    console.error('DELETE /api/signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
