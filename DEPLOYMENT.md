# Chess v4 Production Deployment Guide

## Overview

Chess v4 is deployed using a modern production stack:
- **Frontend**: React + TypeScript + Vite deployed on Vercel
- **Backend**: Node.js + Express + Socket.IO deployed on Railway
- **CI/CD**: GitHub Actions for automated testing and deployment

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   Vercel CDN    │    │   Railway       │
│                 │◄──►│   (Frontend)    │◄──►│   (Backend)     │
│  Web Browsers   │    │   Static Files  │    │   Socket.IO     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

1. **GitHub Account** with repository access
2. **Vercel Account** connected to GitHub
3. **Railway Account** connected to GitHub
4. **Domain** (optional but recommended)

## Backend Deployment (Railway)

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new chess-v4-backend
```

### 2. Environment Variables

Set these environment variables in Railway dashboard:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
SESSION_SECRET=your-super-secret-session-key-here
```

### 3. Deploy Backend

```bash
# Connect to Railway project
railway link

# Deploy from GitHub (recommended)
# - Connect GitHub repository in Railway dashboard
# - Set build path to 'backend/'
# - Enable auto-deploy on main branch

# Or deploy via CLI
railway up --service backend
```

### 4. Verify Backend Deployment

- Check health endpoint: `https://your-backend.railway.app/api/health`
- Verify Socket.IO endpoint: `https://your-backend.railway.app/socket.io/`

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Environment Variables

Set in Vercel dashboard or via CLI:

```env
VITE_BACKEND_URL=https://your-backend.railway.app
VITE_WEBSOCKET_URL=https://your-backend.railway.app
VITE_NODE_ENV=production
```

### 3. Deploy Frontend

```bash
# Login to Vercel
vercel login

# Deploy from project root
cd /Users/priyasingh/chess-v4
vercel --prod

# Or connect GitHub repository in Vercel dashboard
# - Import GitHub repository
# - Set framework preset to "Vite"
# - Set root directory to "frontend"
# - Configure environment variables
```

### 4. Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com
```

## GitHub Actions CI/CD

The repository includes automated CI/CD pipeline:

### Required Secrets

Add these secrets in GitHub repository settings:

```
RAILWAY_TOKEN=your-railway-api-token
VERCEL_TOKEN=your-vercel-api-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### Pipeline Features

- **Automated Testing**: Runs tests on every push/PR
- **Security Scanning**: Trivy vulnerability scanning
- **Build Verification**: Ensures frontend builds successfully
- **Automated Deployment**: Deploys to production on main branch
- **Health Checks**: Verifies deployments are healthy

## Local Development

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your settings
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

## Production Monitoring

### Health Checks

- **Backend**: `GET /api/health`
- **Frontend**: `GET /health`

### Key Metrics to Monitor

1. **Backend Metrics**:
   - Active connections
   - Room count
   - Game count
   - Memory usage
   - Response times

2. **Frontend Metrics**:
   - Page load times
   - JavaScript errors
   - User engagement

### Logging

- **Backend**: Structured logging with timestamp, level, and context
- **Frontend**: Error tracking and user analytics

## Security Considerations

### Backend Security

- CORS configured for frontend domain only
- Rate limiting on all endpoints
- Helmet.js for security headers
- Input validation on all Socket.IO events
- Session management with secure secrets

### Frontend Security

- Content Security Policy
- XSS protection headers
- HTTPS-only communication
- Environment variable validation

## Scaling Considerations

### Backend Scaling

Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

For high traffic, consider:
- Redis for session storage
- Database for game persistence
- Load balancer for multiple instances

### Frontend Scaling

Vercel automatically provides:
- Global CDN
- Edge caching
- Automatic scaling
- Image optimization

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify FRONTEND_URL environment variable
   - Check CORS configuration in backend

2. **Socket.IO Connection Failed**:
   - Verify WebSocket support in Railway
   - Check firewall and proxy settings

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are listed

4. **Environment Variables Not Loading**:
   - Ensure variables are set in deployment platform
   - Check variable naming (VITE_ prefix for frontend)

### Debug Commands

```bash
# Check backend health
curl https://your-backend.railway.app/api/health

# Test WebSocket connection
wscat -c wss://your-backend.railway.app/socket.io/?EIO=4&transport=websocket

# Check frontend build
cd frontend && npm run build

# Test frontend locally with production backend
cd frontend && npm run preview
```

## Performance Optimization

### Backend Optimizations

- Connection pooling for database (when added)
- Gzip compression enabled
- Static asset caching
- Memory-efficient game state management

### Frontend Optimizations

- Code splitting by route and feature
- Lazy loading of heavy components
- Image optimization
- Bundle size monitoring

## Backup and Recovery

### Data Backup

Currently, Chess v4 is stateless (no persistence). When adding database:

- Automated daily backups
- Point-in-time recovery
- Cross-region replication

### Disaster Recovery

- Infrastructure as Code (this repository)
- Environment variable backup
- Monitoring and alerting setup
- Rollback procedures

## Cost Optimization

### Railway (Backend)

- Resource monitoring
- Auto-scaling configuration
- Unused service cleanup

### Vercel (Frontend)

- Bandwidth monitoring
- Function execution tracking
- CDN usage optimization

## Support and Maintenance

### Regular Tasks

- Dependency updates
- Security patches
- Performance monitoring
- User feedback review

### Emergency Contacts

- Railway support for backend issues
- Vercel support for frontend issues
- GitHub support for CI/CD issues

---

## Quick Deploy Commands

```bash
# Complete production deployment
git add .
git commit -m "Production deployment setup"
git push origin main

# Verify deployments
curl https://your-backend.railway.app/api/health
curl https://your-frontend.vercel.app/health
```