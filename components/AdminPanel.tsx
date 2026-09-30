'use client';

import { useState } from 'react';
import { AppData, Match } from '@/lib/types';
import { ToastItem } from './Toast';

interface AdminPanelProps {
  data: AppData | null;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onDataChange: () => Promise<void>;
  addToast: (message: string, type?: ToastItem['type']) => void;
}

const EMPTY_MATCH: Omit<Match, 'id'> = {
  date: '',
  heure: '',
  equipeDomicile: '',
  equipeExterieur: '',
  lieu: '',
  categorie: '1ère ligue',
  arbitre1: null,
  arbitre2: null,
  notes: '',
};

export default function AdminPanel({
  data,
  isLoggedIn,
  onLogin,
  onLogout,
  onDataChange,
  addToast,
}: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'add' | 'settings'>('matches');
  const [newMatch, setNewMatch] = useState<Omit<Match, 'id'>>(EMPTY_MATCH);
  const [addLoading, setAddLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ matchId: string; slot: 'arbitre1' | 'arbitre2'; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const adminPost = async (action: string, payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password, ...payload }),
    });
    return res.json();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const json = await adminPost('login', {});
      if (json.success) {
        onLogin();
        addToast('Connecté en tant qu\'administrateur', 'success');
      } else {
        setLoginError(json.error || 'Mot de passe incorrect');
      }
    } catch {
      setLoginError('Erreur de connexion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.date || !newMatch.heure || !newMatch.equipeDomicile || !newMatch.equipeExterieur || !newMatch.lieu) {
      addToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }
    setAddLoading(true);
    try {
      const json = await adminPost('addMatch', { match: newMatch });
      if (json.success) {
        addToast('Match ajouté avec succès ! ✅', 'success');
        setNewMatch(EMPTY_MATCH);
        await onDataChange();
        setActiveTab('matches');
      } else {
        addToast(json.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch {
      addToast('Erreur de connexion', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Supprimer ce match ? Cette action est irréversible.')) return;
    try {
      const json = await adminPost('deleteMatch', { matchId });
      if (json.success) {
        addToast('Match supprimé', 'info');
        await onDataChange();
      } else {
        addToast(json.error || 'Erreur', 'error');
      }
    } catch {
      addToast('Erreur de connexion', 'error');
    }
  };

  const handleForceSlot = async (matchId: string, slot: 'arbitre1' | 'arbitre2', nomArbitre: string | null) => {
    try {
      const json = await adminPost('forceSignup', { matchId, slot, nomArbitre });
      if (json.success) {
        addToast('Arbitre mis à jour par l\'admin', 'success');
        setEditingSlot(null);
        await onDataChange();
      } else {
        addToast(json.error || 'Erreur', 'error');
      }
    } catch {
      addToast('Erreur de connexion', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('Le mot de passe doit faire au moins 6 caractères', 'warning');
      return;
    }
    setPasswordLoading(true);
    try {
      const json = await adminPost('changePassword', { newPassword });
      if (json.success) {
        addToast('Mot de passe modifié avec succès', 'success');
        setNewPassword('');
      } else {
        addToast(json.error || 'Erreur', 'error');
      }
    } catch {
      addToast('Erreur de connexion', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-panel" id="admin-panel">
        <div className="admin-panel-header">
          <h2>🔒 Espace Administrateur</h2>
        </div>
        <div style={{ maxWidth: '400px' }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="admin-password">Mot de passe administrateur</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {loginError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <span>⚠️</span> {loginError}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loginLoading} id="btn-admin-login">
              {loginLoading ? '⏳ Connexion...' : '🔓 Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const matches = data?.matches ?? [];

  return (
    <div className="admin-panel" id="admin-panel-logged">
      <div className="admin-panel-header">
        <h2>⚙️ Administration</h2>
        <button className="btn btn-secondary btn-sm" onClick={onLogout} id="btn-admin-logout">
          🚪 Déconnexion
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
          id="tab-matches"
        >
          📋 Matchs ({matches.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          id="tab-add"
        >
          ➕ Ajouter un match
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          id="tab-settings"
        >
          🔧 Paramètres
        </button>
      </div>

      {/* Tab: Matches list */}
      {activeTab === 'matches' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Match</th>
                <th>Lieu</th>
                <th>Arbitre 1</th>
                <th>Arbitre 2</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const d = new Date(match.date + 'T00:00:00');
                const dateStr = d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <tr key={match.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dateStr}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{match.heure}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {match.equipeDomicile}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        vs {match.equipeExterieur}
                      </div>
                      <div>
                        <span className="tag tag-categorie" style={{ marginTop: '4px', display: 'inline-block' }}>
                          {match.categorie}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '150px' }}>
                        {match.lieu}
                      </div>
                    </td>
                    {(['arbitre1', 'arbitre2'] as const).map((slot) => (
                      <td key={slot}>
                        {editingSlot?.matchId === match.id && editingSlot?.slot === slot ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={editingSlot.name}
                              onChange={(e) => setEditingSlot({ ...editingSlot, name: e.target.value })}
                              placeholder="Nom de l'arbitre"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '130px' }}
                            />
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleForceSlot(match.id, slot, editingSlot.name || null)}
                            >✓</button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleForceSlot(match.id, slot, null)}
                            >✕</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingSlot(null)}
                            >—</button>
                          </div>
                        ) : (
                          <div
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setEditingSlot({ matchId: match.id, slot, name: match[slot] || '' })}
                            title="Cliquer pour modifier"
                          >
                            {match[slot] ? (
                              <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                                🧑‍⚖️ {match[slot]}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                — libre
                              </span>
                            )}
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>✏️</span>
                          </div>
                        )}
                      </td>
                    ))}
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMatch(match.id)}
                        id={`btn-delete-${match.id}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {matches.length === 0 && (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>Aucun match dans le programme</h3>
              <p>Ajoutez des matchs via l&apos;onglet &quot;Ajouter un match&quot;.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Add Match */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddMatch} style={{ maxWidth: '600px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="new-date">Date *</label>
              <input
                id="new-date"
                type="date"
                value={newMatch.date}
                onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-heure">Heure *</label>
              <input
                id="new-heure"
                type="time"
                value={newMatch.heure}
                onChange={(e) => setNewMatch({ ...newMatch, heure: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-domicile">Équipe domicile *</label>
              <input
                id="new-domicile"
                type="text"
                value={newMatch.equipeDomicile}
                onChange={(e) => setNewMatch({ ...newMatch, equipeDomicile: e.target.value })}
                placeholder="Ex: Sensler FHC"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-exterieur">Équipe extérieur *</label>
              <input
                id="new-exterieur"
                type="text"
                value={newMatch.equipeExterieur}
                onChange={(e) => setNewMatch({ ...newMatch, equipeExterieur: e.target.value })}
                placeholder="Ex: HC Murten"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="new-lieu">Lieu / Salle *</label>
            <input
              id="new-lieu"
              type="text"
              value={newMatch.lieu}
              onChange={(e) => setNewMatch({ ...newMatch, lieu: e.target.value })}
              placeholder="Ex: Sportzentrum Sense, Tafers"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-categorie">Catégorie</label>
            <select
              id="new-categorie"
              value={newMatch.categorie}
              onChange={(e) => setNewMatch({ ...newMatch, categorie: e.target.value })}
            >
              <option>1ère ligue</option>
              <option>1ère ligue - Retour</option>
              <option>2ème ligue</option>
              <option>LNA</option>
              <option>LNB</option>
              <option>Playoffs</option>
              <option>Coupe</option>
              <option>Amical</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="new-notes">Notes (optionnel)</label>
            <textarea
              id="new-notes"
              value={newMatch.notes || ''}
              onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={addLoading} id="btn-add-match">
            {addLoading ? '⏳ Ajout en cours...' : '➕ Ajouter le match'}
          </button>
        </form>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🔑 Changer le mot de passe</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="new-password-admin">Nouveau mot de passe</label>
              <input
                id="new-password-admin"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading || newPassword.length < 6} id="btn-save-password">
              {passwordLoading ? '⏳ Sauvegarde...' : '💾 Enregistrer le mot de passe'}
            </button>
          </form>

          <hr className="divider" />

          <div className="alert alert-info">
            <span>ℹ️</span>
            <div>
              <strong>Astuce :</strong> En tant qu&apos;administrateur, vous pouvez modifier les arbitres
              de n&apos;importe quel match — même les matchs verrouillés (dans les 24h).
              Cliquez sur le nom de l&apos;arbitre dans le tableau pour le modifier.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
