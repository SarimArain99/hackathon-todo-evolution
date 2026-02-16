# Production Deployment Guide

**Feature**: 001-hackathon-todo-evolution (Production Readiness)

**Last Updated**: 2025-02-14

---

## Overview

This guide covers deploying the Todo Evolution application to production. The application is a cloud-native, event-driven todo application with AI chatbot capabilities.

**Architecture:**
- **Backend**: FastAPI Python application
- **Frontend**: Next.js 14+ React application
- **Database**: PostgreSQL (production) or SQLite (development)
- **Authentication**: Better Auth (shared secret)
- **Event Bus**: Dapr for event-driven architecture
- **AI**: OpenAI GPT for chatbot functionality

---

## Prerequisites

### Required Accounts/Services

| Service | Purpose |
|---------|--------|
| [Vercel](https://vercel.com) | Frontend hosting (or alternative) |
| [Neon PostgreSQL](https://neon.tech/) | Recommended PostgreSQL database |
| [OpenAI](https://openai.com) | AI chatbot API |
| [Dapr](https://dapr.io) | Event-driven runtime (optional, for cloud events) |
| [Redis](https://redis.io) | Rate limiting (recommended) |
| [Qdrant](https://qdrant.io) | Vector search (optional, for chat search) |

---

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Docker | Latest | https://docs.docker.com/get-docker/ |
| kubectl | Matches K8s version | https://kubernetes.io/docs/tasks/tools/ |
| Helm | 3.x | https://helm.sh/docs/intro/install/ |

---

## Environment Variables

### Backend Configuration

```bash
# Required Variables
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-your-api-key-here

# Optional Variables
ENVIRONMENT=production
REDIS_URL=redis://localhost:6379
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30.0
LOG_LEVEL=INFO
```

### Frontend Configuration

```bash
# Required Variables
BETTER_AUTH_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://backend:8000

# Optional Variables
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
REQUIRE_EMAIL_VERIFICATION=false
DATABASE_URL=postgresql://user:password@host:5432/database

# Email Service (for password reset - optional)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Important Security Notes:**
- Generate `BETTER_AUTH_SECRET` with: `openssl rand -base64 32`
- NEVER commit `.env` or `.env.local` files to version control
- Set `ENVIRONMENT=production` for production deployments
- Use PostgreSQL (not SQLite) in production
- Never use wildcard origins in CORS (e.g., `https://*.vercel.app`)

---

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

**Prerequisites:**
- Vercel account
- Connected GitHub repository

**Steps:**

1. **Push code to Vercel:**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Vercel will automatically detect Next.js and build
   - Set environment variables in Vercel dashboard
   - Configure custom domain if needed

3. **Configure Environment Variables:**
   ```bash
   # Required
   BETTER_AUTH_SECRET=<generated-secret>
   NEXT_PUBLIC_API_URL=<your-backend-url>

   # Optional - for production
   DATABASE_URL=postgresql://...
   REQUIRE_EMAIL_VERIFICATION=false
   ```

4. **Set Backend Backend URL:**
   - Add your deployed backend URL to Vercel environment variables
   - Example: `https://your-backend.vercel.app`

### Option 2: Docker Deployment

1. **Build Docker images:**
   ```bash
   cd backend
   docker build -t todo-backend:latest .
   cd ../frontend
   docker build -t todo-frontend:latest .
   ```

2. **Run containers:**
   ```bash
   docker run -d -p 8000:8000 --name todo-backend todo-backend:latest
   docker run -d -p 3000:3000 --name todo-frontend todo-frontend:latest
   ```

3. **Set environment variables:**
   ```bash
   docker run -e DATABASE_URL=postgresql://... todo-backend:latest
   ```

### Option 3: Kubernetes Deployment

For Kubernetes deployment, use the provided Helm charts:

```bash
# From project root
helm install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --values helm/todo-app/values-prod.yaml \
  --set backend.env.DATABASE_URL="postgresql://..." \
  --set backend.env.BETTER_AUTH_SECRET="..." \
  --set backend.env.OPENAI_API_KEY="..."
```

See [Kubernetes Deployment Guide](./minikube-deployment.md) for detailed Kubernetes deployment instructions.

---

## Health Checks

After deployment, verify the application is running:

### Backend Health Check

```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-02-14T12:00:00Z",
  "version": "0.1.0"
}
```

### Database Health Check

```bash
curl https://your-backend.vercel.app/health/with-db
```

---

## Production Checklist

Before deploying to production, verify:

- [ ] **Security**: All environment variables are set (no defaults)
- [ ] **Authentication**: Better Auth secret matches between frontend/backend
- [ ] **Database**: PostgreSQL (not SQLite) is configured
- [ ] **CORS**: Only exact domains in `allowed_origins` (no wildcards)
- [ ] **Logging**: Structured JSON logging is enabled in production
- [ ] **Rate Limiting**: Redis-based rate limiting is configured
- [ ] **Error Handling**: Global exception handlers are active
- [ ] **Validation**: Pydantic validation is enabled on all inputs
- [ ] **HTTPS**: All services use HTTPS (no HTTP)

---

## Monitoring

### Application Logs

View logs for troubleshooting:

```bash
# Backend logs
kubectl logs -n todo-app deployment/backend

# Frontend logs
kubectl logs -n todo-app deployment/frontend
```

### Performance Metrics

Monitor resource usage:

```bash
# Check pod resource usage
kubectl top pods -n todo-app
```

---

## Troubleshooting

### Common Issues

**Issue**: "CORS error" when accessing from frontend
- **Solution**: Verify `NEXT_PUBLIC_API_URL` matches backend URL exactly
- **Solution**: Check `FRONTEND_URL` in backend environment includes your frontend domain

**Issue**: "Database connection failed"
- **Solution**: Verify `DATABASE_URL` is correctly formatted for asyncpg
- **Solution**: Check PostgreSQL pod is running: `kubectl get pods -n todo-app -l app=postgres`

**Issue**: "Rate limit exceeded"
- **Solution**: Check `REDIS_URL` is accessible
- **Solution**: Adjust rate limits in environment variables

---

## Security Best Practices

1. **Secrets Management:**
   - Never commit secrets to git
   - Use different secrets for development/production
   - Rotate secrets regularly

2. **CORS Configuration:**
   - Use exact URLs (no wildcards)
   - Rotate `allowed_origins` list as needed

3. **Input Validation:**
   - Pydantic schemas validate all inputs
   - Max length constraints enforced
   - Type checking on all fields

4. **SQL Injection Prevention:**
   - Use parameterized queries (SQLModel)
   - Never concatenate user input into SQL

5. **Rate Limiting:**
   - Redis-backed token bucket algorithm
   - Configured per-IP and per-user (when authenticated)

6. **Logging:**
   - Structured JSON format in production
   - No sensitive data in logs
   - Request/response tracking for debugging

---

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/your-org/hackathon-todo-evolution/issues)
- Review [Health Check Endpoint](/health)
- Check application logs

---

## References

- [Project README](../README.md)
- [Backend API Docs](/backend/README.md)
- [Environment Variables](../backend/.env.example)
- [Kubernetes Deployment](./minikube-deployment.md)
