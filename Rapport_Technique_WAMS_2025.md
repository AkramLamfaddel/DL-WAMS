# Rapport Technique — Projet WAMS 2025

## Pipeline Microservices Complet : VerifAI — Détection de Manipulation d'Images par Intelligence Artificielle

---

**Université :** UMBB, Faculté des Sciences, Département d'Informatique
**Formation :** Master 1 I2A/GL — Semestre 2
**Matière :** WAMS (Web Application & Microservices)
**Année universitaire :** 2024–2025

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Architecture générale](#2-architecture-générale)
3. [Services métier](#3-services-métier)
4. [Infrastructure technique](#4-infrastructure-technique)
5. [Interface utilisateur (UI/UX)](#5-interface-utilisateur-uiux)
6. [Communication asynchrone](#6-communication-asynchrone)
7. [Sécurité et authentification](#7-sécurité-et-authentification)
8. [Résilience et tolérance aux pannes](#8-résilience-et-tolérance-aux-pannes)
9. [Déploiement](#9-déploiement)
10. [Conformité aux exigences](#10-conformité-aux-exigences)
11. [Guide de déploiement](#11-guide-de-déploiement)
12. [Conclusion](#12-conclusion)

---

## 1. Contexte et objectifs

### 1.1 Problématique

La prolifération des outils de manipulation d'images (Photoshop, deepfakes, GANs) représente une menace croissante pour la confiance numérique. Les domaines du journalisme, de la justice, de l'assurance et des réseaux sociaux nécessitent des outils fiables pour distinguer les images authentiques des images altérées.

### 1.2 Solution proposée — VerifAI

**VerifAI** est une plateforme web de vérification d'authenticité d'images basée sur l'intelligence artificielle. Elle permet à un utilisateur de :

- **Téléverser** des images dans une galerie personnelle sécurisée
- **Analyser** automatiquement chaque image via un modèle d'IA de détection de deepfakes
- **Consulter** les résultats de vérification (Authentique / Modifié) avec un score de confiance
- **Organiser** ses images en albums, tags et favoris
- **Suivre** l'historique complet des actions via une piste d'audit

### 1.3 Utilisateurs cibles

| Rôle | Description | Accès |
|---|---|---|
| **Utilisateur standard** | Journaliste, chercheur, particulier | Gestion de ses images, analyse IA, consultation historique |
| **Administrateur** | Responsable de la plateforme | Gestion des utilisateurs, modification des rôles, supervision |

### 1.4 Justification du domaine

Le choix de la détection de manipulation d'images comme domaine applicatif est motivé par :
- **Pertinence sociétale** : lutte contre la désinformation visuelle
- **Richesse technique** : intégration IA, traitement d'images, flux asynchrones
- **Adéquation microservices** : séparation naturelle entre authentification, stockage, analyse IA et journalisation

---

## 2. Architecture générale

### 2.1 Vue d'ensemble

```
Internet (Port 80)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Traefik v2.11 — Reverse Proxy & Load Balancer               │
│  Dashboard : port 8080                                       │
└────┬──────────┬──────────┬──────────┬──────────┬────────────┘
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
  /api/auth  /gallery/  /api/      /api/hist   / (frontend)
  Auth Svc   Gallery    AI Svc     Historique  Next.js
  :8000      :8001      :8002      :8003       :3000
     │          │                      ▲
     │          ├──► RabbitMQ ─────────┘
     │          │    (wams.action_logs)
     │          │          │
     │          │    Historique Consumer
     │          │    (worker asynchrone)
     ▼          ▼          ▼
┌──────────────────────────────────────┐
│  Consul — Service Registry           │
│  Port 8500                           │
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  PostgreSQL 16 — 4 bases isolées     │
│  auth_db │ gallery_db │ ai_db │      │
│  historique_db                       │
└──────────────────────────────────────┘
```

### 2.2 Principes architecturaux

- **Isolation des données** : chaque microservice possède sa propre base de données PostgreSQL
- **Communication synchrone** : API REST via Traefik (routage par préfixe de chemin)
- **Communication asynchrone** : RabbitMQ pour la journalisation d'actions
- **Découverte de services** : Consul pour l'enregistrement et la résolution dynamique
- **Tolérance aux pannes** : chaque service peut tomber indépendamment sans affecter les autres

### 2.3 Services et ports

| Service | Port interne | Route Traefik | Priorité | Technologie |
|---|---|---|---|---|
| Auth Service | 8000 | `/api/auth/` | 30 | Django 5 + JWT |
| Gallery Service | 8001 | `/gallery/` | 20 | Django 5 |
| AI Service | 8002 | `/api/` | 10 | Django 5 + PyTorch |
| Historique Service | 8003 | `/api/history/` | 30 | Django 5 |
| Historique Consumer | — | (worker) | — | Python + pika |
| Frontend | 3000 | `/` | 1 | Next.js 15 |
| Traefik | 80 / 8080 | — | — | Traefik v2.11 |
| Consul | 8500 | — | — | Consul 1.19 |
| RabbitMQ | 5672 / 15672 | — | — | RabbitMQ 3.13 |
| PostgreSQL | 5432 | — | — | PostgreSQL 16 |

---

## 3. Services métier

### 3.1 Authentication Service (`auth-service`)

**Rôle :** Gestion des utilisateurs, authentification JWT et contrôle d'accès basé sur les rôles (RBAC).

**Modèle de données :**

```python
class User(AbstractUser):
    class Role(models.TextChoices):
        USER  = 'user',  'Standard User'
        ADMIN = 'admin', 'Administrator'
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
```

**Endpoints REST :**

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Inscription d'un nouvel utilisateur |
| POST | `/api/auth/login/` | Connexion → retourne un token JWT |
| GET | `/api/auth/health/` | Health check pour Consul/Traefik |
| GET | `/api/auth/users/` | Liste des utilisateurs (admin uniquement) |
| PATCH | `/api/auth/users/{id}/role/` | Modifier le rôle d'un utilisateur (admin) |

**Payload JWT :**
```json
{
  "user_id": 1,
  "username": "hicham",
  "email": "hicham@verifai.com",
  "role": "user",
  "exp": 1719849600,
  "iat": 1719763200
}
```

### 3.2 GalleryImage Service (`gallery-service`)

**Rôle :** Gestion CRUD complète des images, albums, tags et favoris. Orchestre la vérification IA et publie les événements vers RabbitMQ.

**Modèle de données principal :**

```python
class Image(models.Model):
    title = models.CharField(max_length=255)
    image_file = models.ImageField(upload_to='gallery/images/%Y/%m/%d/')
    thumbnail = models.ImageField(...)
    user_id = models.IntegerField(db_index=True)
    album = models.ForeignKey(Album, ...)
    tags = models.ManyToManyField(Tag, ...)
    is_favorite = models.BooleanField(default=False)
    verification_status = models.CharField(choices=VerificationStatus.choices)
    ai_confidence_score = models.FloatField(null=True)
    ai_report = models.JSONField(null=True)
    original_filename = models.CharField(max_length=500)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
```

**Endpoints REST :**

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/gallery/api/images/` | Lister les images de l'utilisateur |
| POST | `/gallery/api/images/` | Téléverser une image (multipart) |
| DELETE | `/gallery/api/images/{id}/` | Supprimer une image |
| POST | `/gallery/api/images/{id}/verify/` | Lancer la vérification IA |
| POST | `/gallery/api/images/{id}/favorite/` | Basculer le statut favori |
| GET | `/gallery/api/albums/` | Lister les albums |
| POST | `/gallery/api/albums/` | Créer un album |
| GET | `/gallery/api/tags/` | Lister les tags |
| GET | `/gallery/api/stats/` | Statistiques (total, pending, edited, unedited) |
| POST | `/gallery/api/warmup/` | Amorcer le cache d'authentification |
| GET | `/gallery/api/health/` | Health check |

### 3.3 AI Service (`ai-service`)

**Rôle :** Détection de manipulation d'images par réseau de neurones profond.

**Endpoints REST :**

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/` | Analyser une image (retourne verdict + confiance) |
| GET | `/api/status/` | État du modèle IA |
| GET | `/api/health/` | Health check |

**Réponse type :**
```json
{
  "is_modified": true,
  "confidence": 87.3,
  "model": "Neural Deep Analysis",
  "processing_time": "1.2s"
}
```

### 3.4 Historique Service (`historique-service`)

**Rôle :** Piste d'audit — enregistre chaque action significative des utilisateurs.

**Modèle de données :**

```python
class ActionLog(models.Model):
    class ActionType(models.TextChoices):
        IMAGE_UPLOADED = 'image_uploaded'
        IMAGE_DELETED  = 'image_deleted'
        IMAGE_VERIFIED = 'image_verified'
        USER_LOGIN     = 'user_login'
        USER_REGISTERED = 'user_registered'
    user_id = models.IntegerField(db_index=True)
    action = models.CharField(max_length=50, choices=ActionType.choices)
    details = models.JSONField(default=dict)
    service = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
```

**Endpoints REST :**

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/history/log/` | Enregistrer une action (appelé par les services) |
| GET | `/api/history/logs/` | Consulter les logs (filtres: user, action, service) |
| GET | `/api/history/stats/` | Statistiques agrégées par type d'action |
| GET | `/api/history/health/` | Health check |

---

## 4. Infrastructure technique

### 4.1 Traefik — Reverse Proxy & Load Balancer

**Configuration** (`traefik/traefik.yml`) :
```yaml
api:
  dashboard: true
  insecure: true
entryPoints:
  web:
    address: ":80"
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: wams-net
```

Le routage est défini via des labels Docker dans `docker-compose.yml`. Traefik découvre automatiquement les conteneurs et les route selon le préfixe de chemin (PathPrefix) avec un système de priorités pour éviter les conflits.

### 4.2 Consul — Service Registry & Discovery

Chaque microservice s'enregistre auprès de Consul au démarrage via `consul_client.py` :

```python
def register_service():
    c = consul.Consul(host=CONSUL_HOST, port=CONSUL_PORT)
    c.agent.service.register(
        name=SERVICE_NAME,
        service_id=f"{SERVICE_NAME}-{SERVICE_HOST}",
        address=SERVICE_HOST,
        port=int(SERVICE_PORT),
        check=consul.Check.http(
            f"http://{SERVICE_HOST}:{SERVICE_PORT}/api/health/",
            interval="10s", timeout="5s"
        ),
    )
```

La résolution de service permet à Gallery de découvrir dynamiquement l'URL de Auth ou AI sans configuration statique.

### 4.3 PostgreSQL — Bases de données isolées

Une instance PostgreSQL unique héberge 4 bases de données isolées :

```sql
-- init-multiple-db.sql
CREATE DATABASE gallery_db;
CREATE DATABASE ai_db;
CREATE DATABASE historique_db;
-- auth_db créée par POSTGRES_DB
```

| Base | Service | Tables principales |
|---|---|---|
| `auth_db` | Auth Service | `users` (AbstractUser + role) |
| `gallery_db` | Gallery Service | `image`, `album`, `tag`, `imageverification` |
| `ai_db` | AI Service | Résultats d'analyse |
| `historique_db` | Historique Service | `actionlog` |

---

## 5. Interface utilisateur (UI/UX)

### 5.1 Technologies

- **Framework :** Next.js 15 (React 19)
- **Style :** CSS personnalisé avec design system glassmorphism
- **Icônes :** Lucide React
- **Build :** Production optimisée, servie via Traefik

### 5.2 Pages de l'application

| Page | Route | Fonctionnalité |
|---|---|---|
| **Login / Register** | `/login`, `/register` | Authentification JWT |
| **Gallery (Dashboard)** | `/dashboard` | Galerie d'images, statistiques, statut services |
| **Albums** | `/dashboard/albums` | Organisation en albums |
| **Favoris** | `/dashboard/favorites` | Images marquées comme favorites |
| **Analyze** | `/dashboard/analyze` | Upload & vérification IA + Quick Scan |
| **History** | `/dashboard/history` | Piste d'audit + historique de vérifications |

### 5.3 Fonctionnalités clés du frontend

- **Monitoring temps réel** : polling santé toutes les 8 secondes avec indicateurs vert/rouge
- **Auto-recovery** : rechargement automatique des données à la reprise d'un service
- **Quick Scan** : analyse IA directe sans sauvegarde en galerie (fonctionne même si Gallery est hors ligne)
- **Recherche et filtres** : recherche par nom, filtrage par statut de vérification

---

## 6. Communication asynchrone

### 6.1 Architecture RabbitMQ

```
GalleryImage_Service                    Historique_Service
       │                                       ▲
       │  publish_action_log()                  │
       ▼                                        │
   ┌───────────────────────────┐                │
   │  RabbitMQ                 │                │
   │  Queue: wams.action_logs  │──► Consumer ───┘
   │  Durable: oui             │    (conteneur dédié)
   │  Persistent: oui          │
   └───────────────────────────┘
```

### 6.2 Publication (Gallery → RabbitMQ)

```python
# messaging.py
def publish_action_log(user_id, action, details=None):
    message = {
        'user_id': user_id,
        'action':  action,
        'details': details or {},
        'service': 'GalleryImage_Service',
    }
    channel.basic_publish(
        exchange='',
        routing_key='wams.action_logs',
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=pika.DeliveryMode.Persistent,
        ),
    )
```

### 6.3 Consommation (Consumer → PostgreSQL)

Le `historique-consumer` est un conteneur dédié qui écoute la queue en boucle :

```python
# consumer.py
def _process_message(channel, method, properties, body):
    data = json.loads(body)
    ActionLog.objects.create(
        user_id=data.get('user_id'),
        action=data.get('action', 'other'),
        details=data.get('details', {}),
        service=data.get('service', 'unknown'),
    )
    channel.basic_ack(delivery_tag=method.delivery_tag)
```

### 6.4 Mécanisme de fallback

Si RabbitMQ est indisponible, le `HistoriqueService` bascule automatiquement sur un appel HTTP direct vers `/api/history/log/`. Ceci assure que les logs ne sont jamais perdus.

---

## 7. Sécurité et authentification

### 7.1 Flux d'authentification

```
Utilisateur → POST /api/auth/login/ → Auth Service → JWT Token
                                                          │
Utilisateur → GET /gallery/api/images/                    │
              Header: Authorization: Bearer <token> ──────┘
                                          │
                              Gallery Service
                              (valide le JWT via Auth)
```

### 7.2 RBAC (Role-Based Access Control)

| Permission | User | Admin |
|---|---|---|
| Gérer ses propres images | ✅ | ✅ |
| Analyser avec l'IA | ✅ | ✅ |
| Voir l'historique personnel | ✅ | ✅ |
| Lister tous les utilisateurs | ❌ | ✅ |
| Modifier les rôles | ❌ | ✅ |

### 7.3 Mesures de sécurité

- **JWT partagé** : secret commun entre tous les services (`JWT_SECRET`)
- **Cache: no-store** : empêche le navigateur de mettre en cache les réponses API échouées
- **CSRF exempt** : les API REST utilisent l'authentification par token (pas de cookies)
- **Isolation réseau** : tous les services sur un réseau Docker privé (`wams-net`)

---

## 8. Résilience et tolérance aux pannes

### 8.1 Auto-détection et récupération

Le frontend implémente un mécanisme de **self-healing** :

1. **Polling santé** : toutes les 8 secondes, le dashboard interroge `/health/` de chaque service
2. **Détection de panne** : si Gallery tombe, les données sont effacées instantanément (pas besoin de rafraîchir)
3. **Récupération automatique** : dès que Gallery redevient sain, les données sont rechargées automatiquement
4. **Mutex** : un verrou empêche les chargements concurrents qui pourraient saturer les connexions

### 8.2 Indépendance des services

| Scénario de panne | Impact |
|---|---|
| Gallery hors ligne | Quick Scan fonctionne toujours, Auth et History restent verts |
| AI hors ligne | Upload et galerie fonctionnent, seule la vérification est indisponible |
| RabbitMQ hors ligne | Fallback HTTP automatique pour les logs |
| Consul hors ligne | Les services utilisent les URLs de fallback (variables d'environnement) |

---

## 9. Déploiement

### 9.1 Conteneurisation

Chaque microservice est encapsulé dans son propre conteneur Docker :

```
wams-traefik          → Reverse Proxy (Traefik v2.11)
wams-consul           → Service Registry (Consul 1.19)
wams-rabbitmq         → Message Broker (RabbitMQ 3.13)
wams-postgres         → Base de données (PostgreSQL 16)
wams-auth             → Authentication Service (Django 5)
wams-gallery          → GalleryImage Service (Django 5)
wams-ai               → AI Service (Django 5 + PyTorch)
wams-historique       → Historique Service API (Django 5)
wams-historique-consumer → Worker RabbitMQ (Python)
wams-frontend         → Interface Web (Next.js 15)
```

### 9.2 Orchestration Docker Compose

Le fichier `docker-compose.yml` définit les 10 services avec :
- **Dépendances** : `depends_on` avec health checks (`service_healthy`)
- **Volumes persistants** : `postgres-data` (données DB), `gallery-media` (images)
- **Réseau privé** : `wams-net` (bridge)
- **Redémarrage automatique** : `restart: unless-stopped`

### 9.3 Déploiement multi-serveurs

Chaque conteneur tourne sur son propre serveur virtuel Docker, satisfaisant l'exigence §2.7 du cahier des charges. La preuve est obtenue via :

```bash
$ docker compose ps
NAME                      STATUS
wams-traefik              Up
wams-consul               Up
wams-rabbitmq             Up (healthy)
wams-postgres             Up (healthy)
wams-auth                 Up
wams-gallery              Up
wams-ai                   Up
wams-historique           Up
wams-historique-consumer  Up
wams-frontend             Up
```

---

## 10. Conformité aux exigences

| # | Exigence (PDF §2) | Solution implémentée | Statut |
|---|---|---|---|
| 2.1 | Application REST métier | Gallery Service — CRUD Images, Albums, Tags, Favoris, Vérification IA | ✅ |
| 2.2 | Service d'authentification | Auth Service — JWT avec rôles (user/admin) + RBAC | ✅ |
| 2.3 | Application UI/UX | Frontend Next.js — 6 pages, design glassmorphism, monitoring temps réel | ✅ |
| 2.4 | Communication asynchrone | RabbitMQ — queue durable `wams.action_logs` + consumer dédié + fallback HTTP | ✅ |
| 2.5 | Service Registry/Discovery | Consul — enregistrement automatique + résolution dynamique | ✅ |
| 2.6 | Reverse Proxy / Load Balancer | Traefik v2 — routage PathPrefix, dashboard UI, découverte Docker | ✅ |
| 2.7 | Déploiement multi-serveurs | Docker Compose — 10 conteneurs isolés sur réseau privé | ✅ |

---

## 11. Guide de déploiement

### Prérequis
- Docker Desktop ≥ 4.x
- Docker Compose ≥ 2.x

### Lancement

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd AI_Projects

# 2. Vérifier la configuration (.env)
cat .env  # Mots de passe, secrets JWT, etc.

# 3. Construire et lancer
docker compose up --build

# 4. Vérifier (attendre ~3-5 min pour le premier démarrage)
docker compose ps
```

### Interfaces

| Interface | URL |
|---|---|
| Application principale | http://localhost |
| Traefik Dashboard | http://localhost:8080 |
| Consul UI | http://localhost:8500 |
| RabbitMQ Management | http://localhost:15672 |

---

## 12. Conclusion

Le projet **VerifAI** implémente l'intégralité des contraintes techniques du cahier des charges WAMS 2025. L'architecture microservices assure une séparation claire des responsabilités, une tolérance aux pannes élevée et une extensibilité naturelle.

Les points forts de l'implémentation :

- **4 microservices Django** indépendants avec bases de données isolées
- **Communication asynchrone** via RabbitMQ avec fallback HTTP automatique
- **Découverte de services** via Consul avec résolution dynamique
- **Reverse proxy** Traefik avec routage dynamique par labels Docker
- **Interface utilisateur** moderne et réactive avec récupération automatique
- **Intelligence artificielle** intégrée pour la détection de manipulations
- **Déploiement conteneurisé** avec 10 services sur Docker Compose

---

*Rapport généré le 29 avril 2026 — Projet WAMS 2025*
