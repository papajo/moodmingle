import { describe, it, expect } from 'vitest';
import { moods, findMoodById } from '../moods';

describe('Mood Constants', () => {
    it('should have 5 moods defined', () => {
        expect(moods).toHaveLength(5);
    });

    it('should have correct properties for each mood', () => {
        moods.forEach(mood => {
            expect(mood).toHaveProperty('id');
            expect(mood).toHaveProperty('emoji');
            expect(mood).toHaveProperty('label');
            expect(mood).toHaveProperty('color');
        });
    });

    describe('findMoodById', () => {
        it('should find a mood by valid id', () => {
            const mood = findMoodById('happy');
            expect(mood).toBeDefined();
            expect(mood.label).toBe('Vibing');
        });

        it('should return undefined for invalid id', () => {
            const mood = findMoodById('invalid_id');
            expect(mood).toBeUndefined();
        });
    });
});
