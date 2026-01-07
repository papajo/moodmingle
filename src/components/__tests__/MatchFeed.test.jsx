import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MatchFeed from '../MatchFeed';
import { UserProvider } from '../../contexts/UserContext';

// Mock the API_URL
vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3001'
}));

// Mock fetch
global.fetch = vi.fn();

// Mock UserContext
const mockUser = { id: 1, username: 'TestUser' };
const MockUserProvider = ({ children }) => (
    <UserProvider value={{ user: mockUser }}>
        {children}
    </UserProvider>
);

// We need to mock the useUser hook directly since we can't easily wrap with the real provider in this setup without more mocking
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({ user: { id: 1, username: 'TestUser' } })
}));

describe('MatchFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show prompt when no mood is selected', () => {
        render(<MatchFeed currentMood={null} />);
        expect(screen.getByText(/Select a mood to find your tribe/i)).toBeInTheDocument();
    });

    it('should show loading state when fetching matches', async () => {
        fetch.mockImplementationOnce(() => new Promise(() => { })); // Never resolves

        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);

        expect(screen.getByText(/Finding your vibe matches/i)).toBeInTheDocument();
    });

    it('should display matches when fetch is successful', async () => {
        const mockMatches = [
            { id: 2, name: 'MatchUser', avatar: 'avatar.jpg', status: 'Chilling' }
        ];

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockMatches
        });

        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);

        await waitFor(() => {
            expect(screen.getByText('MatchUser')).toBeInTheDocument();
            expect(screen.getByText('Chilling')).toBeInTheDocument();
        });
    });

    it('should show empty state when no matches found', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);

        await waitFor(() => {
            expect(screen.getByText(/No one else is feeling this exact vibe/i)).toBeInTheDocument();
        });
    });
});
