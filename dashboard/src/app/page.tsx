'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000
});

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}

export default function StreamDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [health, setHealth] = useState<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Socket connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
      setConnectionCount(prev => prev + 1);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    socket.on('log', (entry: LogEntry) => {
      setLogs(prev => {
        const updated = [...prev, entry];

        // Keep last 1000 logs
        if (updated.length > 1000) {
          return updated.slice(-1000);
        }

        return updated;
      });
    });

    socket.on('ready', (data: any) => {
      console.log('✅ Ready:', data);
    });

    socket.on('connected', (data: any) => {
      console.log('🔌 Server confirmed connection:', data);
    });

    socket.on('shutdown', (data: any) => {
      console.log('🛑 Server shutting down:', data);
      setIsConnected(false);
    });

    socket.on('error', (err: any) => {
      console.error('❌ Socket error:', err);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('log');
      socket.off('ready');
      socket.off('connected');
      socket.off('shutdown');
      socket.off('error');
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [logs]);

  // Check health status
  useEffect(() => {
    const checkHealth = setInterval(() => {
      socket.emit('health', (data: any) => {
        setHealth(data);
      });
    }, 5000);

    return () => clearInterval(checkHealth);
  }, []);

  function clearLogs() {
    setLogs([]);
  }

  function togglePause() {
    setIsPaused(!isPaused);
  }

  function getLevelColor(level: string): string {
    const colors = {
      error: 'text-red-500',
      critical: 'text-red-600 font-bold',
      warning: 'text-yellow-500',
      info: 'text-green-500',
      debug: 'text-cyan-500',
      trace: 'text-gray-500'
    };

    return colors[level] || 'text-white';
  }

  function getLevelIcon(level: string): string {
    const icons = {
      error: '❌',
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
      trace: '📍'
    };

    return icons[level] || '📄';
  }

  function filteredLogs(): LogEntry[] {
    if (filterLevel === 'all') return logs;
    return logs.filter(log => log.level === filterLevel);
  }

  return (
    <div className="min-h-screen bg-black font-mono">
      {/* Matrix-style Header */}
      <div className="border-b border-green-900 bg-black/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-green-500 tracking-widest">
              VOX STREAM
            </h1>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-sm text-green-500">
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            {health && (
              <div className="text-xs text-green-500/70">
                Uptime: {Math.floor(health.uptime / 60)}m | 
                Clients: {health.connections}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-black border border-green-900 text-green-500 px-4 py-2 rounded-lg text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
              <option value="debug">Debug Only</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
              className="bg-green-900/30 border border-green-900 text-green-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearLogs}
              className="bg-red-900/30 border border-red-900 text-red-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              🗑️ Clear
            </motion.button>
          </div>
        </div>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={logsEndRef}
          className="h-full overflow-y-auto p-4 font-mono text-sm leading-relaxed scroll-smooth"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 39px,
                rgba(0, 255, 0, 0.1) 40px
              )
            `
          }}
        >
          <AnimatePresence>
            {filteredLogs().map((log, index) => (
              <motion.div
                key={`${log.timestamp}-${index}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="mb-1 hover:bg-green-900/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-green-500/70 text-xs font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>

                  <span className={getLevelIcon(log.level)}>
                    {getLevelIcon(log.level)}
                  </span>

                  <span className={`flex-1 break-all ${getLevelColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredLogs().length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🌊</div>
                <h3 className="text-2xl font-bold text-green-500 mb-2">
                  Waiting for logs...
                </h3>
                <p className="text-green-500/70">
                  Connect to WebSocket server to start streaming
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-green-900 bg-black/50 p-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-green-500/70">
          <div>
            <span className="mr-4">
              Logs: {logs.length}
            </span>
            <span className="mr-4">
              Filtered: {filteredLogs().length}
            </span>
            <span>
              {isPaused ? '⏸️ PAUSED' : '🟢 LIVE'}
            </span>
          </div>
          <div>
            <span>Port: 3001</span>
          </div>
        </div>
      </div>

      {/* Matrix Rain Effect (Optional) */}
      <div className="fixed inset-0 pointer-events-none opacity-5 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-500/20 font-mono text-xs"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, 100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {String.fromCharCode(0x30 + Math.floor(Math.random() * 10))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
