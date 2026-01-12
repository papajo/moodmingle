import { jest } from '@jest/globals';

// Mock sqlite and sqlite3
jest.unstable_mockModule('sqlite', () => ({
    open: jest.fn(() => Promise.resolve({
        exec: jest.fn(),
        all: jest.fn(() => Promise.resolve({ rows: [] })),
        run: jest.fn(() => Promise.resolve({ lastID: 1 }))
    }))
}));

jest.unstable_mockModule('sqlite3', () => ({
    default: jest.fn(),
    Database: jest.fn()
}));

describe('Database Module', () => {
    it('should export query function', async () => {
        const db = await import('../db.js');
        expect(typeof db.query).toBe('function');
        expect(typeof db.getClient).toBe('function');
        expect(typeof db.initializeDatabase).toBe('function');
    });

    it('should have default connection settings', async () => {
        const db = await import('../db.js');
        expect(db.default).toBeDefined();
    });
});
