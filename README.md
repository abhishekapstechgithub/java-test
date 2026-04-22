# Task Manager — Full Stack CI/CD Project

A complete reference project: **Spring Boot** backend + **React** frontend, both
containerized with **Docker**, and automated end-to-end with a **Jenkins CI/CD pipeline**.

---

## Project structure

```
taskmanager/
├── backend/
│   ├── src/
│   │   ├── main/java/com/taskmanager/
│   │   │   ├── TaskManagerApplication.java
│   │   │   ├── controller/TaskController.java
│   │   │   ├── model/Task.java
│   │   │   ├── repository/TaskRepository.java
│   │   │   └── service/TaskService.java
│   │   └── resources/
│   │       ├── application.properties       ← MySQL config
│   │       └── application-test.properties  ← H2 config for tests
│   ├── Dockerfile                           ← Multi-stage Maven → JRE
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── api/taskApi.js
│   │   └── components/
│   │       ├── TaskCard.js
│   │       └── TaskForm.js
│   ├── Dockerfile                           ← Multi-stage Node → Nginx
│   └── nginx.conf                           ← Proxies /api to backend
├── docker-compose.yml                       ← Runs all 3 containers
├── Jenkinsfile                              ← Full CI/CD pipeline
└── .env.example                             ← Environment variable template
```

---

## How the CI/CD pipeline works (step by step)

```
Developer → git push → GitHub → Webhook → Jenkins
                                              │
                              ┌───────────────▼────────────────┐
                              │         Jenkins pipeline        │
                              │                                 │
                              │  1. Checkout  (clone repo)      │
                              │  2. mvn test  (JUnit + H2)      │
                              │  3. docker build (parallel)     │
                              │  4. docker push (Docker Hub)    │
                              │  5. SSH deploy (compose up)     │
                              │  6. Smoke test (/health)        │
                              └─────────────────────────────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │       Production server         │
                              │  frontend :3000  (Nginx)        │
                              │  backend  :8080  (Spring Boot)  │
                              │  mysql    :3306  (MySQL 8)      │
                              └─────────────────────────────────┘
```

### What each stage does

| Stage | What happens | Fails if… |
|---|---|---|
| Checkout | Jenkins clones the repo | GitHub unreachable |
| Build & Test | `mvn clean install`, runs JUnit tests against H2 | Any test fails |
| Docker Build | Builds backend + frontend images in parallel | Dockerfile error |
| Push | Pushes tagged images to Docker Hub | Bad credentials |
| Deploy | SSHes into server, runs `docker compose up -d` | SSH fails or containers crash |
| Smoke Test | `curl` the `/health` endpoint | Backend not responding |

---

## Local development (without Jenkins)

### Prerequisites
- Docker Desktop
- Java 17, Maven (for backend dev)
- Node 18 (for frontend dev)

### 1. Clone and configure

```bash
git clone https://github.com/youruser/taskmanager.git
cd taskmanager
cp .env.example .env
# Edit .env with your values
```

### 2. Run everything with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| Spring Boot API | http://localhost:8080/api/tasks |
| Health check | http://localhost:8080/api/tasks/health |

### 3. Run backend tests only

```bash
cd backend
mvn test
```

---

## Setting up Jenkins

### Install Jenkins (Ubuntu)

```bash
# Install Java
sudo apt install -y openjdk-17-jdk

# Add Jenkins repo
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install -y jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Jenkins runs on http://your-server:8080
```

### Install required Jenkins plugins

Go to **Manage Jenkins → Plugins → Available** and install:
- Pipeline
- Git
- GitHub Integration
- Docker Pipeline
- SSH Agent
- JUnit

### Add credentials to Jenkins

Go to **Manage Jenkins → Credentials → System → Global credentials**:

| ID (used in Jenkinsfile) | Kind | What to put |
|---|---|---|
| `dockerhub-credentials` | Username with password | Docker Hub username + password |
| `deploy-server-ssh` | SSH Username with private key | Your server's SSH private key |

### Create the pipeline job

1. Click **New Item** → name it `taskmanager` → choose **Pipeline**
2. Under **Pipeline**, select **Pipeline script from SCM**
3. SCM: **Git**, Repository URL: your GitHub repo URL
4. Script Path: `Jenkinsfile`
5. Save

### Configure GitHub Webhook

In your GitHub repo: **Settings → Webhooks → Add webhook**
- Payload URL: `http://your-jenkins-server:8080/github-webhook/`
- Content type: `application/json`
- Trigger: **Just the push event**

Now every `git push` to main automatically triggers Jenkins.

---

## API endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/{id}` | Get one task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tasks/status/{status}` | Filter by status |
| GET | `/api/tasks/health` | Health check |

### Example request

```bash
# Create a task
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Set up Jenkins","description":"Configure pipeline","status":"TODO"}'
```

---

## Key concepts explained

### Why multi-stage Docker builds?
The backend Dockerfile has two `FROM` stages. Stage 1 uses the full Maven image
to compile and package. Stage 2 uses only the slim JRE to run the JAR. This keeps
the final image small (~200MB instead of ~800MB).

### Why H2 for tests?
Tests in Jenkins use `application-test.properties`, which points to an in-memory
H2 database. This means tests run instantly without needing a real MySQL container
in the pipeline.

### Why tag images with the Git commit SHA?
Each image gets tagged with both `latest` and the 7-character commit SHA (e.g.
`a3f9c12`). This means you can always roll back: `docker compose up -d` with
`IMAGE_TAG=a3f9c12` brings back exactly that version.

### How does React talk to the backend?
In development, `package.json` has `"proxy": "http://backend:8080"`. In production,
Nginx handles this — any request to `/api/` is proxied to the `backend` container.
The React app never needs to know the backend's IP address.
