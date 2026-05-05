# WAMS 2025 — Pipeline Microservices Complet

Détection de manipulation d'images par IA, basée sur une architecture microservices complète avec RabbitMQ, Consul, Traefik et PostgreSQL.

---

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  Traefik (port 80)  ──  Dashboard (port 8080)        │
│  Reverse Proxy + Load Balancer                       │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  /api/auth/  /gallery/  /api/hist.  /api/ (AI)   /  (Frontend)
  Auth Svc    Gallery    Historique  AI Service    React/nginx
  :8000       :8001      :8003       :8002         :80
       │          │
       └──────────┴──► RabbitMQ (wams.action_logs queue)
                              │
                        Historique Consumer
                        (persiste en DB)
       │
       ▼
  Consul (port 8500)
  Service Registry & Discovery
       │
       ▼
  PostgreSQL (port 5432)
  4 bases séparées: auth_db, gallery_db, ai_db, historique_db
```

### Services et ports

| Service               | Port interne | Route Traefik      | Priorité |
|-----------------------|--------------|--------------------|----------|
| auth-service          | 8000         | `/api/auth/`       | 30       |
| gallery-service       | 8001         | `/gallery/`        | 20       |
| ai-service            | 8002         | `/api/`            | 10       |
| historique-service    | 8003         | `/api/history/`    | 30       |
| historique-consumer   | —            | (worker RabbitMQ)  | —        |
| frontend (nginx)      | 80           | `/`                | 1        |
| Traefik               | 80 / 8080    | —                  | —        |
| Consul                | 8500         | —                  | —        |
| RabbitMQ              | 5672 / 15672 | —                  | —        |
| PostgreSQL            | 5432         | —                  | —        |

---

## Contraintes techniques satisfaites (PDF §2)

| # | Exigence | Solution implémentée |
|---|---|---|
| 2.1 | Application REST métier | `GalleryImage_Service` — CRUD Images, Albums, Tags, Favoris |
| 2.2 | Auth JWT + rôles/permissions | `Authentication_Service` — JWT avec champ `role` (user/admin) |
| 2.3 | Application UI/UX | `frontend/` — React + Vite + nginx |
| 2.4 | Communication asynchrone | **RabbitMQ** — queue `wams.action_logs`, consumer dédié |
| 2.5 | Service Registry/Discovery | **Consul** — enregistrement automatique au démarrage |
| 2.6 | Reverse Proxy / Load Balancer | **Traefik v2** — routage par path prefix, dashboard UI |
| 2.7 | Déploiement multi-serveurs | **Docker** — chaque microservice dans son propre conteneur |

---

## Déploiement rapide

### Prérequis
- Docker Desktop ≥ 4.x
- Docker Compose ≥ 2.x

### 1. Cloner et configurer

```bash
git clone <repo-url>
cd AI_Projects

# Réviser le fichier .env si nécessaire (mots de passe, secrets JWT, etc.)
# Le fichier est déjà pré-rempli avec des valeurs sécurisées.
```

### 2. Lancer toute l'infrastructure

```bash
docker compose up --build
```

> Le premier démarrage prend ~3-5 minutes (build des images + téléchargement de RabbitMQ, Consul, PostgreSQL).

### 3. Vérifier que tout tourne

```bash
docker compose ps
```

Tous les services doivent afficher `Up`.

### 4. Accéder aux interfaces

| Interface | URL |
|---|---|
| **Application principale** | http://localhost |
| **Traefik Dashboard** | http://localhost:8080 |
| **Consul UI** | http://localhost:8500 |
| **RabbitMQ Management** | http://localhost:15672 (wams_rabbit / rabbit_secure_2026) |

---

## Développement local (sans Docker)

```bash
# Terminal 1 — Auth
cd Authentication_Service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000

# Terminal 2 — Gallery
cd GalleryImage_Service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001

# Terminal 3 — AI
cd smart_preprocessing_service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002

# Terminal 4 — Historique (API)
cd Historique_Service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8003

# Terminal 5 — Historique Consumer (RabbitMQ doit tourner)
cd Historique_Service
python manage.py run_consumer

# Terminal 6 — Frontend
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxy Vite vers les services)
```

---

## Flux asynchrone RabbitMQ

```
GalleryImage_Service  ──► publish_action_log() ──► Queue: wams.action_logs
                                                           │
                                              Historique Consumer
                                              (historique-consumer container)
                                                           │
                                                  ActionLog.objects.create()
                                                           │
                                                    PostgreSQL (historique_db)
```

**Fallback automatique :** Si RabbitMQ est indisponible, `HistoriqueService.log_action()` bascule automatiquement sur un appel HTTP direct vers le service Historique.

---

## Système de rôles (RBAC)

| Rôle | Accès |
|---|---|
| `user` | Gestion de ses propres images, albums, tags |
| `admin` | + Liste tous les utilisateurs (`GET /api/auth/users/`) + Modifier les rôles (`PATCH /api/auth/users/{id}/role/`) |

Le rôle est inclus dans le payload JWT : `{ user_id, username, email, role, exp, iat }`.

---

## Arrêt et nettoyage

```bash
# Arrêter
docker compose down

# Arrêter + supprimer les volumes (données)
docker compose down -v
```
