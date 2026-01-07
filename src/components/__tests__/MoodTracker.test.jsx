import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoodTracker from '../MoodTracker';
import { moods } from '../../constants/moods';

describe('MoodTracker', () => {
    it('should render all mood options', () => {
        render(<MoodTracker currentMood={null} onMoodChange={() => { }} />);

        moods.forEach(mood => {
            expect(screen.getByText(mood.label)).toBeInTheDocument();
            expect(screen.getByText(mood.emoji)).toBeInTheDocument();
        });
    });

    it('should call onMoodChange when a mood is clicked', () => {
        const handleMoodChange = vi.fn();
        render(<MoodTracker currentMood={null} onMoodChange={handleMoodChange} />);

        const firstMood = moods[0];
        const moodButton = screen.getByText(firstMood.label).closest('button');

        fireEvent.click(moodButton);

        expect(handleMoodChange).toHaveBeenCalledTimes(1);
        expect(handleMoodChange).toHaveBeenCalledWith(firstMood);
    });

    it('should highlight the current mood', () => {
        const currentMood = moods[0];
        render(<MoodTracker currentMood={currentMood} onMoodChange={() => { }} />);

        const moodButton = screen.getByText(currentMood.label).closest('button');

        // Check for the active class/style (bg-white/10 ring-2)
        expect(moodButton.className).toContain('ring-2');
    });
});
