import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db, { initializeDatabase } from './db.js';

// Input validation utilities
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required and must be a string' };
    }
    if (username.length < 3 || username.length > 30) {
        return { valid: false, error: 'Username must be between 3 and 30 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    return { valid: true, sanitized: username.trim() };
};

const validateMoodId = (moodId) => {
    if (!moodId || typeof moodId !== 'string') {
        return { valid: false, error: 'Mood ID is required and must be a string' };
    }
    const validMoods = ['happy', 'chill', 'energetic', 'sad', 'romantic'];
    if (!validMoods.includes(moodId.toLowerCase())) {
        return { valid: false, error: 'Invalid mood ID' };
    }
    return { valid: true, sanitized: moodId.toLowerCase() };
};

const validateUserId = (userId) => {
    const id = parseInt(userId);
    if (isNaN(id) || id <= 0) {
        return { valid: false, error: 'Invalid user ID' };
    }
    return { valid: true, sanitized: id };
};

const validateJournalText = (text) => {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Journal text is required and must be a string' };
    }
    if (text.length > 2000) {
        return { valid: false, error: 'Journal text cannot exceed 2000 characters' };
    }
    return { valid: true, sanitized: text.trim() };
};

const validateMessageText = (text) => {
    if (!text || typeof text !== 'string') {
        return { valid: false, error: 'Message text is required and must be a string' };
    }
    if (text.length > 500) {
        return { valid: false, error: 'Message text cannot exceed 500 characters' };
    }
    return { valid: true, sanitized: text.trim() };
};

export const app = express();
export const httpServer = createServer(app);

const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

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

// Initialize Database with SQLite
const initializeDatabaseTables = async () => {
    try {
        console.log('Initializing SQLite database...');
        
        // Remove existing database file for clean start (manual)
        console.log('Note: Remove moodmingle.db manually for clean database');
        
        await initializeDatabase();

        // Define tables with SQLite syntax
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) UNIQUE NOT NULL,
            avatar TEXT,
            status TEXT,
            current_mood_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS mood_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            mood_id VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            text TEXT,
            date VARCHAR(50),
            time VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id VARCHAR(50),
            user_id INTEGER,
            "user" VARCHAR(255),
            text TEXT,
            time VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER,
            reported_id INTEGER,
            reason TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS blocked_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blocker_id INTEGER,
            blocked_id INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(blocker_id, blocked_id)
        )`);

        console.log('Database tables initialized successfully');
    } catch (err) {
        console.error(`Database initialization failed: ${err.message}`);
        process.exit(1);
    }
};






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
        console.log(`User ${socket.id} (${userId}) joined room: ${roomId} `);
    });

    socket.on('typing_start', (data) => {
        const { roomId, userId, username } = data;
        socket.to(roomId).emit('user_typing', { userId, username });
    });

    socket.on('typing_stop', (data) => {
        const { roomId, userId } = data;
        socket.to(roomId).emit('user_stopped_typing', { userId });
    });

    socket.on('send_message', async (data) => {
        try {
            // Validate input data
            const { roomId, userId, user, text, time } = data;

            // Validate message text
            const textValidation = validateMessageText(text);
            if (!textValidation.valid) {
                socket.emit('error', { message: textValidation.error });
                return;
            }

            // Validate user ID
            const userIdValidation = validateUserId(userId);
            if (!userIdValidation.valid) {
                socket.emit('error', { message: userIdValidation.error });
                return;
            }

            // Validate room ID (mood)
            const roomValidation = validateMoodId(roomId);
            if (!roomValidation.valid) {
                socket.emit('error', { message: roomValidation.error });
                return;
            }

            const sanitizedText = textValidation.sanitized;
            const sanitizedUserId = userIdValidation.sanitized;
            const sanitizedRoomId = roomValidation.sanitized;
            const sanitizedUser = user ? user.toString().trim().substring(0, 30) : 'Anonymous';

        const result = await db.query(
            'INSERT INTO messages (room_id, user_id, "user", text, time) VALUES (?, ?, ?, ?, ?)',
            [sanitizedRoomId, sanitizedUserId, sanitizedUser, sanitizedText, time]
        );

        const messageId = result.rows[0]?.id;

            // Get user avatar from database
            const { rows: userRows } = await db.query('SELECT avatar FROM users WHERE id = ?', [sanitizedUserId]);
            const userRow = userRows[0];

            const savedMsg = {
                id: messageId,
                roomId: sanitizedRoomId,
                userId: sanitizedUserId,
                user: sanitizedUser,
                text: sanitizedText,
                time,
                avatar: userRow?.avatar || null
            };
            // Broadcast to everyone in the room INCLUDING sender (simplifies frontend state)
            io.to(sanitizedRoomId).emit('receive_message', savedMsg);
        } catch (err) {
            console.error('Socket error:', err.message);
            socket.emit('error', { message: 'Failed to send message' });
        }
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
app.post('/api/users', async (req, res) => {
    try {
        const { username, avatar } = req.body;

        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            res.status(400).json({ error: usernameValidation.error });
            return;
        }

        const sanitizedUsername = usernameValidation.sanitized;

        // Try to find existing user
        const { rows } = await db.query('SELECT * FROM users WHERE username = ?', [sanitizedUsername]);
        const row = rows[0];

        if (row) {
            // Update last_active
            await db.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
            res.json({ id: row.id, username: row.username, avatar: row.avatar, status: row.status, currentMoodId: row.current_mood_id });
        } else {
            // Create new user
            const defaultAvatar = avatar || `https://i.pravatar.cc/150?u=${sanitizedUsername}`;
            const result = await db.query(
                'INSERT INTO users (username, avatar, status) VALUES (?, ?, ?)',
                [sanitizedUsername, defaultAvatar, 'Just joined!']
            );
            const newId = result.rows[0]?.id;
            res.json({ id: newId, username: sanitizedUsername, avatar: defaultAvatar, status: 'Just joined!', currentMoodId: null });

        }
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(id);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM users WHERE id = ?', [sanitizedId]);
        const row = rows[0];

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user status
app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, avatar } = req.body;

        // Validate user ID
        const userIdValidation = validateUserId(id);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (status !== undefined) {
            if (typeof status !== 'string' || status.length > 100) {
                res.status(400).json({ error: 'Status must be a string with max 100 characters' });
                return;
            }
            updates.push(`status = $${paramIndex++}`);
            values.push(status.trim());
        }
        if (avatar !== undefined) {
            if (typeof avatar !== 'string' || avatar.length > 500) {
                res.status(400).json({ error: 'Avatar must be a string with max 500 characters' });
                return;
            }
            updates.push(`avatar = $${paramIndex++}`);
            values.push(avatar.trim());
        }

        if (updates.length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        values.push(id);
        await db.query(`UPDATE users SET ${updates.join(', ')}, last_active = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get users matching current mood
app.get('/api/users/match/:moodId', async (req, res) => {
    try {
        const { moodId } = req.params;

        // Validate mood ID
        const moodValidation = validateMoodId(moodId);
        if (!moodValidation.valid) {
            res.status(400).json({ error: moodValidation.error });
            return;
        }

        const sanitizedMoodId = moodValidation.sanitized;

        // Get users with current mood (remove 1-hour filter for testing)
        const { rows } = await db.query(`
            SELECT id, username, avatar, status, current_mood_id 
            FROM users 
            WHERE current_mood_id = ?
            ORDER BY id DESC
            LIMIT 20`, [sanitizedMoodId]);

        console.log(`Debug: Found ${rows.length} users for mood ${sanitizedMoodId}:`, rows.map(r => ({id: r.id, name: r.username})));

        const users = rows.map(row => ({
            id: row.id,
            name: row.username,
            avatar: row.avatar,
            status: row.status,
            moodId: row.current_mood_id
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get latest mood for a user
app.get('/api/mood/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY id DESC LIMIT 1', [sanitizedUserId]);
        const row = rows[0];
        res.json(row ? { id: row.mood_id } : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set mood for a user
app.post('/api/mood', async (req, res) => {
    try {
        const { userId, moodId } = req.body;

        // Validate inputs
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const moodValidation = validateMoodId(moodId);
        if (!moodValidation.valid) {
            res.status(400).json({ error: moodValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        const sanitizedMoodId = moodValidation.sanitized;

        // Update user's current mood
        await db.query('UPDATE users SET current_mood_id = ?, last_active = datetime("now") WHERE id = ?', [sanitizedMoodId, sanitizedUserId]);

        // Log mood change
        try {
            const result = await db.query('INSERT INTO mood_logs (user_id, mood_id) VALUES (?, ?)', [sanitizedUserId, sanitizedMoodId]);
            const moodLogId = result.rows[0]?.id;
        } catch (err) {
            console.error('Failed to log mood change:', err);
            // Continue without logging mood change
        }

        res.json({ id: moodLogId, userId: sanitizedUserId, moodId: sanitizedMoodId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get journal entries for a user
app.get('/api/journal/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;

        const { rows } = await db.query('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY id DESC', [sanitizedUserId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save journal entry
app.post('/api/journal', async (req, res) => {
    try {
        const { userId, text, date, time } = req.body;
        // Validate inputs
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            res.status(400).json({ error: userIdValidation.error });
            return;
        }

        const textValidation = validateJournalText(text);
        if (!textValidation.valid) {
            res.status(400).json({ error: textValidation.error });
            return;
        }

        const sanitizedUserId = userIdValidation.sanitized;
        const sanitizedText = textValidation.sanitized;

        const result = await db.query(
            'INSERT INTO journal_entries (user_id, text, date, time) VALUES (?, ?, ?, ?)',
            [sanitizedUserId, sanitizedText, date, time]
        );
        const journalId = result.rows[0]?.id;
        res.json({ id: journalId, userId, text, date, time });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Report a user
app.post('/api/report', async (req, res) => {
    try {
        const { reporterId, reportedId, reason } = req.body;

        // Validate inputs (Basic)
        if (!reporterId || !reportedId || !reason) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        await db.query(
            'INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)',
            [reporterId, reportedId, reason]
        );

        res.json({ success: true, message: 'User reported successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Block a user
app.post('/api/block', async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;

        if (!blockerId || !blockedId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        await db.query(
            'INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, blockedId]
        );

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get blocked users for a user
app.get('/api/blocks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { rows } = await db.query(
            'SELECT blocked_id FROM blocked_users WHERE blocker_id = ?',
            [userId]
        );
        res.json(rows.map(r => r.blocked_id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get messages for a room (History)
app.get('/api/messages/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { rows } = await db.query(`
            SELECT m.*, u.avatar 
            FROM messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            WHERE m.room_id = ? 
            ORDER BY m.id ASC`, [roomId]);

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Only start server if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    initializeDatabaseTables().then(() => {
        httpServer.listen(port, '0.0.0.0', () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    }).catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
