'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, AppData } from '@/lib/types';
import AdminPanel from '@/components/AdminPanel';
import SignupModal from '@/components/SignupModal';
import Toast, { ToastItem } from '@/components/Toast';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.getDate(),
    month: MONTHS_FR[d.getMonth()].substring(0, 3).toUpperCase(),
    fullMonth: MONTHS_FR[d.getMonth()],
    year: d.getFullYear(),
    dayName: DAYS_FR[d.getDay()],
    monthIndex: d.getMonth(),
    monthYear: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
  };
}

function isLocked(match: Match) {
  const matchDateTime = new Date(`${match.date}T${match.heure}:00`);
  const now = new Date();
  const diffHours = (matchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

function isPast(match: Match) {
  const matchDateTime = new Date(`${match.date}T${match.heure}:00`);
  return matchDateTime < new Date();
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [signupModal, setSignupModal] = useState<{
    match: Match;
    slot: 'arbitre1' | 'arbitre2';
  } | null>(null);
  const [myName, setMyName] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'open' | 'upcoming'>('upcoming');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdated(new Date());
      }
    } catch {
      if (!silent) addToast('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling every 60s for real-time updates
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchData(true);
    }, 60000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // Load the saved theme. Light mode is used for first-time visitors.
  useEffect(() => {
    const savedTheme = localStorage.getItem('appslot_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('appslot_theme', theme);
  }, [theme]);

  // Load saved name
  useEffect(() => {
    const saved = localStorage.getItem('arbitre_name');
    if (saved) setMyName(saved);
  }, []);

  const handleSignup = async (
    nomArbitre: string,
    match: Match,
    slot: 'arbitre1' | 'arbitre2'
  ) => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          slot,
          nomArbitre,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        addToast(
          json.error || "Erreur lors de l'inscription",
          'error'
        );
        return;
      }

      // Mise à jour immédiate du match affiché, sans relire le Blob.
      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          matches: current.matches.map((item) =>
            item.id === json.data.id ? json.data : item
          ),
        };
      });

      setLastUpdated(new Date());

      // Mémoriser le nom pour les prochaines inscriptions
      localStorage.setItem('arbitre_name', nomArbitre);
      setMyName(nomArbitre);

      addToast(
        `✅ Inscription confirmée pour ${match.equipeDomicile} - ${match.equipeExterieur} !`,
        'success'
      );

      setSignupModal(null);
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      addToast('Erreur de connexion au serveur', 'error');
    }
  };


  const handleUnsubscribe = async (
    match: Match,
    slot: 'arbitre1' | 'arbitre2'
  ) => {
    const currentName = match[slot];

    if (!currentName) return;

    try {
      const res = await fetch('/api/signup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          slot,
          nomArbitre: currentName,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        addToast(
          json.error || 'Erreur lors de la désinscription',
          'error'
        );
        return;
      }

      // Mise à jour immédiate du match affiché, sans relire le Blob.
      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          matches: current.matches.map((item) =>
            item.id === json.data.id ? json.data : item
          ),
        };
      });

      setLastUpdated(new Date());

      addToast('Désinscription effectuée', 'info');
      setSignupModal(null);
    } catch (error) {
      console.error('Erreur lors de la désinscription :', error);
      addToast('Erreur de connexion au serveur', 'error');
    }
  };

  // Filtered and grouped matches
  const filteredMatches = data?.matches.filter((m) => {
    if (filterMode === 'upcoming') return !isPast(m);
    if (filterMode === 'open') {
      return !isPast(m) && !isLocked(m) && (!m.arbitre1 || !m.arbitre2);
    }
    return true;
  }) ?? [];

  // Group by month
  const groupedByMonth: Record<string, Match[]> = {};
  filteredMatches.forEach((m) => {
    const key = formatDate(m.date).monthYear;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(m);
  });

  // Stats
  const totalMatches = data?.matches.length ?? 0;
  const openSlots = data?.matches.filter((m) => !isPast(m) && !isLocked(m) && (!m.arbitre1 || !m.arbitre2)).length ?? 0;
  const fullMatches = data?.matches.filter((m) => m.arbitre1 && m.arbitre2).length ?? 0;
  const myMatches = data?.matches.filter((m) =>
    myName && (m.arbitre1?.toLowerCase() === myName.toLowerCase() ||
      m.arbitre2?.toLowerCase() === myName.toLowerCase())
  ).length ?? 0;

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🏒</div>
            <div className="logo-text">
              <div className="logo-title">Sensler Cup</div>
              <div className="logo-subtitle">Arbitres — Saison 2026-2027</div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm theme-toggle"
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              aria-label={`Activer le mode ${theme === 'light' ? 'sombre' : 'clair'}`}
              title={`Activer le mode ${theme === 'light' ? 'sombre' : 'clair'}`}
              id="btn-theme"
            >
              {theme === 'light' ? '☀️ Clair' : '🌙 Sombre'}
            </button>
            <span className="live-dot">En direct</span>
            <button
              className={`btn btn-sm ${adminLoggedIn ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setShowAdmin(!showAdmin)}
              id="btn-admin"
            >
              {adminLoggedIn ? '⚙️ Admin' : '🔒 Admin'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <span>🏒</span> Saison 2026-2027
          </div>
          <h1>Programme des Arbitres</h1>
          <p>
            Inscrivez-vous pour siffler les matchs de la Sensler Cup. Chaque match
            nécessite <strong>2 arbitres</strong>. Les inscriptions se clôturent
            automatiquement <strong>24h avant le match</strong>.
          </p>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-chip primary">
              <span className="value">{totalMatches}</span>
              <span className="label">matchs au programme</span>
            </div>
            <div className="stat-chip warning">
              <span className="value">{openSlots}</span>
              <span className="label">matchs à pourvoir</span>
            </div>
            <div className="stat-chip success">
              <span className="value">{fullMatches}</span>
              <span className="label">matchs complets</span>
            </div>
            {myName && (
              <div className="stat-chip accent">
                <span className="value">{myMatches}</span>
                <span className="label">mes matchs</span>
              </div>
            )}
          </div>
        </section>

        {/* Info about locking */}
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <span>🔒</span>
          <div>
            Les inscriptions sont automatiquement <strong>verrouillées 24h avant le coup de sifflet</strong>.
            {myName && <> Votre nom enregistré : <strong>{myName}</strong>.</>}
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <span className="filter-label">Afficher :</span>
          <button
            className={`filter-btn ${filterMode === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilterMode('upcoming')}
            id="filter-upcoming"
          >
            Prochains matchs
          </button>
          <button
            className={`filter-btn ${filterMode === 'open' ? 'active' : ''}`}
            onClick={() => setFilterMode('open')}
            id="filter-open"
          >
            Postes libres
          </button>
          <button
            className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
            id="filter-all"
          >
            Tout le programme
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchData(true)}
            style={{ marginLeft: 'auto' }}
            id="btn-refresh"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Matches */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <span>Chargement du programme...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>Aucun match trouvé</h3>
            <p>Changez le filtre ou revenez plus tard.</p>
          </div>
        ) : (
          <div className="matches-grid">
            {Object.entries(groupedByMonth).map(([monthYear, monthMatches]) => (
              <div key={monthYear}>
                <div className="month-separator">
                  <div className="month-line" />
                  <span className="month-label">📅 {monthYear}</span>
                  <div className="month-line" />
                </div>
                {monthMatches.map((match) => {
                  const locked = isLocked(match);
                  const past = isPast(match);
                  const full = !!(match.arbitre1 && match.arbitre2);
                  const { day, month, dayName } = formatDate(match.date);
                  const isMySlot1 = myName && match.arbitre1?.toLowerCase() === myName.toLowerCase();
                  const isMySlot2 = myName && match.arbitre2?.toLowerCase() === myName.toLowerCase();
                  const slotsTaken = (match.arbitre1 ? 1 : 0) + (match.arbitre2 ? 1 : 0);

                  return (
                    <div
                      key={match.id}
                      className={`match-card ${locked ? 'is-locked' : ''} ${past ? 'is-past' : ''} ${full ? 'is-full' : ''}`}
                    >
                      {/* Header */}
                      <div className="match-header">
                        <div className="match-meta">
                          <div className="match-date-badge">
                            <div className="day">{day}</div>
                            <div className="month">{dayName} {month}</div>
                          </div>
                          <div className="match-info-group">
                            <div className="match-time">
                              <span>🕐</span>
                              <span className="match-time-value">{match.heure}</span>
                            </div>
                            <div className="match-location">
                              <span>📍</span>
                              <span>{match.lieu}</span>
                            </div>
                          </div>
                        </div>
                        <div className="match-tags">
                          <span className="tag tag-categorie">{match.categorie}</span>
                          {past && <span className="tag tag-past">Terminé</span>}
                          {!past && locked && <span className="tag tag-locked">🔒 Verrouillé</span>}
                          {!past && !locked && full && <span className="tag tag-full">✅ Complet</span>}
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="match-teams">
                        <div className="team">
                          <div className="team-name">{match.equipeDomicile}</div>
                        </div>
                        <div className="vs-badge">VS</div>
                        <div className="team">
                          <div className="team-name">{match.equipeExterieur}</div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${(slotsTaken / 2) * 100}%` }} />
                      </div>

                      {/* Referee Slots */}
                      <div className="referee-slots">
                        {(['arbitre1', 'arbitre2'] as const).map((slot, i) => {
                          const name = match[slot];
                          const isMine = !!(myName && name?.toLowerCase() === myName.toLowerCase());
                          const canSignup = !past && !locked && !name;
                          const canUnsubscribe = !past && !locked && isMine;

                          return (
                            <div
                              key={slot}
                              className={`referee-slot ${name ? 'is-taken' : ''} ${isMine ? 'is-mine' : ''}`}
                            >
                              <div className="slot-header">
                                <span className={`slot-label ${name ? 'is-taken' : ''} ${isMine ? 'is-mine' : ''}`}>
                                  <span className="dot" />
                                  Arbitre {i + 1}
                                </span>
                              </div>
                              {name ? (
                                <div className="slot-name">
                                  {isMine ? '👤 ' : '🧑‍⚖️ '}{name}
                                  {isMine && <span style={{ color: 'var(--primary-light)', fontSize: '0.75rem', marginLeft: '4px' }}>(moi)</span>}
                                </div>
                              ) : (
                                <div className="slot-empty">Poste libre</div>
                              )}
                              <div className="slot-actions">
                                {canSignup && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSignupModal({ match, slot })}
                                    id={`btn-signup-${match.id}-${slot}`}
                                  >
                                    ✋ Je m&apos;inscris
                                  </button>
                                )}
                                {canUnsubscribe && (
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleUnsubscribe(match, slot)}
                                    id={`btn-unsub-${match.id}-${slot}`}
                                  >
                                    ✖ Se désinscrire
                                  </button>
                                )}
                                {!past && locked && !name && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    Inscription fermée
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {match.notes && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          📝 {match.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Admin Panel */}
        {showAdmin && (
          <AdminPanel
            data={data}
            isLoggedIn={adminLoggedIn}
            onLogin={() => setAdminLoggedIn(true)}
            onLogout={() => setAdminLoggedIn(false)}
            onDataChange={async () => await fetchData(true)}
            addToast={addToast}
          />
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '3rem 0 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          <div>🏒 Sensler Cup — Application Arbitres</div>
          <div style={{ marginTop: '0.25rem' }}>
            Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-CH')}
          </div>
        </footer>
      </main>

      {/* Signup Modal */}
      {signupModal && (
        <SignupModal
          match={signupModal.match}
          slot={signupModal.slot}
          defaultName={myName}
          onConfirm={handleSignup}
          onClose={() => setSignupModal(null)}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}
