import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VibeRoom from '../VibeRoom.jsx';

// Mock user context to provide a logged-in user
vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({ user: { id: 123, username: 'TestUser' } })
}));
// Mock API base URL
vi.mock('../../config/api', () => ({ API_URL: 'http://localhost:3001' }));

describe('VibeRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prompt to select mood when no mood is provided', () => {
    render(<VibeRoom currentMood={null} />);
    expect(screen.getByText(/Select a mood to enter a Vibe Room/)).toBeInTheDocument();
  });

  it('should load and render messages when mood is provided', async () => {
    const mockMood = { id: 'happy', label: 'Happy' };
    const mockMessages = [
      {
        id: 1,
        roomId: mockMood.id,
        userId: 2,
        user: 'Alice',
        text: 'Hello vibes!',
        time: '12:34 PM',
        avatar: 'https://example.com/alice.jpg'
      }
    ];

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockMessages
    });

    render(<VibeRoom currentMood={mockMood} />);

    await waitFor(() => {
      expect(screen.getByText('Hello vibes!')).toBeInTheDocument();
      expect(screen.getByAltText('Alice')).toBeInTheDocument();
    });
  });
});
