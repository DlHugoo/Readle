import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/StudentNavbar';
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// Define the scoring functions outside the component
// This ensures they're available everywhere in the file
const calculateSnakeGameScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    
    // Scoring logic: starts at 100, minus 2 points for each additional attempt
    const score = 100 - ((attempts - 1) * 2);
    return Math.max(score, 0); // Ensure score doesn't go below 0
};

const calculateSSAScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    
    // Scoring logic: starts at 100, minus 25 points for each additional attempt
    const score = 100 - ((attempts - 1) * 25);
    return Math.max(score, 0); // Ensure score doesn't go below 0
};

const calculatePredictionScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    return attempts === 1 ? 100 : 0; // 100 points for 1 attempt, 0 for more attempts
};

// Helper to read seconds from different duration shapes
const extractTotalSeconds = (minutesValue, fallbackDuration) => {
    if (typeof fallbackDuration === 'object' && fallbackDuration !== null && 'seconds' in fallbackDuration) {
        return Math.max(0, Number(fallbackDuration.seconds) || 0);
    }
    if (typeof fallbackDuration === 'number' && !isNaN(fallbackDuration)) {
        const n = Math.max(0, fallbackDuration);
        if (n > 1e12) return Math.floor(n / 1e9); // ns
        if (n > 1e6) return Math.floor(n / 1e3); // ms
        return Math.floor(n); // seconds
    }
    if (typeof minutesValue === 'number' && !isNaN(minutesValue)) {
        return Math.max(0, Math.floor(minutesValue * 60));
    }
    return 0;
};

const StudentProgressDashboard = () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCount: 0,
        inProgressCount: 0,
    });
    const [completedBooks, setCompletedBooks] = useState([]);
    const [inProgressBooks, setInProgressBooks] = useState([]);
    const [snakeGameAttempts, setSnakeGameAttempts] = useState({});
    const [ssaAttempts, setSSAAttempts] = useState({});
    const [predictionAttempts, setPredictionAttempts] = useState({});
    const [averageScores, setAverageScores] = useState({
        snakeGame: 0,
        ssa: 0,
        prediction: 0
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Function to scroll to a specific section
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // 🔒 Redirect admins trying to access this dashboard
    useEffect(() => {
        if (role === 'ADMIN') {
            navigate('/admin-dashboard');
        }
    }, [role, navigate]);

    useEffect(() => {
        const fetchProgressData = async () => {
            // ... your original logic
        };

        if (userId) {
            fetchProgressData();
        }
    }, [userId, token]);

    useEffect(() => {
        const fetchProgressData = async () => {
            if (!token) {
                setError('Please log in to view your progress');
                setLoading(false);
                return;
            }

            if (!userId) {
                setError('User ID not found. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const headers = {
                    Authorization: `Bearer ${token}`
                };

                const [completedCountRes, inProgressCountRes, completedBooksRes, inProgressBooksRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/progress/completed/count/${userId}`, { headers }),
                    axios.get(`${API_BASE_URL}/api/progress/in-progress/count/${userId}`, { headers }),
                    axios.get(`${API_BASE_URL}/api/progress/completed/${userId}`, { headers }),
                    axios.get(`${API_BASE_URL}/api/progress/in-progress/${userId}`, { headers }),
                ]);

                setStats({
                    completedCount: completedCountRes.data,
                    inProgressCount: inProgressCountRes.data,
                });
                setCompletedBooks(completedBooksRes.data);
                setInProgressBooks(inProgressBooksRes.data);
                
                // Sync reading-time badge progress from aggregated progress totals
                try {
                    const tokenLocal = localStorage.getItem('token');
                    const headersLocal = { Authorization: `Bearer ${tokenLocal}` };
                    const storedUserId = localStorage.getItem('userId');
                    if (storedUserId) {
                        const all = [...completedBooksRes.data, ...inProgressBooksRes.data];
                        const totalSeconds = all.reduce((sum, p) => {
                            return sum + extractTotalSeconds(p.totalReadingTimeMinutes, p.totalReadingTime);
                        }, 0);
                        const totalMinutes = Math.floor(totalSeconds / 60);
                        const syncedKey = `readingTimeSyncedTotal:${storedUserId}`;
                        const alreadySynced = parseInt(localStorage.getItem(syncedKey) || '0', 10);
                        if (totalMinutes > alreadySynced) {
                            const delta = totalMinutes - alreadySynced;
                            await axios.post(
                                `${API_BASE_URL}/api/badges/user/${storedUserId}/reading-time?minutes=${delta}`,
                                {},
                                { headers: headersLocal }
                            );
                            localStorage.setItem(syncedKey, String(totalMinutes));
                        }
                    }
                } catch (syncErr) {
                    // Non-blocking
                    console.warn('Reading time badge sync failed:', syncErr?.response?.data || syncErr?.message || syncErr);
                }
                
                // Fetch snake game attempts for all books
                const allBooks = [...completedBooksRes.data, ...inProgressBooksRes.data];
                const snakeAttemptsData = {};
                const ssaAttemptsData = {};
                const predictionAttemptsData = {}; // Will store { [bookId]: { isCorrect: boolean|null } }
                
                await Promise.all(allBooks.map(async (book) => {
                    try {
                        const bookId = book.book.bookID;
                        const snakeAttemptsRes = await axios.get(
                            `${API_BASE_URL}/api/snake-attempts/user/${userId}/book/${bookId}/count`, 
                            { headers }
                        );
                        snakeAttemptsData[bookId] = snakeAttemptsRes.data;
                        
                        // Fetch SSA attempts for this book
                        try {
                            const ssaAttemptsRes = await axios.get(
                                `${API_BASE_URL}/api/ssa-attempts/user/${userId}/book/${bookId}/count`,
                                { headers }
                            );
                            ssaAttemptsData[bookId] = ssaAttemptsRes.data;
                        } catch (err) {
                            console.error(`Error fetching SSA attempts for book ${bookId}:`, err);
                            ssaAttemptsData[bookId] = 0;
                        }
                        
                        // Fetch prediction checkpoint attempts for this book (latest attempt)
                        try {
                            // First, get the prediction checkpoint ID for this book
                            const predictionCheckpointRes = await axios.get(
                                `${API_BASE_URL}/api/prediction-checkpoints/by-book/${bookId}`,
                                { headers }
                            );
                            
                            if (predictionCheckpointRes.data && predictionCheckpointRes.data.id) {
                                // Use the checkpoint ID from the response
                                const checkpointId = predictionCheckpointRes.data.id;
                                // Defensive check: only proceed if both userId and checkpointId are valid numbers
                                if (!isNaN(Number(userId)) && !isNaN(Number(checkpointId))) {
                                    // Now fetch the latest attempt using the correct checkpoint ID
                                    const predictionLatestAttemptRes = await axios.get(
                                        `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${checkpointId}/latest`,
                                        { headers }
                                    );
                                    if (predictionLatestAttemptRes.data && typeof predictionLatestAttemptRes.data.correct === 'boolean') {
                                        predictionAttemptsData[bookId] = { correct: predictionLatestAttemptRes.data.correct };
                                    } else {
                                        predictionAttemptsData[bookId] = { correct: null };
                                    }
                                } else {
                                    predictionAttemptsData[bookId] = { correct: null };
                                }
                            } else {
                                console.log(`No prediction checkpoints found for book ${bookId}`);
                                predictionAttemptsData[bookId] = { correct: null };
                            }
                        } catch (err) {
                            if (err.response && err.response.status === 404) {
                                predictionAttemptsData[bookId] = { correct: null };
                            } else {
                                console.error(`Error fetching prediction attempts for book ${bookId}:`, err);
                                predictionAttemptsData[bookId] = { correct: null };
                            }
                        }
                    } catch (err) {
                        console.error(`Error fetching snake game attempts for book ${book.book.bookID}:`, err);
                        snakeAttemptsData[book.book.bookID] = 0;
                    }
                }));
                
                setSnakeGameAttempts(snakeAttemptsData);
                setSSAAttempts(ssaAttemptsData);
                setPredictionAttempts(predictionAttemptsData); // Set prediction attempts state
                
                // Calculate average scores
                const calculateAverages = () => {
                    // Calculate average snake game score
                    let snakeTotal = 0;
                    let snakeCount = 0;
                    Object.keys(snakeAttemptsData).forEach(bookId => {
                        if (snakeAttemptsData[bookId] > 0) {
                            snakeTotal += calculateSnakeGameScore(snakeAttemptsData[bookId]);
                            snakeCount++;
                        }
                    });
                    
                    // Calculate average SSA score
                    let ssaTotal = 0;
                    let ssaCount = 0;
                    Object.keys(ssaAttemptsData).forEach(bookId => {
                        if (ssaAttemptsData[bookId] > 0) {
                            ssaTotal += calculateSSAScore(ssaAttemptsData[bookId]);
                            ssaCount++;
                        }
                    });
                    
                    // Calculate average prediction score (use correct)
                    let predictionTotal = 0;
                    let predictionCount = 0;
                    Object.keys(predictionAttemptsData).forEach(bookId => {
                        const attempt = predictionAttemptsData[bookId];
                        if (attempt && typeof attempt.correct === 'boolean') {
                            predictionTotal += attempt.correct ? 100 : 0;
                            predictionCount++;
                        }
                    });
                    
                    setAverageScores({
                        snakeGame: snakeCount > 0 ? Math.round(snakeTotal / snakeCount) : 0,
                        ssa: ssaCount > 0 ? Math.round(ssaTotal / ssaCount) : 0,
                        prediction: predictionCount > 0 ? Math.round(predictionTotal / predictionCount) : 0
                    });
                };
                
                calculateAverages();
                setError(null);
            } catch (error) {
                console.error('Error fetching progress data:', error);
                if (error.response) {
                    switch (error.response.status) {
                        case 401:
                            setError('Your session has expired. Please log in again.');
                            break;
                        case 403:
                            setError('You do not have permission to view this data.');
                            break;
                        case 404:
                            setError('No progress data found.');
                            break;
                        default:
                            setError('Failed to load progress data. Please try again later.');
                    }
                } else if (error.request) {
                    setError('Unable to connect to the server. Please check your internet connection.');
                } else {
                    setError('An unexpected error occurred. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchProgressData();
        }
    }, [userId, token]);

    const formatDuration = (minutes, fallbackDuration) => {
        // Accepts multiple shapes:
        // 1) minutes: number
        // 2) fallbackDuration: number (seconds/ms/ns), or object {seconds, nano}, or ISO-8601 string like "PT15M10S"
        let totalSeconds = 0;
        if (typeof fallbackDuration === 'string') {
            // ISO-8601: PT#H#M#S
            const iso = fallbackDuration.trim();
            if (iso.startsWith('PT')) {
                const h = /([0-9]+)H/.exec(iso);
                const m = /([0-9]+)M/.exec(iso);
                const s = /([0-9]+)S/.exec(iso);
                totalSeconds = (h ? parseInt(h[1], 10) * 3600 : 0) + (m ? parseInt(m[1], 10) * 60 : 0) + (s ? parseInt(s[1], 10) : 0);
            }
        } else if (typeof fallbackDuration === 'object' && fallbackDuration !== null) {
            // Spring Duration as object
            if ('seconds' in fallbackDuration) {
                totalSeconds = Number(fallbackDuration.seconds) || 0;
            } else if ('nanos' in fallbackDuration) {
                totalSeconds = Math.floor((Number(fallbackDuration.nanos) || 0) / 1e9);
            }
        } else if (typeof fallbackDuration === 'number' && !isNaN(fallbackDuration)) {
            const n = Math.max(0, fallbackDuration);
            // Heuristics: if extremely large, it's ns; if moderately large, ms; else seconds
            if (n > 1e12) {
                totalSeconds = Math.floor(n / 1e9); // ns -> s
            } else if (n > 1e6) {
                totalSeconds = Math.floor(n / 1e3); // ms -> s
            } else {
                totalSeconds = Math.floor(n); // seconds
            }
        }
        if (!totalSeconds && typeof minutes === 'number' && !isNaN(minutes)) {
            totalSeconds = Math.max(0, Math.floor(minutes * 60));
        }
        const hours = Math.floor(totalSeconds / 3600);
        const remainingAfterHours = totalSeconds % 3600;
        const mins = Math.floor(remainingAfterHours / 60);
        const secs = remainingAfterHours % 60;
        return `${hours}h ${mins}m ${secs}s`;
    };

    if (loading) {
        return (
            <>
                <StudentNavbar />
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <StudentNavbar />
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
                    <div className="max-w-6xl mx-auto px-4 py-8">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                            {error.includes('log in') && (
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                >
                                    Go to Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <StudentNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            📚 Reading Progress Dashboard
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">Track your reading journey and celebrate your achievements!</p>
                        <button
                            onClick={() => navigate('/student/badges')}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 font-semibold"
                        >
                            🏆 View Achievements
                        </button>
                    </div>

                    {/* Statistics Cards with Enhanced Design */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div 
                            onClick={() => scrollToSection('completed-books')}
                            className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-blue-500 cursor-pointer hover:shadow-2xl"
                        >
                            <div className="bg-blue-100 rounded-full p-4 mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <span className="text-gray-600 text-xl mb-3 font-medium">Completed Books</span>
                            <span className="text-5xl font-bold text-blue-600">{stats.completedCount}</span>
                            <div className="mt-2 text-sm text-gray-500">Great job!</div>
                        </div>
                        <div 
                            onClick={() => scrollToSection('books-in-progress')}
                            className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-yellow-500 cursor-pointer hover:shadow-2xl"
                        >
                            <div className="bg-yellow-100 rounded-full p-4 mb-4">
                                <span className="text-3xl">📖</span>
                            </div>
                            <span className="text-gray-600 text-xl mb-3 font-medium">Books in Progress</span>
                            <span className="text-5xl font-bold text-yellow-500">{stats.inProgressCount}</span>
                            <div className="mt-2 text-sm text-gray-500">Keep reading!</div>
                        </div>
                    </div>
                
                    {/* Average Scores Cards with Enhanced Design */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            🎯 Average Activity Scores
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-green-700 font-bold text-lg">🐍 Snake Game</span>
                                    <div className="bg-green-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                                        {averageScores.snakeGame}
                                    </div>
                                </div>
                                <div className="w-full bg-green-200 rounded-full h-3">
                                    <div 
                                        className="bg-green-500 h-3 rounded-full transition-all duration-1000" 
                                        style={{ width: `${averageScores.snakeGame}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-green-600 mt-2 text-center">Average Score</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-blue-700 font-bold text-lg">🧩 Sequencing</span>
                                    <div className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                                        {averageScores.ssa}
                                    </div>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-3">
                                    <div 
                                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                                        style={{ width: `${averageScores.ssa}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-blue-600 mt-2 text-center">Average Score</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-purple-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-purple-700 font-bold text-lg">🔮 Prediction</span>
                                    <div className="bg-purple-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                                        {averageScores.prediction}
                                    </div>
                                </div>
                                <div className="w-full bg-purple-200 rounded-full h-3">
                                    <div 
                                        className="bg-purple-500 h-3 rounded-full transition-all duration-1000" 
                                        style={{ width: `${averageScores.prediction}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-purple-600 mt-2 text-center">Average Score</div>
                            </div>
                        </div>
                    </div>
                
                    {/* Books in Progress with Enhanced Design */}
                    <div id="books-in-progress" className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            📖 Books in Progress
                        </h2>
                        <div className="space-y-6">
                            {inProgressBooks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <p className="text-gray-500 text-xl">No books in progress yet.</p>
                                    <p className="text-gray-400 mt-2">Start reading to see your progress here!</p>
                                </div>
                            )}
                            {inProgressBooks.map((book) => (
                                <div key={`in-progress-${book.id}`} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 transform hover:scale-102 transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                                            {book.book.imageURL ? (
                                                <img 
                                                    src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                                    alt={book.book.title}
                                                    className="w-20 h-24 object-cover rounded-lg shadow-md"
                                                    title={book.book.title}
                                                />
                                            ) : (
                                                <div className="w-20 h-24 bg-gray-200 rounded-lg flex items-center justify-center shadow-md">
                                                    <span className="text-xs text-gray-500">No image</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-800 mb-2">{book.book.title}</h3>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="text-blue-500 mr-2">📅</span>
                                                        Last read: {new Date(book.lastReadAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-green-500 mr-2">📄</span>
                                                        Page {book.lastPageRead} of {book.book.pageIds ? book.book.pageIds.length : 1}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-purple-500 mr-2">⏱️</span>
                                                        {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                                                    </div>
                                                </div>
                                                
                                                {/* Activity Scores */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {snakeGameAttempts[book.book.bookID] > 0 && (
                                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🐍 Snake: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])}pts
                                                        </div>
                                                    )}
                                                    {ssaAttempts[book.book.bookID] > 0 && (
                                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🧩 Sequencing: {calculateSSAScore(ssaAttempts[book.book.bookID])}pts
                                                        </div>
                                                    )}
                                                    {predictionAttempts[book.book.bookID] && typeof predictionAttempts[book.book.bookID].correct === 'boolean' && (
                                                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🔮 Prediction: {predictionAttempts[book.book.bookID].correct ? 100 : 0}pts
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="lg:w-80">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-600">Progress</span>
                                                <span className="text-sm font-bold text-blue-600">
                                                    {book.book.pageIds ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000"
                                                    style={{ width: `${book.book.pageIds && book.lastPageRead ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-center">
                                                {book.lastPageRead} of {book.book.pageIds ? book.book.pageIds.length : 1} pages completed
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Completed Books with Enhanced Design */}
                    <div id="completed-books" className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            ✅ Completed Books
                        </h2>
                        <div className="space-y-6">
                            {completedBooks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <p className="text-gray-500 text-xl">No completed books yet.</p>
                                    <p className="text-gray-400 mt-2">Finish reading a book to see it here!</p>
                                </div>
                            )}
                            {completedBooks.map((book) => (
                                <div key={`completed-${book.id}`} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 transform hover:scale-102 transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                                            {book.book.imageURL ? (
                                                <img 
                                                    src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                                    alt={book.book.title}
                                                    className="w-20 h-24 object-cover rounded-lg shadow-md"
                                                    title={book.book.title}
                                                />
                                            ) : (
                                                <div className="w-20 h-24 bg-gray-200 rounded-lg flex items-center justify-center shadow-md">
                                                    <span className="text-xs text-gray-500">No image</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="font-bold text-xl text-gray-800 mr-3">{book.book.title}</h3>
                                                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                        ✅ Completed
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="text-green-500 mr-2">🏆</span>
                                                        Completed on: {new Date(book.endTime).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-blue-500 mr-2">📄</span>
                                                        Total pages: {book.book.pageIds ? book.book.pageIds.length : 1}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-purple-500 mr-2">⏱️</span>
                                                        Total reading time: {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)}
                                                    </div>
                                                </div>
                                                
                                                {/* Activity Scores */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {snakeGameAttempts[book.book.bookID] > 0 && (
                                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🐍 Snake: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])}pts
                                                        </div>
                                                    )}
                                                    {ssaAttempts[book.book.bookID] > 0 && (
                                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🧩 Sequencing: {calculateSSAScore(ssaAttempts[book.book.bookID])}pts
                                                        </div>
                                                    )}
                                                    {predictionAttempts[book.book.bookID] && typeof predictionAttempts[book.book.bookID].correct === 'boolean' && (
                                                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                                            🔮 Prediction: {predictionAttempts[book.book.bookID].correct ? 100 : 0}pts
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="lg:w-80">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-600">Reading Progress</span>
                                                <span className="text-sm font-bold text-green-600">100%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full w-full"></div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-center">
                                                All {book.book.pageIds ? book.book.pageIds.length : 1} pages completed
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentProgressDashboard;