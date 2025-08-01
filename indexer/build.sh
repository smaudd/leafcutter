#!/bin/bash

# Build script for LeafCutter Indexer
# Creates executables for multiple platforms

echo "🔨 Building LeafCutter Indexer for multiple platforms..."

# Create build directory
mkdir -p builds

# Build for different platforms
echo "Building for macOS (Intel)..."
GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o builds/indexer-macos-intel .

echo "Building for macOS (Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o builds/indexer-macos-arm64 .

echo "Building for Windows (64-bit)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o builds/indexer-windows.exe .

echo "Building for Linux (64-bit)..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o builds/indexer-linux .

echo "Building for Linux (ARM64)..."
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o builds/indexer-linux-arm64 .

echo "✅ Build complete! Executables are in the 'builds' directory:"
ls -la builds/

echo ""
echo "📦 File sizes:"
du -h builds/*
