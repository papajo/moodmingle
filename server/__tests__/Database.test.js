import { jest } from '@jest/globals';

// Mock pg
jest.unstable_mockModule('pg', () => {
    const mPool = jest.fn(() => ({
        query: jest.fn(),
        on: jest.fn(),
        connect: jest.fn()
    }));
    return {
        default: { Pool: mPool },
        Pool: mPool
    };
});

describe('Database Module', () => {
    it('should export query function', async () => {
        const db = await import('../db.js');
        expect(typeof db.query).toBe('function');
        expect(typeof db.getClient).toBe('function');
    });

    it('should have default connection settings', async () => {
        const db = await import('../db.js');
        expect(db.default).toBeDefined();
    });
});
