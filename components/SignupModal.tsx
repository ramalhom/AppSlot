'use client';

import { useState } from 'react';
import { Match } from '@/lib/types';

interface SignupModalProps {
  match: Match;
  slot: 'arbitre1' | 'arbitre2';
  defaultName: string;
  onConfirm: (name: string, match: Match, slot: 'arbitre1' | 'arbitre2') => Promise<void>;
  onClose: () => void;
}

const MONTHS_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre'
];

export default function SignupModal({ match, slot, defaultName, onConfirm, onClose }: SignupModalProps) {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const d = new Date(match.date + 'T00:00:00');
  const dateStr = `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  const slotLabel = slot === 'arbitre1' ? 'Arbitre 1' : 'Arbitre 2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (name.trim().length < 2) {
      setError('Le nom doit faire au moins 2 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(name.trim(), match, slot);
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="modal-title">✋ S&apos;inscrire comme arbitre</h2>
            <div className="modal-subtitle">
              {match.equipeDomicile} vs {match.equipeExterieur}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {/* Match info */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          fontSize: '0.875rem',
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Date</div>
            <div style={{ fontWeight: 600 }}>{dateStr}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Heure</div>
            <div style={{ fontWeight: 600 }}>{match.heure}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Lieu</div>
            <div style={{ fontWeight: 600 }}>{match.lieu}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Poste</div>
            <div style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{slotLabel}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="arbitre-name">Votre nom et prénom *</label>
            <input
              id="arbitre-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ex: Jean Dupont"
              autoFocus
              autoComplete="name"
            />
            <div className="input-hint">
              Votre nom sera visible par tous les arbitres connectés.
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading || !name.trim()}
              id="btn-confirm-signup"
            >
              {loading ? '⏳ En cours...' : '✅ Confirmer mon inscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
