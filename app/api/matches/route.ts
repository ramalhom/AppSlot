import { NextRequest, NextResponse } from 'next/server';
import { getData } from '@/lib/data';

export async function GET() {
  try {
    const data = await getData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/matches error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
