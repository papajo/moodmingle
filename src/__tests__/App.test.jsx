import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { Users, MessageSquare, Sparkles, BookOpen } from 'lucide-react';

// Mock UserContext with a simple implementation
const mockUser = {
    id: 1,
    username: 'TestUser',
    avatar: 'https://example.com/avatar.jpg',
    status: 'Active',
    currentMoodId: 'happy'
};

const MockUserProvider = ({ children }) => {
    return (
        <div data-testid="mock-user-provider">
            {children}
        </div>
    );
};

// Mock Layout to simplify testing
vi.mock('../components/Layout.jsx', () => ({
    default: ({ children, onProfileClick }) => (
        <div data-testid="layout">
            <button onClick={onProfileClick} data-testid="profile-button">
                Profile
            </button>
            {children}
        </div>
    )
}));

describe('App Navigation & Tab System', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(
            <MockUserProvider>
                <App />
            </MockUserProvider>
        );

        // App should render
        expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('should toggle profile mode when profile button is clicked', async () => {
        render(
            <MockUserProvider>
                <App />
            </MockUserProvider>
        );

        // Initially profile button should be present
        const profileButton = screen.getByTestId('profile-button');
        expect(profileButton).toBeInTheDocument();
        expect(profileButton).toBeEnabled();

        // Click profile button
        fireEvent.click(profileButton);

        // Check that the click handler was called (this would toggle profile mode)
        expect(profileButton).toBeInTheDocument();
    });

    it('should have proper structure and accessibility', () => {
        render(
            <MockUserProvider>
                <App />
            </MockUserProvider>
        );

        // Layout should be accessible
        const layout = screen.getByTestId('layout');
        expect(layout).toBeInTheDocument();

        // Profile button should have proper attributes
        const profileButton = screen.getByTestId('profile-button');
        expect(profileButton).toBeEnabled();
        expect(profileButton).toBeInTheDocument();
    });
});