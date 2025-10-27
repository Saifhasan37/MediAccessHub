#!/bin/bash

echo "🚀 Starting MediAccessHub Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ Port $1 is already in use${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Port $1 is not in use${NC}"
        return 1
    fi
}

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB...${NC}"
if check_port 27017; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is not running. Starting MongoDB...${NC}"
    mongod --config /usr/local/etc/mongod.conf &
    sleep 3
fi

# Check if Backend is running
echo -e "${YELLOW}Checking Backend (Port 5001)...${NC}"
if check_port 5001; then
    echo -e "${GREEN}✅ Backend is already running${NC}"
else
    echo -e "${YELLOW}Starting Backend...${NC}"
    cd "app/backend"
    npm start &
    cd ../..
    sleep 5
fi

# Check if Frontend is running
echo -e "${YELLOW}Checking Frontend (Port 3000)...${NC}"
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend is already running${NC}"
else
    echo -e "${YELLOW}Starting Frontend...${NC}"
    cd "app/frontend"
    npm start &
    cd ../..
    sleep 10
fi

echo -e "${GREEN}🎉 MediAccessHub is now running!${NC}"
echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Backend API: http://localhost:5001${NC}"
echo -e "${YELLOW}Test Credentials:${NC}"
echo -e "   Email: test@example.com"
echo -e "   Password: testpass123"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait



