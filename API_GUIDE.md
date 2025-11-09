# LEARNLY API Guide

## Base URL
```
http://localhost:8000
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Obtain Tokens

**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Create new account | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/google` | Google OAuth login | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Users (`/users`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/users/` | Get all users | Admin |
| GET | `/users/{id}` | Get user by ID | Admin/Self |
| PATCH | `/users/{id}/activate` | Activate user | Admin |
| PATCH | `/users/{id}/deactivate` | Deactivate user | Admin |
| DELETE | `/users/{id}` | Delete user | Admin |
| GET | `/users/stats/count` | Get user statistics | Admin |

### Courses (`/courses`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/courses/` | Create course | Admin |
| GET | `/courses/` | Get all courses | All |
| GET | `/courses/{id}` | Get course by ID | All |
| PATCH | `/courses/{id}` | Update course | Admin |
| DELETE | `/courses/{id}` | Delete course | Admin |
| POST | `/courses/{id}/materials` | Upload material | Teacher/Admin |
| POST | `/courses/enroll` | Enroll in course | Student/Admin |
| GET | `/courses/{id}/students` | Get course students | Teacher/Admin |

### Quiz (`/quiz`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/quiz/generate` | Generate AI quiz | Teacher/Admin |
| POST | `/quiz/` | Create quiz | Teacher/Admin |
| GET | `/quiz/course/{id}` | Get course quizzes | All |
| GET | `/quiz/{id}` | Get quiz by ID | All |
| POST | `/quiz/attempt` | Submit quiz attempt | Student |
| GET | `/quiz/attempts/my` | Get my attempts | Student |
| GET | `/quiz/attempts/student/{id}` | Get student attempts | Teacher/Admin |

### RAG (`/rag`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/rag/query` | Query AI Co-Instructor | All |
| GET | `/rag/health` | Check RAG health | All |

### Analytics (`/analytics`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/analytics/user/{id}` | Get user analytics | Teacher/Admin/Self |
| GET | `/analytics/course/{id}` | Get course analytics | Teacher/Admin |
| GET | `/analytics/system` | Get system analytics | Admin |
| POST | `/analytics/update/user/{id}` | Update user analytics | Admin/Self |
| POST | `/analytics/update/course/{id}` | Update course analytics | Teacher/Admin |

### Moderation (`/moderation`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/moderation/settings` | Create settings | Admin |
| GET | `/moderation/settings` | Get all settings | Admin |
| PATCH | `/moderation/settings/{category}` | Update settings | Admin |
| GET | `/moderation/logs` | Get moderation logs | Admin |
| GET | `/moderation/logs/{id}` | Get specific log | Admin |
| GET | `/moderation/stats` | Get moderation stats | Admin |

## Example Requests

### Create Account

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "secure123",
    "full_name": "Jane Student",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "secure123"
  }'
```

### Create Course (Admin)

```bash
curl -X POST http://localhost:8000/courses/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to AI",
    "description": "Learn the basics of artificial intelligence",
    "teacher_id": 2
  }'
```

### Upload Course Material (Teacher)

```bash
curl -X POST http://localhost:8000/courses/1/materials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Lecture 1" \
  -F "file=@path/to/document.pdf"
```

### Query AI Co-Instructor (Student)

```bash
curl -X POST http://localhost:8000/rag/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "course_id": 1,
    "conversation_history": []
  }'
```

### Generate Quiz (Teacher)

```bash
curl -X POST http://localhost:8000/quiz/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "topic": "Neural Networks",
    "difficulty": "medium",
    "num_questions": 5
  }'
```

### Submit Quiz Attempt (Student)

```bash
curl -X POST http://localhost:8000/quiz/attempt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": 1,
    "answers": [
      {"question_id": 1, "student_answer": "A"},
      {"question_id": 2, "student_answer": "B"}
    ]
  }'
```

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

## Error Response Format

```json
{
  "detail": "Error message here"
}
```

## Interactive Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation where you can:
- View all endpoints
- See request/response schemas
- Test API calls directly
- Authorize with your token

Visit http://localhost:8000/redoc for alternative ReDoc documentation.

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## Pagination

For list endpoints that support pagination:
- `skip`: Number of items to skip (default: 0)
- `limit`: Maximum items to return (default: 100)

Example:
```
GET /users/?skip=0&limit=10
```

## WebSocket Support

WebSocket support for real-time features can be added in future versions for:
- Live chat updates
- Real-time quiz participation
- Notification system
