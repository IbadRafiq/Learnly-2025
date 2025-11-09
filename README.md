# LEARNLY - Virtual AI Co-Instructor Platform

<div align="center">

![LEARNLY](https://img.shields.io/badge/LEARNLY-AI%20Learning%20Platform-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Ollama](https://img.shields.io/badge/Ollama-Llama%203.2-orange)

</div>

## 🎯 Overview

LEARNLY is a cutting-edge Virtual AI Co-Instructor system for personalized, adaptive learning. Built with Retrieval-Augmented Generation (RAG), Outcome-Based Education (OBE), and content moderation for ethical AI use.

## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Google OAuth2 integration
- Role-based access control (Admin, Teacher, Student)

### 👑 Admin Dashboard
- User management
- Course creation and assignment
- Content moderation controls
- System analytics

### 🧑‍🏫 Teacher Dashboard
- Course material management
- AI Co-Instructor for course-specific queries
- Adaptive quiz generation
- Student analytics

### 🎓 Student Dashboard
- Interactive AI Co-Instructor
- Adaptive learning quizzes
- Progress tracking
- Performance analytics

### 🧠 AI Features
- RAG-powered responses using Llama 3.2
- nomic-embed-text embeddings
- FAISS vector storage
- Adaptive quiz generation
- Content moderation

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Framer Motion
- Recharts
- Zustand (State Management)
- Axios

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- JWT Authentication

### AI/ML
- Ollama (Llama 3.2)
- nomic-embed-text
- FAISS
- LangChain

### Deployment
- Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Learnly
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Pull Ollama models** (first time only)
```bash
docker exec -it learnly_ollama ollama pull llama3.2
docker exec -it learnly_ollama ollama pull nomic-embed-text
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 Local Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🗄️ Database Migrations

```bash
cd backend
alembic upgrade head
```

## 📊 Default Roles

After initial setup, you can create users with these roles:
- **Admin**: Full system access
- **Teacher**: Course management and student monitoring
- **Student**: Learning and quiz participation

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
6. Update `.env` with your credentials

## 📖 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🏗️ Project Structure

```
Learnly/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── courses.py
│   │   │   ├── quiz.py
│   │   │   ├── analytics.py
│   │   │   └── rag.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── rag_service.py
│   │   │   ├── quiz_service.py
│   │   │   └── moderation_service.py
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Azure Deployment (Optional)
- Backend: Azure App Service
- Frontend: Azure Static Web Apps
- Database: Azure Database for PostgreSQL

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@learnly.com or open an issue in the repository.

## 🙏 Acknowledgments

- Ollama for local LLM hosting
- FastAPI for the amazing web framework
- React team for the frontend framework
- All open-source contributors

---

Built with ❤️ by the LEARNLY Team
