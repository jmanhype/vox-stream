#!/usr/bin/env node

/**
 * Vox Stream - Log Tailing Service
 * Tails log files and streams via WebSocket
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createReadStream, existsSync } from 'fs';
import { watchFile, statSync } from 'fs';

// Configuration
const PORT = process.env.PORT || 3001;
const LOG_FILE = process.env.LOG_FILE || './app.log';

// Create HTTP server
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store file position for tailing
let filePosition = 0;

// Initialize log file if it doesn't exist
if (!existsSync(LOG_FILE)) {
  console.log(`📝 Creating log file: ${LOG_FILE}`);
  createWriteStream(LOG_FILE, { flags: 'a' }).close();
  filePosition = 0;
} else {
  // Start from end of file
  const stats = statSync(LOG_FILE);
  filePosition = stats.size;
  console.log(`📄 Starting at position: ${filePosition}`);
}

// Tail log file
function tailLogFile() {
  if (!existsSync(LOG_FILE)) {
    console.error(`❌ Log file not found: ${LOG_FILE}`);
    return;
  }

  const stream = createReadStream(LOG_FILE, {
    start: filePosition,
    encoding: 'utf8'
  });

  stream.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

    lines.forEach(line => {
      // Parse log level
      const level = parseLogLevel(line);
      const timestamp = new Date().toISOString();

      const logEntry = {
        timestamp,
        level,
        message: line,
        raw: line
      };

      // Broadcast to all connected clients
      io.emit('log', logEntry);

      console.log(`📤 Streamed: [${level}] ${line.substring(0, 100)}`);
    });

    // Update position
    filePosition += chunk.length;
  });

  stream.on('error', (err) => {
    console.error(`❌ Error reading log file: ${err.message}`);
  });

  stream.on('end', () => {
    console.log('📄 Reached end of file');
  });
}

// Parse log level from message
function parseLogLevel(message: string): string {
  const upperMessage = message.toUpperCase();

  if (upperMessage.includes('ERROR')) return 'error';
  if (upperMessage.includes('WARN')) return 'warning';
  if (upperMessage.includes('INFO')) return 'info';
  if (upperMessage.includes('DEBUG')) return 'debug';
  if (upperMessage.includes('FATAL')) return 'critical';
  if (upperMessage.includes('TRACE')) return 'trace';

  return 'info';
}

// Get log level color
function getLevelColor(level: string): string {
  const colors = {
    error: '#ff0000',      // Red
    critical: '#ff0000',   // Red
    warning: '#ffff00',    // Yellow
    info: '#00ff00',      // Green
    debug: '#00ffff',     // Cyan
    trace: '#888888'       // Gray
  };

  return colors[level] || '#ffffff';
}

// Watch for file changes
function watchLogFile() {
  watchFile(LOG_FILE, (curr, prev) => {
    if (curr.size > prev.size) {
      console.log(`📄 File changed: ${prev.size} -> ${curr.size}`);
      tailLogFile();
    }
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current file position
  socket.emit('connected', {
    position: filePosition,
    timestamp: new Date().toISOString()
  });

  // Send buffered logs (last 100 lines)
  if (existsSync(LOG_FILE)) {
    const stats = statSync(LOG_FILE);
    const bufferSize = Math.min(stats.size, 10000); // Last 10KB

    const bufferStream = createReadStream(LOG_FILE, {
      start: Math.max(0, stats.size - bufferSize),
      encoding: 'utf8'
    });

    const bufferLines: string[] = [];

    bufferStream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      bufferLines.push(...lines);
    });

    bufferStream.on('end', () => {
      const lastLines = bufferLines.slice(-100); // Last 100 lines

      lastLines.forEach(line => {
        const level = parseLogLevel(line);
        const logEntry = {
          timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
          level,
          message: line,
          raw: line
        };
        socket.emit('log', logEntry);
      });

      socket.emit('ready', {
        count: lastLines.length,
        position: filePosition
      });
    });
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  socket.on('error', (err) => {
    console.error(`❌ Socket error: ${err.message}`);
  });
});

// Health check
io.on('health', (callback) => {
  callback({
    status: 'ok',
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    file: LOG_FILE,
    position: filePosition
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║               🌊 Vox Stream - Log Tailing Service             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                                             ║`);
  console.log(`║   Log File: ${LOG_FILE}                                    ║`);
  console.log(`║   Position: ${filePosition} bytes                                ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║   🟢 Server running - Tail log file...                ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║   ⚠️  Press Ctrl+C to stop                                 ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Start tailing
  tailLogFile();

  // Watch for file changes
  watchLogFile();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...\n');

  io.emit('shutdown', {
    message: 'Server shutting down',
    timestamp: new Date().toISOString()
  });

  setTimeout(() => {
    io.close();
    httpServer.close();
    console.log('✅ Server stopped');
    process.exit(0);
  }, 1000);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
