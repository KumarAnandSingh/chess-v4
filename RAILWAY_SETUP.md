# Railway Backend Deployment Setup

## Step 1: Create GitHub Repository

```bash
# Initialize remote repository
gh repo create chess-v4 --public --source=. --remote=origin --push
```

Or manually:
1. Go to https://github.com/new
2. Create repository named "chess-v4"
3. Push local code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/chess-v4.git
git push -u origin main
```

## Step 2: Deploy to Railway

### Option A: Railway Dashboard (Recommended)

1. **Login to Railway**: https://railway.app/login
2. **Create New Project**: Click "New Project"
3. **Connect GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose your `chess-v4` repository
5. **Configure Service**:
   - Service Name: `chess-v4-backend`
   - Root Directory: `backend`
   - Build Command: (Leave empty - uses Dockerfile)
   - Start Command: `node server.js`

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create project and deploy
cd /Users/priyasingh/chess-v4
railway new chess-v4-backend --template blank
railway up
```

## Step 3: Environment Variables

Set these in Railway Dashboard → Variables:

### Required Variables
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
SESSION_SECRET=your-super-secret-session-key-here-min-32-chars
```

### Optional Variables
```env
# Game Configuration
DEFAULT_TIME_CONTROL=blitz
MAX_CONCURRENT_GAMES=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# WebSocket Configuration
WEBSOCKET_PING_TIMEOUT=60000
WEBSOCKET_PING_INTERVAL=25000
```

## Step 4: Verify Deployment

After deployment, check:

1. **Service URL**: Railway will provide a URL like `https://chess-v4-backend-production.up.railway.app`

2. **Health Check**:
   ```bash
   curl https://your-backend-url.railway.app/api/health
   ```

3. **Socket.IO Endpoint**:
   ```bash
   curl https://your-backend-url.railway.app/socket.io/
   ```

4. **Server Info**:
   ```bash
   curl https://your-backend-url.railway.app/
   ```

## Step 5: Configure Custom Domain (Optional)

1. In Railway Dashboard → Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Configure DNS:
   ```
   CNAME api.yourdomain.com -> your-service.up.railway.app
   ```

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Dockerfile path in railway.toml
   - Verify Node.js version compatibility
   - Check build logs in Railway dashboard

2. **Health Check Fails**:
   - Verify `/api/health` endpoint
   - Check environment variables
   - Review application logs

3. **Socket.IO Connection Issues**:
   - Ensure WebSocket support is enabled
   - Check CORS configuration
   - Verify frontend URL in environment

### Debug Commands

```bash
# View deployment logs
railway logs

# Check service status
railway status

# Open service in browser
railway open

# Connect to service shell
railway shell
```

## Railway Configuration Details

The deployment uses these files:

### `railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### `backend/Dockerfile`
- Multi-stage build for optimization
- Security with non-root user
- Health check integration
- Proper signal handling

### Health Check
Railway automatically monitors the `/api/health` endpoint which returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "activeRooms": 5,
  "activeSessions": 10,
  "activeGames": 3,
  "memory": {...},
  "version": "4.0.0"
}
```

## Cost Optimization

### Railway Pricing
- Free tier: $5 credit monthly
- Pro plan: $20/month + usage
- Usage-based billing for compute and bandwidth

### Optimization Tips
1. **Resource Monitoring**: Check CPU/Memory usage
2. **Idle Management**: Railway auto-sleeps inactive services
3. **Scaling**: Configure auto-scaling based on load
4. **Logs**: Set appropriate log retention

## Production Checklist

- [ ] Repository connected to Railway
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] Socket.IO working correctly
- [ ] CORS configured for frontend domain
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place (for future data persistence)

## Next Steps

After Railway deployment:
1. Note the backend URL
2. Configure Vercel frontend with this URL
3. Test end-to-end room creation and joining
4. Set up monitoring and alerts
5. Configure CI/CD for automatic deployments

## Support

- Railway Documentation: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/YOUR_USERNAME/chess-v4/issues