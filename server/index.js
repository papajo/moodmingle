import 'dotenv/config';
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

export const app = express();
export const httpServer = createServer(app);

const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const dbPath = process.env.DB_PATH || './moodmingle.db';

const io = new Server(httpServer, {
    cors: {
        origin: frontendUrl,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
    origin: frontendUrl,
    credentials: true
}));
app.use(bodyParser.json());

// Database Setup
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      avatar TEXT,
      status TEXT,
      current_mood_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Mood Logs (now with user_id)
        db.run(`CREATE TABLE IF NOT EXISTS mood_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      mood_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

        // Journal Entries (now with user_id)
        db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      text TEXT,
      date TEXT,
      time TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

        // Messages (for Vibe Rooms) - now with user_id
        db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT,
      user_id INTEGER,
      user TEXT,
      text TEXT,
      time TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

        // Migration: Add user_id columns if they don't exist
        db.all(`PRAGMA table_info(mood_logs)`, (err, rows) => {
            if (!err && rows) {
                const hasUserId = rows.some(row => row.name === 'user_id');
                if (!hasUserId) {
                    db.run(`ALTER TABLE mood_logs ADD COLUMN user_id INTEGER`, (alterErr) => {
                        if (alterErr) {
                            console.log('Migration note (mood_logs):', alterErr.message);
                        } else {
                            console.log('✓ Added user_id column to mood_logs');
                        }
                    });
                }
            }
        });

        db.all(`PRAGMA table_info(journal_entries)`, (err, rows) => {
            if (!err && rows) {
                const hasUserId = rows.some(row => row.name === 'user_id');
                if (!hasUserId) {
                    db.run(`ALTER TABLE journal_entries ADD COLUMN user_id INTEGER`, (alterErr) => {
                        if (alterErr) {
                            console.log('Migration note (journal_entries):', alterErr.message);
                        } else {
                            console.log('✓ Added user_id column to journal_entries');
                        }
                    });
                }
            }
        });

        db.all(`PRAGMA table_info(messages)`, (err, rows) => {
            if (!err && rows) {
                const hasUserId = rows.some(row => row.name === 'user_id');
                if (!hasUserId) {
                    db.run(`ALTER TABLE messages ADD COLUMN user_id INTEGER`, (alterErr) => {
                        if (alterErr) {
                            console.log('Migration note (messages):', alterErr.message);
                        } else {
                            console.log('✓ Added user_id column to messages');
                        }
                    });
                }
            }
        });
    });
}

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    let currentRoom = null;
    let currentUserId = null;

    socket.on('join_room', (data) => {
        const roomId = typeof data === 'string' ? data : data.roomId;
        const userId = typeof data === 'object' ? data.userId : null;

        if (currentRoom) {
            socket.leave(currentRoom);
        }

        socket.join(roomId);
        currentRoom = roomId;
        currentUserId = userId;
        console.log(`User ${socket.id} (${userId}) joined room: ${roomId}`);
    });

    socket.on('typing_start', (data) => {
        const { roomId, userId, username } = data;
        socket.to(roomId).emit('user_typing', { userId, username });
    });

    socket.on('typing_stop', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit('user_stopped_typing', { userId });
    });

    socket.on('send_message', (data) => {
        // Save to DB
        const { roomId, userId, user, text, time } = data;
        db.run('INSERT INTO messages (room_id, user_id, user, text, time) VALUES (?, ?, ?, ?, ?)',
            [roomId, userId, user, text, time],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                // Get user avatar from database
                db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, userRow) => {
                    const savedMsg = {
                        id: this.lastID,
                        roomId,
                        userId,
                        user,
                        text,
                        time,
                        avatar: userRow?.avatar || null
                    };
                    // Broadcast to everyone in the room INCLUDING sender (simplifies frontend state)
                    io.to(roomId).emit('receive_message', savedMsg);
                });
            }
        );
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.to(currentRoom).emit('user_left', { userId: currentUserId });
        }
        console.log('User disconnected:', socket.id);
    });
});

// --- API Endpoints ---

// User Management
// Create or get user
app.post('/api/users', (req, res) => {
    const { username, avatar } = req.body;
    if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
    }

    // Try to find existing user
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            // Update last_active
            db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
            res.json({ id: row.id, username: row.username, avatar: row.avatar, status: row.status, currentMoodId: row.current_mood_id });
        } else {
            // Create new user
            db.run('INSERT INTO users (username, avatar, status) VALUES (?, ?, ?)',
                [username, avatar || `https://i.pravatar.cc/150?u=${username}`, 'Just joined!'],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ id: this.lastID, username, avatar: avatar || `https://i.pravatar.cc/150?u=${username}`, status: 'Just joined!', currentMoodId: null });
                }
            );
        }
    });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            id: row.id,
            username: row.username,
            avatar: row.avatar,
            status: row.status,
            currentMoodId: row.current_mood_id
        });
    });
});

// Update user status
app.patch('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { status, avatar } = req.body;
    const updates = [];
    const values = [];

    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (avatar !== undefined) {
        updates.push('avatar = ?');
        values.push(avatar);
    }

    if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
    }

    values.push(id);
    db.run(`UPDATE users SET ${updates.join(', ')}, last_active = CURRENT_TIMESTAMP WHERE id = ?`, values, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Get users matching current mood
app.get('/api/users/match/:moodId', (req, res) => {
    const { moodId } = req.params;
    db.all(`SELECT id, username, avatar, status, current_mood_id 
            FROM users 
            WHERE current_mood_id = ? AND last_active > datetime('now', '-1 hour')
            ORDER BY last_active DESC
            LIMIT 20`, [moodId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const users = rows.map(row => ({
            id: row.id,
            name: row.username,
            avatar: row.avatar,
            status: row.status,
            moodId: row.current_mood_id
        }));
        res.json(users);
    });
});

// Get latest mood for a user
app.get('/api/mood/:userId', (req, res) => {
    const { userId } = req.params;
    db.get('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row ? { id: row.mood_id } : null);
    });
});

// Set mood for a user
app.post('/api/mood', (req, res) => {
    const { userId, moodId } = req.body;
    if (!moodId) {
        res.status(400).json({ error: 'Mood ID is required' });
        return;
    }
    if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }

    // Update user's current mood
    db.run('UPDATE users SET current_mood_id = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?', [moodId, userId], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
    });

    // Log mood change
    db.run('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [userId, moodId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, userId, moodId });
    });
});

// Get journal entries for a user
app.get('/api/journal/:userId', (req, res) => {
    const { userId } = req.params;
    db.all('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC', [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Save journal entry
app.post('/api/journal', (req, res) => {
    const { userId, text, date, time } = req.body;
    if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    db.run('INSERT INTO journal_entries (user_id, text, date, time) VALUES (?, ?, ?, ?)', [userId, text, date, time], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, userId, text, date, time });
    });
});

// Get messages for a room (History)
app.get('/api/messages/:roomId', (req, res) => {
    const { roomId } = req.params;
    db.all(`SELECT m.*, u.avatar 
            FROM messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            WHERE m.room_id = ? 
            ORDER BY m.id ASC`, [roomId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Transform snake_case to camelCase for frontend
        const messages = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            user: row.user,
            text: row.text,
            time: row.time,
            avatar: row.avatar
        }));
        res.json(messages);
    });
});

// Only start server if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    httpServer.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

