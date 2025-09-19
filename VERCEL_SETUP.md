# Vercel Frontend Deployment Setup

## Step 1: Prepare Frontend for Production

The frontend is already configured with production-ready settings:
- Environment variable support
- Optimized build configuration
- Code splitting and chunk optimization
- Production-ready nginx configuration

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Login to Vercel**: https://vercel.com/login
2. **Import Project**: Click "Add New..." → "Project"
3. **Connect GitHub**: Import from GitHub
4. **Select Repository**: Choose your `chess-v4` repository
5. **Configure Project**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd /Users/priyasingh/chess-v4/frontend
vercel --prod

# Or deploy from project root with configuration
cd /Users/priyasingh/chess-v4
vercel --prod
```

## Step 3: Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables
```env
VITE_BACKEND_URL=https://your-backend-url.railway.app
VITE_WEBSOCKET_URL=https://your-backend-url.railway.app
VITE_NODE_ENV=production
```

### Optional Variables
```env
# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_SPECTATOR_MODE=true

# Game Configuration
VITE_DEFAULT_TIME_CONTROL=blitz
VITE_MAX_ROOM_CODE_LENGTH=4

# UI Configuration
VITE_THEME=default
VITE_ENABLE_SOUND=true
VITE_ENABLE_ANIMATIONS=true

# Monitoring (if using)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

## Step 4: Custom Domain (Optional)

### Add Domain in Vercel
1. Go to Project → Settings → Domains
2. Add domain: `chess.yourdomain.com`
3. Configure DNS:

```
# For subdomain
CNAME chess.yourdomain.com -> cname.vercel-dns.com

# For apex domain
A yourdomain.com -> 76.76.19.61
AAAA yourdomain.com -> 2606:4700:10::6814:c055
```

### SSL Certificate
Vercel automatically provides SSL certificates for all domains.

## Step 5: Verify Deployment

After deployment, test:

1. **Frontend Access**: Visit your Vercel URL
2. **Backend Connection**: Check browser console for API calls
3. **Socket.IO**: Verify real-time features work
4. **Room Creation**: Test creating and joining rooms
5. **Game Flow**: Complete chess game functionality

### Test Commands
```bash
# Check frontend health
curl https://your-frontend.vercel.app/health

# Test API connectivity (should show CORS error - expected)
curl https://your-frontend.vercel.app/api/health

# Check build output
cd frontend && npm run build && npm run preview
```

## Step 6: Configure Backend CORS

Update Railway environment variables to include your Vercel domain:

```env
FRONTEND_URL=https://your-frontend.vercel.app,https://chess.yourdomain.com
```

## Production Configuration

### `vercel.json` Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Frontend Environment Configuration
The frontend uses `/Users/priyasingh/chess-v4/frontend/src/config/environment.ts` for:
- Environment variable management
- Development vs production configuration
- Feature flag handling
- API URL configuration

## Automatic Deployments

### GitHub Integration
Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Deployment Hooks
Configure webhooks for:
- Deployment notifications
- Integration with monitoring tools
- Custom deployment scripts

## Performance Optimization

### Vercel Optimizations
- **Global CDN**: Automatic edge distribution
- **Image Optimization**: Built-in image processing
- **Edge Functions**: For dynamic content
- **Bandwidth Optimization**: Gzip compression

### Frontend Optimizations
- **Code Splitting**: Routes and components
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Size monitoring
- **Lazy Loading**: Heavy components

## Monitoring and Analytics

### Vercel Analytics
1. Enable in Project → Analytics
2. Monitor Core Web Vitals
3. Track user behavior
4. Performance insights

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Check VITE_ prefix requirement
   - Verify variables in Vercel dashboard
   - Redeploy after adding variables

2. **API Connection Failed**:
   - Verify VITE_BACKEND_URL is correct
   - Check CORS configuration on backend
   - Ensure backend is deployed and healthy

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Review build logs in Vercel dashboard

4. **Routing Issues**:
   - Verify rewrites in vercel.json
   - Check SPA routing configuration
   - Test direct URL access

### Debug Commands
```bash
# Local production build
cd frontend
npm run build
npm run preview

# Check environment variables
npm run build -- --mode production

# Analyze bundle size
npx vite-bundle-analyzer dist
```

## Security Considerations

### Content Security Policy
Configure CSP headers for:
- Script source restrictions
- Style source limitations
- Image source controls
- Connect source (API) restrictions

### HTTPS Enforcement
Vercel automatically:
- Redirects HTTP to HTTPS
- Provides SSL certificates
- Implements HSTS headers

## Cost Optimization

### Vercel Pricing
- **Hobby**: Free tier (100GB bandwidth)
- **Pro**: $20/month/team (1TB bandwidth)
- **Enterprise**: Custom pricing

### Optimization Tips
1. **Image Optimization**: Use Vercel's image service
2. **Caching**: Leverage CDN caching
3. **Bundle Size**: Monitor and optimize
4. **Function Usage**: Minimize edge function calls

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Backend URL pointing to Railway
- [ ] CORS configured on backend
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Security headers configured
- [ ] Automatic deployments working

## Integration Testing

After both deployments are complete:

```bash
# Test complete flow
1. Visit frontend URL
2. Create a room
3. Copy invitation link
4. Open in incognito/different browser
5. Join room with code
6. Start and play chess game
7. Test chat functionality
8. Verify real-time updates
```

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Discord: https://discord.gg/vercel
- GitHub Issues: https://github.com/YOUR_USERNAME/chess-v4/issues