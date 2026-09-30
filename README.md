# Sensler Cup - Application Arbitres

Application web pour la gestion des inscriptions d'arbitres à la Sensler Cup.

## Fonctionnalités

- 📅 **Programme complet** de la saison avec tous les matchs
- ✋ **Inscription des arbitres** (2 par match)
- 🔒 **Verrouillage automatique** 24h avant chaque match
- 👑 **Panel admin** protégé par mot de passe pour gérer tout
- 🔄 **Mise à jour en temps réel** (polling toutes les 30 secondes)
- 💾 **Stockage via Vercel Blob** (fichier JSON, pas de base de données)

## Déploiement sur Vercel

### Étape 1 : Créer un dépôt Git
```bash
git init
git add .
git commit -m "Initial commit - Sensler Cup Arbitres"
```

### Étape 2 : Pousser sur GitHub
```bash
gh repo create sensler-cup-arbitres --public
git push origin main
```

### Étape 3 : Déployer sur Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Importer le dépôt GitHub
3. Ajouter le stockage Blob : **Storage → Create Blob Store**
4. Connecter le Blob Store au projet

### Variables d'environnement
La seule variable nécessaire est ajoutée automatiquement par Vercel Blob :
- `BLOB_READ_WRITE_TOKEN` — Ajouté automatiquement lors de la connexion du Blob Store

## Développement local

```bash
npm install
npm run dev
```

En mode local (sans `BLOB_READ_WRITE_TOKEN`), les données sont stockées en mémoire et réinitialisées à chaque redémarrage.

## Mot de passe admin par défaut
```
SenslerCup2025!
```
⚠️ **Changez ce mot de passe** via le panel admin dès le premier déploiement !

## Structure du projet
```
├── app/
│   ├── api/
│   │   ├── matches/route.ts   # GET - Programme des matchs
│   │   ├── signup/route.ts    # POST/DELETE - Inscription/désinscription
│   │   └── admin/route.ts     # POST - Actions admin
│   ├── globals.css            # Styles globaux
│   ├── layout.tsx             # Layout racine
│   └── page.tsx               # Page principale
├── components/
│   ├── AdminPanel.tsx         # Panel administrateur
│   ├── SignupModal.tsx        # Modal d'inscription
│   └── Toast.tsx              # Notifications
└── lib/
    ├── data.ts                # Couche données (Vercel Blob)
    └── types.ts               # Types TypeScript
```
