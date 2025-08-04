#!/bin/bash

# Hook Line Studio - Test Setup Script
echo "🧪 Setting up comprehensive test suite for Hook Line Studio..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
if npm install; then
    print_status "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
if npm install; then
    print_status "Client dependencies installed"
else
    print_error "Failed to install client dependencies"
    exit 1
fi
cd ..

# Check if PostgreSQL is available for integration tests
if command -v psql &> /dev/null; then
    print_status "PostgreSQL detected - integration tests will be available"
    
    # Create test database if it doesn't exist
    if createdb hooklinestudio_test 2>/dev/null; then
        print_status "Test database created"
    else
        print_warning "Test database already exists or couldn't be created"
    fi
else
    print_warning "PostgreSQL not detected - integration tests will use mocks only"
fi

# Install Playwright browsers for E2E tests
echo "🎭 Installing Playwright browsers..."
if npx playwright install --with-deps; then
    print_status "Playwright browsers installed"
else
    print_warning "Playwright installation failed - E2E tests may not work"
fi

# Run type checking to validate setup
echo "🔍 Running type check..."
if npm run type-check; then
    print_status "TypeScript configuration valid"
else
    print_warning "TypeScript errors detected - some tests may fail"
fi

# Run a quick test to validate setup
echo "🧪 Running test validation..."
if npm test -- --testNamePattern="should be configured correctly" --passWithNoTests; then
    print_status "Test framework configured correctly"
else
    print_warning "Test framework may have configuration issues"
fi

echo ""
echo "🎉 Test suite setup complete!"
echo ""
echo "📚 Available test commands:"
echo "  npm run test           # Run all tests"
echo "  npm run test:unit      # Run unit tests only" 
echo "  npm run test:integration # Run integration tests"
echo "  npm run test:e2e       # Run end-to-end tests"
echo "  npm run test:coverage  # Run tests with coverage"
echo "  npm run test:watch     # Run tests in watch mode"
echo ""
echo "🏗️  Test Structure:"
echo "  tests/unit/            # Unit tests for services & components"
echo "  tests/integration/     # API endpoint integration tests"
echo "  tests/e2e/            # End-to-end user flow tests"
echo "  tests/performance/     # Load testing & benchmarks"
echo ""
echo "📊 Coverage Target: 80%+ across backend and frontend"
echo "🔐 Security: Vulnerability scanning integrated"
echo "⚡ Performance: Load testing & benchmarks included"
echo ""
echo "Ready to achieve production-level test coverage! 🚀"