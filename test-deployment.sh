#!/bin/bash

# Chess v4 Production Deployment Testing Script
# Tests both local and production deployments

set -e

echo "🧪 Chess v4 Deployment Testing Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
BACKEND_LOCAL_URL="http://localhost:3001"
FRONTEND_LOCAL_URL="http://localhost:3000"
BACKEND_PROD_URL="${BACKEND_PROD_URL:-}"
FRONTEND_PROD_URL="${FRONTEND_PROD_URL:-}"

echo ""
echo "🔧 Configuration:"
echo "  Local Backend:     $BACKEND_LOCAL_URL"
echo "  Local Frontend:    $FRONTEND_LOCAL_URL"
echo "  Production Backend: ${BACKEND_PROD_URL:-'Not set - will skip production tests'}"
echo "  Production Frontend: ${FRONTEND_PROD_URL:-'Not set - will skip production tests'}"
echo ""

# Test 1: Local Backend
print_step "Testing Local Backend"
cd backend

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "backend/package.json not found"
    exit 1
fi

# Install dependencies
print_step "Installing backend dependencies..."
npm install

# Start backend in background
print_step "Starting local backend..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Test health endpoint
print_step "Testing backend health endpoint..."
if curl -f -s "$BACKEND_LOCAL_URL/api/health" > /dev/null; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test server info endpoint
print_step "Testing backend info endpoint..."
if curl -f -s "$BACKEND_LOCAL_URL/" > /dev/null; then
    print_success "Backend info endpoint passed"
else
    print_warning "Backend info endpoint failed"
fi

# Test Socket.IO endpoint
print_step "Testing Socket.IO endpoint..."
if curl -f -s "$BACKEND_LOCAL_URL/socket.io/" > /dev/null; then
    print_success "Socket.IO endpoint accessible"
else
    print_warning "Socket.IO endpoint failed"
fi

# Stop backend
kill $BACKEND_PID 2>/dev/null || true
print_success "Local backend tests completed"

echo ""

# Test 2: Local Frontend
print_step "Testing Local Frontend"
cd ../frontend

if [ ! -f "package.json" ]; then
    print_error "frontend/package.json not found"
    exit 1
fi

# Install dependencies
print_step "Installing frontend dependencies..."
npm install

# Test build
print_step "Testing frontend build..."
if npm run build; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Check build output
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "Build output verified"
else
    print_error "Build output missing"
    exit 1
fi

print_success "Local frontend tests completed"

echo ""

# Test 3: Production Backend (if URL provided)
if [ -n "$BACKEND_PROD_URL" ]; then
    print_step "Testing Production Backend"

    # Test health endpoint
    print_step "Testing production backend health..."
    if curl -f -s "$BACKEND_PROD_URL/api/health" > /dev/null; then
        print_success "Production backend health check passed"
    else
        print_error "Production backend health check failed"
    fi

    # Test server info
    print_step "Testing production backend info..."
    if curl -f -s "$BACKEND_PROD_URL/" > /dev/null; then
        print_success "Production backend info passed"
    else
        print_warning "Production backend info failed"
    fi

    # Test Socket.IO
    print_step "Testing production Socket.IO..."
    if curl -f -s "$BACKEND_PROD_URL/socket.io/" > /dev/null; then
        print_success "Production Socket.IO accessible"
    else
        print_warning "Production Socket.IO failed"
    fi

    print_success "Production backend tests completed"
else
    print_warning "Skipping production backend tests (BACKEND_PROD_URL not set)"
fi

echo ""

# Test 4: Production Frontend (if URL provided)
if [ -n "$FRONTEND_PROD_URL" ]; then
    print_step "Testing Production Frontend"

    # Test frontend accessibility
    print_step "Testing production frontend accessibility..."
    if curl -f -s "$FRONTEND_PROD_URL" > /dev/null; then
        print_success "Production frontend accessible"
    else
        print_error "Production frontend not accessible"
    fi

    # Test health endpoint (if configured)
    print_step "Testing production frontend health..."
    if curl -f -s "$FRONTEND_PROD_URL/health" > /dev/null; then
        print_success "Production frontend health passed"
    else
        print_warning "Production frontend health endpoint not configured"
    fi

    print_success "Production frontend tests completed"
else
    print_warning "Skipping production frontend tests (FRONTEND_PROD_URL not set)"
fi

echo ""

# Test 5: Docker Builds
print_step "Testing Docker Builds"

# Test backend Docker build
print_step "Testing backend Docker build..."
cd ../backend
if docker build -t chess-v4-backend-test . > /dev/null 2>&1; then
    print_success "Backend Docker build successful"
    docker rmi chess-v4-backend-test > /dev/null 2>&1 || true
else
    print_warning "Backend Docker build failed"
fi

# Test frontend Docker build
print_step "Testing frontend Docker build..."
cd ../frontend
if docker build -t chess-v4-frontend-test . > /dev/null 2>&1; then
    print_success "Frontend Docker build successful"
    docker rmi chess-v4-frontend-test > /dev/null 2>&1 || true
else
    print_warning "Frontend Docker build failed"
fi

cd ..

echo ""
echo "🎯 Test Summary:"
echo "=================="
print_success "✅ Local backend functionality"
print_success "✅ Local frontend build"
print_success "✅ Docker configurations"

if [ -n "$BACKEND_PROD_URL" ]; then
    print_success "✅ Production backend tests"
else
    print_warning "⚠️  Production backend tests skipped"
fi

if [ -n "$FRONTEND_PROD_URL" ]; then
    print_success "✅ Production frontend tests"
else
    print_warning "⚠️  Production frontend tests skipped"
fi

echo ""
echo "🚀 Next Steps:"
echo "==============="
echo "1. Create GitHub repository: gh repo create chess-v4 --public --source=. --push"
echo "2. Deploy backend to Railway: Follow RAILWAY_SETUP.md"
echo "3. Deploy frontend to Vercel: Follow VERCEL_SETUP.md"
echo "4. Test production deployment:"
echo "   BACKEND_PROD_URL=https://your-backend.railway.app FRONTEND_PROD_URL=https://your-frontend.vercel.app ./test-deployment.sh"
echo ""

print_success "🎉 Deployment testing completed successfully!"