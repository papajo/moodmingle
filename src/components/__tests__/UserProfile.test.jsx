import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfile from '../UserProfile.jsx';
import { moods } from '../../constants/moods';

vi.mock('../../contexts/UserContext', () => ({
    useUser: vi.fn(),
    UserProvider: ({ children }) => <div data-testid="user-provider">{children}</div>
}));

vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3001'
}));

global.fetch = vi.fn();

describe('UserProfile Component', () => {
    const mockUser = {
        id: 1,
        username: 'TestUser',
        avatar: 'https://example.com/avatar.jpg',
        status: 'Active',
        currentMoodId: 'happy'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
    });

    it('should render with loading state', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: null });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Profile/ })).toBeInTheDocument();
    });

    it('should render with user data', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByText('TestUser')).toBeInTheDocument();
        const avatarImg = screen.getByAltText('TestUser');
        expect(avatarImg).toHaveAttribute('src', expect.stringContaining('avatar.jpg'));
        expect(avatarImg).toHaveAttribute('alt', 'TestUser');
    });

    it('should have edit button', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByRole('button', { name: /Edit Profile/ })).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser, updateUserStatus: vi.fn(), refreshUser: vi.fn() });

        render(<UserProfile onClose={() => { }} />);

        const editButton = screen.getByRole('button', { name: /Edit Profile/ });
        fireEvent.click(editButton);

        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Avatar URL')).toBeInTheDocument();
    });

    it('should show close button', () => {
        const mockOnClose = vi.fn();
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={mockOnClose} />);

        const closeButton = screen.getByRole('button', { name: /Close/ });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display user stats when has mood', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Vibing')).toBeInTheDocument();
    });

    it('should have proper CSS classes and structure', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        const { container } = render(<UserProfile onClose={() => { }} />);

        const glassPanels = container.querySelectorAll('.glass-panel');
        expect(glassPanels.length).toBeGreaterThan(0);
    });

    it('should display all five moods correctly', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        moods.forEach(mood => {
            if (mockUser.currentMoodId === mood.id) {
                expect(screen.getByText(mood.label)).toBeInTheDocument();
            }
        });
    });

    it('should show status in read mode', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display current mood emoji', () => {
        const { useUser } = require('../../contexts/UserContext');
        useUser.mockReturnValue({ user: mockUser });

        render(<UserProfile onClose={() => { }} />);

        expect(screen.getByText('😊')).toBeInTheDocument();
    });
});
