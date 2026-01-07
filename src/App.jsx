import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MoodTracker from './components/MoodTracker';
import MatchFeed from './components/MatchFeed';
import VibeRoom from './components/VibeRoom';
import MoodBooster from './components/MoodBooster';
import Journal from './components/Journal';
import UserProfile from './components/UserProfile';
import { Users, MessageSquare, Sparkles, BookOpen } from 'lucide-react';
import { findMoodById } from './constants/moods';
import { UserProvider, useUser } from './contexts/UserContext';
import { API_URL } from './config/api';

function AppContent() {
    const { user, loading: userLoading } = useUser();
    const [currentMood, setCurrentMood] = useState(null);
    const [activeTab, setActiveTab] = useState('feed');
    const [moodLoading, setMoodLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    // Fetch initial mood from server
    useEffect(() => {
        if (!user) return;

        setMoodLoading(true);
        fetch(`${API_URL}/api/mood/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.id) {
                    const mood = findMoodById(data.id);
                    if (mood) setCurrentMood(mood);
                }
                setMoodLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch mood:", err);
                setMoodLoading(false);
            });
    }, [user]);

    const handleMoodChange = (mood) => {
        if (!user) return;

        setCurrentMood(mood);
        fetch(`${API_URL}/api/mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, moodId: mood.id })
        }).catch(err => console.error("Failed to save mood:", err));
    };

    if (userLoading || moodLoading) {
        return (
            <Layout>
                <div className="glass-panel text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading...</p>
                </div>
            </Layout>
        );
    }

    const renderContent = () => {
        if (showProfile) {
            return <UserProfile onClose={() => setShowProfile(false)} />;
        }

        switch (activeTab) {
            case 'feed':
                return <MatchFeed currentMood={currentMood} />;
            case 'chat':
                return <VibeRoom currentMood={currentMood} />;
            case 'boost':
                return <MoodBooster currentMood={currentMood} />;
            case 'journal':
                return <Journal />;
            default:
                return <MatchFeed currentMood={currentMood} />;
        }
    };

    return (
        <Layout onProfileClick={() => setShowProfile(!showProfile)}>
            {!showProfile && (
                <MoodTracker
                    currentMood={currentMood}
                    onMoodChange={handleMoodChange}
                />
            )}

            {!showProfile && (
                <div className="flex justify-between bg-white/5 p-1 rounded-xl mb-4">
                    {[
                        { id: 'feed', icon: Users, label: 'Feed' },
                        { id: 'chat', icon: MessageSquare, label: 'Rooms' },
                        { id: 'boost', icon: Sparkles, label: 'Boost' },
                        { id: 'journal', icon: BookOpen, label: 'Journal' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="min-h-[300px]">
                {renderContent()}
            </div>
        </Layout>
    );
}

function App() {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
}

export default App;
