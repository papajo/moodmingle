import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Journal from '../Journal';

vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({ user: { id: 1, username: 'TestUser' } })
}));

vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3001'
}));

global.fetch = vi.fn();

describe('Journal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
    });

    it('should render journal interface', async () => {
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        render(<Journal />);

        await waitFor(() => {
            expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/How are you feeling right now/)).toBeInTheDocument();
        });
    });

    it('should render journal entries', async () => {
        const mockEntries = [
            { id: 1, userId: 1, text: 'First entry', date: '1/1/2024', time: '10:00 AM' },
            { id: 2, userId: 1, text: 'Second entry', date: '1/2/2024', time: '11:00 AM' }
        ];

        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEntries)
        }));

        render(<Journal />);

        await waitFor(() => {
            expect(screen.getByText('First entry')).toBeInTheDocument();
            expect(screen.getByText('Second entry')).toBeInTheDocument();
        });
    });

    it('should show empty state when no entries', async () => {
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        render(<Journal />);

        await waitFor(() => {
            expect(screen.getByText('No entries yet. Start writing!')).toBeInTheDocument();
        });
    });

    it('should save journal entry', async () => {
        const newEntry = { id: 3, userId: 1, text: 'New entry', date: '1/3/2024', time: '12:00 PM' };
        let fetchCallCount = 0;

        fetch.mockImplementation(() => {
            fetchCallCount++;
            if (fetchCallCount === 1) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            } else {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(newEntry)
                });
            }
        });

        render(<Journal />);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText(/How are you feeling right now/);
            fireEvent.change(textarea, { target: { value: 'New entry' } });
        });

        const saveButton = screen.getByRole('button', { name: /Save Entry/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('New entry')).toBeInTheDocument();
        });
    });

    it('should show error when saving fails', async () => {
        let fetchCallCount = 0;

        fetch.mockImplementation(() => {
            fetchCallCount++;
            if (fetchCallCount === 1) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            } else {
                return Promise.reject(new Error('Failed to save'));
            }
        });

        render(<Journal />);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText(/How are you feeling right now/);
            fireEvent.change(textarea, { target: { value: 'Test entry' } });
        });

        const saveButton = screen.getByRole('button', { name: /Save Entry/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText(/Failed to save/i)).toBeInTheDocument();
        });
    });

    it('should disable save button when entry is empty', async () => {
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        render(<Journal />);

        await waitFor(() => {
            const saveButton = screen.getByRole('button', { name: /Save Entry/i });
            expect(saveButton).toBeDisabled();
        });
    });

    it('should display timestamps correctly', async () => {
        const mockEntry = { id: 1, userId: 1, text: 'Entry', date: '1/1/2024', time: '10:30 AM' };

        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockEntry])
        }));

        render(<Journal />);

        await waitFor(() => {
            expect(screen.getByText('1/1/2024')).toBeInTheDocument();
            expect(screen.getByText('10:30 AM')).toBeInTheDocument();
        });
    });

    it('should show error state when fetch fails', async () => {
        fetch.mockImplementation(() => Promise.reject(new Error('Failed to fetch')));

        render(<Journal />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
        });
    });

    it('should have proper CSS classes', async () => {
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        const { container } = render(<Journal />);

        await waitFor(() => {
            const glassPanels = container.querySelectorAll('.glass-panel');
            expect(glassPanels.length).toBeGreaterThan(0);
        });
    });

    it('should allow text input up to reasonable length', async () => {
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        render(<Journal />);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText(/How are you feeling right now/);
            const longText = 'a'.repeat(500);
            fireEvent.change(textarea, { target: { value: longText } });
            expect(textarea.value).toHaveLength(500);
        });
    });

    it('should clear textarea after successful save', async () => {
        const newEntry = { id: 1, userId: 1, text: 'Test', date: '1/1/2024', time: '10:00 AM' };
        let fetchCallCount = 0;

        fetch.mockImplementation(() => {
            fetchCallCount++;
            if (fetchCallCount === 1) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            } else {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(newEntry)
                });
            }
        });

        render(<Journal />);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText(/How are you feeling right now/);
            fireEvent.change(textarea, { target: { value: 'Test' } });
        });

        const saveButton = screen.getByRole('button', { name: /Save Entry/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText(/How are you feeling right now/);
            expect(textarea.value).toBe('');
        });
    });
});
