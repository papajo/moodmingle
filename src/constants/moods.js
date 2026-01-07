/**
 * Mood definitions used throughout the application
 * Each mood has an id, emoji, label, and color gradient class
 */
export const moods = [
    { id: 'happy', emoji: '😊', label: 'Vibing', color: 'from-yellow-400 to-orange-500' },
    { id: 'chill', emoji: '😌', label: 'Chill', color: 'from-blue-400 to-cyan-500' },
    { id: 'energetic', emoji: '⚡', label: 'Hyped', color: 'from-purple-500 to-pink-500' },
    { id: 'sad', emoji: '😔', label: 'Low', color: 'from-gray-400 to-slate-500' },
    { id: 'romantic', emoji: '🥰', label: 'Love', color: 'from-red-400 to-rose-500' },
];

/**
 * Find a mood by its ID
 * @param {string} moodId - The mood ID to find
 * @returns {Object|undefined} The mood object or undefined if not found
 */
export const findMoodById = (moodId) => {
    return moods.find(m => m.id === moodId);
};

