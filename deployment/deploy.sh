#!/bin/bash

# Digital Homes Platform Deployment Script
echo "🏠 Digital Homes Platform Deployment"
echo "===================================="

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed. Aborting." >&2; exit 1; }
command -v pip >/dev/null 2>&1 || { echo "❌ pip is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."

# Backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# AI service dependencies
echo "Installing AI service dependencies..."
cd ../ai-valuation && pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install AI service dependencies"
    exit 1
fi

cd ..

# Setup environment files
echo "🔧 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Please configure backend/.env with your settings"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please configure frontend/.env with your settings"
fi

# Build frontend
echo "🏗️  Building frontend..."
cd frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi

cd ..

echo "✅ Deployment setup complete!"
echo ""
echo "🚀 To start the platform:"
echo "   npm run dev"
echo ""
echo "📋 Next steps:"
echo "   1. Configure environment variables in .env files"
echo "   2. Set up MongoDB database"
echo "   3. Configure Andromeda Protocol settings"
echo "   4. Deploy smart contracts to Andromeda testnet"
echo ""
echo "🎉 Digital Homes Platform is ready for the hackathon!"
