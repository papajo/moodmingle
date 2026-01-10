import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MoodBooster from '../MoodBooster';
import { moods } from '../../constants/moods';

describe('MoodBooster Component', () => {
    it('should render null when no mood is selected', () => {
        const { container } = render(<MoodBooster currentMood={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render content for happy mood', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        render(<MoodBooster currentMood={happyMood} />);

        expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
        expect(screen.getByText(/Happiness is not something ready made/)).toBeInTheDocument();
    });

    it('should render content for chill mood', () => {
        const chillMood = moods.find(m => m.id === 'chill');
        render(<MoodBooster currentMood={chillMood} />);

        expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
        expect(screen.getByText(/Peace comes from within/)).toBeInTheDocument();
    });

    it('should render content for energetic mood', () => {
        const energeticMood = moods.find(m => m.id === 'energetic');
        render(<MoodBooster currentMood={energeticMood} />);

        expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
        expect(screen.getByText(/The only way to do great work/)).toBeInTheDocument();
    });

    it('should render content for sad mood', () => {
        const sadMood = moods.find(m => m.id === 'sad');
        render(<MoodBooster currentMood={sadMood} />);

        expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
        expect(screen.getByText(/This too shall pass/)).toBeInTheDocument();
    });

    it('should render content for romantic mood', () => {
        const romanticMood = moods.find(m => m.id === 'romantic');
        render(<MoodBooster currentMood={romanticMood} />);

        expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
        expect(screen.getByText(/Love is the whole thing/)).toBeInTheDocument();
    });

    it('should render quote with proper formatting', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        render(<MoodBooster currentMood={happyMood} />);

        const quoteText = screen.getByText(/Happiness is not something ready made/);
        expect(quoteText).toHaveClass('text-lg', 'italic', 'text-gray-200', 'font-serif');
    });

    it('should render GIF with alt text', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        render(<MoodBooster currentMood={happyMood} />);

        const gif = screen.getByAltText('Keep shining!');
        expect(gif).toBeInTheDocument();
        expect(gif).toHaveAttribute('src');
    });

    it('should filter content based on mood', () => {
        const chillMood = moods.find(m => m.id === 'chill');
        render(<MoodBooster currentMood={chillMood} />);

        expect(screen.getByText(/Peace comes from within/)).toBeInTheDocument();

        const sadQuote = screen.queryByText(/This too shall pass/);
        expect(sadQuote).not.toBeInTheDocument();
    });

    it('should have proper CSS classes and structure', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        const { container } = render(<MoodBooster currentMood={happyMood} />);

        const glassPanels = container.querySelectorAll('.glass-panel');
        expect(glassPanels.length).toBeGreaterThan(0);
    });

    it('should display correct labels on GIF hover', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        render(<MoodBooster currentMood={happyMood} />);

        expect(screen.getByText('Keep shining!')).toBeInTheDocument();
    });

    it('should render all moods correctly', () => {
        moods.forEach(mood => {
            const { unmount } = render(<MoodBooster currentMood={mood} />);
            expect(screen.getByText('Mood Boosters')).toBeInTheDocument();
            unmount();
        });
    });

    it('should have glass-panel styling', () => {
        const happyMood = moods.find(m => m.id === 'happy');
        const { container } = render(<MoodBooster currentMood={happyMood} />);

        const glassPanels = container.querySelectorAll('.glass-panel');
        expect(glassPanels.length).toBeGreaterThan(0);
    });
});
