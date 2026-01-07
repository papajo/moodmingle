import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Quote } from 'lucide-react';

const CONTENT = {
    happy: [
        { type: 'quote', text: "Happiness is not something ready made. It comes from your own actions." },
        { type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif', label: 'Keep shining!' },
    ],
    chill: [
        { type: 'quote', text: "Peace comes from within. Do not seek it without." },
        { type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHJGHe3yAMhdQY/giphy.gif', label: 'Relax & Unwind' },
    ],
    energetic: [
        { type: 'quote', text: "The only way to do great work is to love what you do." },
        { type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHJGHe3yAMhdQY/giphy.gif', label: 'Let\'s Gooo!' }, // Placeholder GIF
    ],
    sad: [
        { type: 'quote', text: "This too shall pass." },
        { type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6vXVzKWtkvM390aY/giphy.gif', label: 'Sending good vibes' },
    ],
    romantic: [
        { type: 'quote', text: "Love is the whole thing. We are only pieces." },
        { type: 'gif', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26BRv0ThflsHCqDrG/giphy.gif', label: 'Heart eyes' },
    ],
};

const MoodBooster = ({ currentMood }) => {
    if (!currentMood) return null;

    const content = CONTENT[currentMood.id] || [];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="text-yellow-400" />
                Mood Boosters
            </h3>

            <div className="grid gap-4">
                {content.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-panel p-4"
                    >
                        {item.type === 'quote' ? (
                            <div className="flex gap-3">
                                <Quote className="text-primary flex-shrink-0" size={24} />
                                <p className="text-lg italic text-gray-200 font-serif">"{item.text}"</p>
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden relative group">
                                <img src={item.url} alt={item.label} className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold text-xl">{item.label}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MoodBooster;
