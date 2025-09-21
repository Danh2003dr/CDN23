#!/bin/bash

echo "🩸 Starting Blood Bank Blockchain System..."
echo "========================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create a new terminal session for blockchain node
echo "🔗 Starting Hardhat blockchain node..."
gnome-terminal --title="Hardhat Node" -- bash -c "
    echo '🔗 Starting Hardhat Node...';
    echo 'Keep this terminal open while using the system';
    echo '==========================================';
    npx hardhat node;
    read -p 'Press Enter to close...'
" 2>/dev/null || {
    # Fallback for systems without gnome-terminal
    echo "Please run 'npx hardhat node' in a separate terminal"
    echo "Press Enter when the blockchain node is running..."
    read
}

# Wait a moment for the node to start
echo "⏳ Waiting for blockchain node to initialize..."
sleep 5

# Deploy the smart contract
echo "🚀 Deploying smart contract..."
npm run deploy-local

if [ $? -eq 0 ]; then
    echo "✅ Smart contract deployed successfully!"
else
    echo "❌ Failed to deploy smart contract. Please check the logs."
    exit 1
fi

# Start the frontend server
echo "🌐 Starting web interface..."
gnome-terminal --title="Blood Bank Web Server" -- bash -c "
    echo '🌐 Starting Blood Bank Web Interface...';
    echo 'Access the system at: http://localhost:3000';
    echo '=============================================';
    cd frontend && node server.js;
    read -p 'Press Enter to close...'
" 2>/dev/null || {
    echo "🌐 Starting web server..."
    cd frontend && node server.js &
    WEB_PID=$!
    echo "Web server started with PID: $WEB_PID"
}

echo ""
echo "🎉 System started successfully!"
echo "================================"
echo "📊 Access the web interface at: http://localhost:3000"
echo "🔗 Blockchain node running on: http://localhost:8545"
echo "📚 Check README.md for usage instructions"
echo ""
echo "To stop the system:"
echo "1. Close the Hardhat node terminal"
echo "2. Close the web server terminal"
echo "3. Or run: pkill -f hardhat && pkill -f 'node server.js'"
echo ""
echo "🩸 Happy blood banking with blockchain! 🩸"