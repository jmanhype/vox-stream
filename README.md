# Vox Stream

Real-time WebSocket log visualizer with Matrix-style theme.

## 🌊 Features

- ✅ **Log Tailing Backend** - Tails log files and streams via WebSocket
- ✅ **Socket.io Server** - Real-time log broadcasting
- ✅ **Matrix Theme** - Beautiful green-on-black cyber interface
- ✅ **Live Streaming** - Auto-scroll to latest logs
- ✅ **Level Filtering** - Filter by ERROR, WARN, INFO, DEBUG
- ✅ **Pause/Resume** - Control log streaming
- ✅ **Health Monitoring** - Server uptime and connection count
- ✅ **Matrix Rain** - Ambient background effect

## 📁 Project Structure

```
vox-stream/
├── server/
│   ├── index.js          # Socket.io log tailer
│   └── package.json
├── dashboard/
│   ├── src/app/page.tsx  # Real-time dashboard
│   └── package.json
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/vox-stream.git
cd vox-stream

# Install backend
cd server
npm install

# Install dashboard
cd ../dashboard
npm install
```

### 2. Run Backend Server

```bash
cd server
npm start
```

Server runs on: http://localhost:3001

**Features:**
- Tails `./app.log` by default
- Auto-reconnects on file changes
- Broadcasts logs via WebSocket
- Health check endpoint

### 3. Run Dashboard

```bash
cd dashboard
npm run dev
```

Dashboard runs on: http://localhost:3000

## 🎨 Dashboard Features

### Header

- **Connection Status** - Animated green/red indicator
- **Filter Dropdown** - All, Error, Warning, Info, Debug
- **Pause/Resume** - Stop/start log streaming
- **Clear Logs** - Clear all displayed logs
- **Health Stats** - Server uptime, connected clients

### Log Stream

- **Auto-Scroll** - Scrolls to newest log
- **Level Colors** - Red (error), Yellow (warning), Green (info), Cyan (debug)
- **Level Icons** - ❌ (error), ⚠️ (warning), ℹ️ (info), 🔍 (debug)
- **Timestamp** - Formatted time display
- **Hover Highlight** - Matrix-style highlight on hover

### Matrix Rain Effect

- Ambient green code rain
- Random characters
- Subtle opacity
- Adds cyber atmosphere

## 🔌 Backend Features

### Log Tailing

```javascript
// Tails log file from position
const stream = fs.createReadStream(logPath, { start: position });

stream.on('data', (chunk) => {
  const lines = chunk.toString().split('\n');
  io.emit('log', lines);
});
```

### Socket.io Events

| Event | Direction | Description |
|--------|-----------|-------------|
| `connect` | Server → Client | Connected confirmation |
| `disconnect` | Server → Client | Disconnected notification |
| `log` | Server → Client | New log entry |
| `ready` | Server → Client | Buffered logs sent |
| `health` | Client → Server | Health check (every 5s) |
| `shutdown` | Server → Client | Server shutting down |

### Log Level Parsing

Automatically detects log levels:

- `ERROR` → `error` (red)
- `WARN` → `warning` (yellow)
- `INFO` → `info` (green)
- `DEBUG` → `debug` (cyan)
- `FATAL` → `critical` (red)
- `TRACE` → `trace` (gray)

## 🔌 Configuration

### Backend Environment Variables

```bash
PORT=3001                              # WebSocket server port
LOG_FILE=./app.log                  # Log file to tail
```

### Dashboard Configuration

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:3001  # WebSocket server URL
```

## 📄 Example Log Format

```
2024-02-08T05:45:30.123Z [INFO] Server started on port 3001
2024-02-08T05:45:31.456Z [DEBUG] Watching app.log for changes
2024-02-08T05:45:32.789Z [WARN] Slow query detected: 500ms
2024-02-08T05:45:33.012Z [ERROR] Connection failed to database
2024-02-08T05:45:34.567Z [INFO] User logged in: user@example.com
```

## 🎨 Matrix Theme Colors

```css
/* Backgrounds */
--black: #000000
--black-50: rgba(0, 0, 0, 0.5)
--black-90: rgba(0, 0, 0, 0.1)

/* Greens */
--green-500: #22c55e
--green-900: #14532d
--green-900/30: rgba(20, 83, 45, 0.3)
--green-500/70: rgba(34, 197, 94, 0.7)

/* Accents */
--red-500: #ef4444
--yellow-500: #eab308
--cyan-500: #06b6d4
--gray-500: #6b7280
```

## 🧪 Usage

### Starting the Server

```bash
cd server
npm start
```

Output:
```
╔════════════════════════════════════════════════╗
║               🌊 Vox Stream - Log Tailing Service             ║
╠════════════════════════════════════════════════╣
║   Port: 3001                                             ║
║   Log File: ./app.log                                    ║
║   Position: 0 bytes                                ║
╠══════════════════════════════════════════════════╣
║   🟢 Server running - Tail log file...                ║
╠══════════════════════════════════════════════════╣
║   ⚠️  Press Ctrl+C to stop                                 ║
╚════════════════════════════════════════════════════╝
```

### Viewing Logs

1. Open dashboard: http://localhost:3000
2. Wait for connection (green indicator)
3. View logs streaming in real-time
4. Use filter dropdown to isolate errors
5. Pause/resume to control flow

### Health Monitoring

Dashboard checks server health every 5 seconds:

- Server uptime
- Connected clients count
- Log file position

## 🚀 Deployment

### Backend (Heroku/Render)

```bash
cd server
npm install
heroku create vox-stream-server
git push heroku main
```

### Dashboard (Vercel)

```bash
cd dashboard
npm run build
vercel --prod
```

## 📊 Scaling

- **Backend:** Use multiple servers for load balancing
- **Frontend:** Statelessly connects to any server
- **Logs:** Store in S3/GCS for remote access

## 🔌 Customization

### Add Custom Log Patterns

Edit `server/index.js` to customize level parsing:

```javascript
function parseLogLevel(message: string): string {
  if (message.includes('[CUSTOM]')) return 'custom';
  return 'info';
}
```

### Modify Matrix Theme

Edit `dashboard/src/app/page.tsx` colors:

```javascript
const colors = {
  background: '#000000',
  primary: '#00ff00',  // Change to any hex
  // ...
};
```

## 📚 License

MIT

---

Built with 🌊 for log monitoring enthusiasts
