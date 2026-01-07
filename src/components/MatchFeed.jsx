import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_URL } from '../config/api';

const MatchFeed = ({ currentMood }) => {
    const { user } = useUser();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [likedUsers, setLikedUsers] = useState(new Set());

    // Fetch matching users when mood changes
    useEffect(() => {
        if (!currentMood || !user) {
            setMatches([]);
            return;
        }

        setLoading(true);
        setError(null);
        fetch(`${API_URL}/api/users/match/${currentMood.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch matches');
                return res.json();
            })
            .then(data => {
                // Filter out current user
                const otherUsers = data.filter(u => u.id !== user.id);
                setMatches(otherUsers);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch matches:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [currentMood, user]);

    const toggleLike = (e, userId) => {
        e.stopPropagation(); // Prevent triggering the card click
        const newLiked = new Set(likedUsers);
        if (newLiked.has(userId)) {
            newLiked.delete(userId);
        } else {
            newLiked.add(userId);
        }
        setLikedUsers(newLiked);
    };

    const handleChat = (e, userName) => {
        e.stopPropagation();
        // TODO: Navigate to chat tab or open direct message
        // This would be handled by parent component or routing
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Coming Soon Features */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1DB954]/10 to-[#1DB954]/5 border border-[#1DB954]/20 text-[#1DB954] text-xs font-medium whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                    Spotify Integration Coming Soon
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E1306C]/10 to-[#E1306C]/5 border border-[#E1306C]/20 text-[#E1306C] text-xs font-medium whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#E1306C] animate-pulse" />
                    Instagram Integration Coming Soon
                </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-200 px-1">
                {currentMood ? `Vibing with you (${matches.length})` : 'Select a mood to find your tribe'}
            </h2>

            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="glass-panel text-center py-10">
                        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                        <p className="mt-4 text-gray-400">Finding your vibe matches...</p>
                    </div>
                ) : error ? (
                    <div className="glass-panel text-center py-10 text-red-400">
                        <p>Failed to load matches</p>
                        <p className="text-sm mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {matches.length > 0 ? (
                            matches.map((matchUser) => (
                                <motion.div
                                    key={matchUser.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass-panel flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden"
                                >
                                    {/* Match Score Badge */}
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white shadow-lg">
                                        100% Match
                                    </div>

                                    <img src={matchUser.avatar} alt={matchUser.name} className="w-12 h-12 rounded-full border-2 border-white/10" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{matchUser.name}</h3>
                                        <p className="text-sm text-gray-400 truncate">{matchUser.status || 'No status'}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4 z-20">
                                        <button
                                            onClick={(e) => toggleLike(e, matchUser.id)}
                                            className={`p-2 rounded-full transition-colors ${likedUsers.has(matchUser.id) ? 'bg-secondary text-white' : 'bg-white/10 hover:bg-primary/50 text-white'}`}
                                        >
                                            <Heart size={18} fill={likedUsers.has(matchUser.id) ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={(e) => handleChat(e, matchUser.name)}
                                            className="p-2 rounded-full bg-white/10 hover:bg-accent/50 text-white transition-colors"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            currentMood && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-10 text-gray-500 glass-panel"
                                >
                                    <p>No one else is feeling this exact vibe right now.</p>
                                    <p className="text-sm mt-2">Be the first!</p>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                )}

                {!currentMood && (
                    <div className="text-center py-10 text-gray-500 glass-panel border-dashed">
                        <p>Tap a mood above to start mingling.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchFeed;
