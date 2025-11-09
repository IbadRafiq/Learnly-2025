# LEARNLY Setup Guide

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js 18+** (for local development)
3. **Python 3.11+** (for local development)
4. **Ollama** (will be installed via Docker)

## Quick Start with Docker

### 1. Clone and Setup Environment

```bash
cd Learnly
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL=postgresql://learnly_user:learnly_password@postgres:5432/learnly_db

# JWT (IMPORTANT: Change this!)
JWT_SECRET=your-unique-secret-key-minimum-32-characters-long

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Ollama LLM server (port 11434)
- FastAPI backend (port 8000)
- React frontend (port 3000)

### 4. Pull Ollama Models (First Time Only)

```bash
# Pull Llama 3.2 model
docker exec -it learnly_ollama ollama pull llama3.2

# Pull embedding model
docker exec -it learnly_ollama ollama pull nomic-embed-text
```

This may take 10-20 minutes depending on your internet connection.

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 6. Create Your First Account

1. Go to http://localhost:3000/signup
2. Choose your role (Admin/Teacher/Student)
3. Fill in your details
4. Start exploring!

## Local Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (if using Alembic)
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback`
   - `http://localhost:3000`
6. Copy **Client ID** and **Client Secret** to `.env`

## Database Migrations (Optional)

If you need to modify database schema:

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## Troubleshooting

### Ollama Models Not Loading

```bash
# Check Ollama container logs
docker logs learnly_ollama

# Restart Ollama service
docker-compose restart ollama

# Pull models again
docker exec -it learnly_ollama ollama pull llama3.2
docker exec -it learnly_ollama ollama pull nomic-embed-text
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker logs learnly_postgres

# Verify database is running
docker-compose ps

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port Already in Use

Edit `docker-compose.yml` to change ports:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change 3001 to available port
  backend:
    ports:
      - "8001:8000"  # Change 8001 to available port
```

### Frontend Build Issues

```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## Testing the Platform

### 1. Create Test Data

**As Admin:**
1. Create courses
2. Assign teachers to courses
3. Configure moderation settings

**As Teacher:**
1. Upload course materials (PDF/DOCX/TXT)
2. Generate quizzes using AI
3. Monitor student progress

**As Student:**
1. Enroll in courses
2. Chat with AI Co-Instructor
3. Take quizzes
4. Track progress

### 2. Upload Sample Course Material

1. Login as Teacher
2. Go to "My Courses"
3. Select a course
4. Upload a PDF or text file
5. Wait for vector embedding to complete

### 3. Test AI Chat

1. Navigate to AI Co-Instructor page
2. Ask questions about uploaded materials
3. Verify AI responses include sources

### 4. Generate and Take Quiz

1. Teacher: Generate quiz from course materials
2. Student: Take the generated quiz
3. View results and analytics

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
# Strong secret key
JWT_SECRET=<generate-strong-32-char-key>

# Production database
DATABASE_URL=postgresql://user:pass@production-db:5432/learnly

# HTTPS redirect URIs
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Azure Deployment (Optional)

1. **Backend**: Deploy to Azure App Service
2. **Frontend**: Deploy to Azure Static Web Apps
3. **Database**: Use Azure Database for PostgreSQL
4. **Ollama**: Deploy on Azure Container Instances

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Backup database regularly

## Support

For issues or questions:
- Check documentation at `/docs`
- Review API docs at `/redoc`
- Open an issue on GitHub

## License

MIT License - See LICENSE file for details
