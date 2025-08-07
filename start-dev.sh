#!/bin/bash

# Kill any existing processes
pkill -f "tsx watch" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "concurrently" 2>/dev/null

sleep 2

echo "🚀 Starting Hook Line Studio development servers..."
echo ""

# Start in background and keep alive
nohup npm run dev > dev.log 2>&1 &

sleep 5

echo "📊 Checking server status..."
echo ""

# Check if processes are running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server API is running on http://localhost:3000"
else
    echo "❌ Server API is not responding"
fi

if curl -s http://localhost:5173/ > /dev/null; then
    echo "✅ Client is running on http://localhost:5173"
else
    echo "❌ Client is not responding"
fi

echo ""
echo "📝 Server logs:"
tail -20 dev.log

echo ""
echo "🔄 Servers are running in background. Check dev.log for full output."
echo "   To stop: pkill -f 'tsx watch' && pkill -f 'vite'"