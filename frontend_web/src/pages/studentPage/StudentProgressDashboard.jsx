import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/StudentNavbar';

const API_BASE_URL = 'http://localhost:8080';

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
                
                // Fetch snake game attempts for all books
                const allBooks = [...completedBooksRes.data, ...inProgressBooksRes.data];
                const snakeAttemptsData = {};
                const ssaAttemptsData = {};
                const predictionAttemptsData = {}; // Add object for prediction attempts
                
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
                        
                        // Fetch prediction checkpoint attempts for this book
                        try {
                            // First, get the prediction checkpoint ID for this book
                            const predictionCheckpointRes = await axios.get(
                                `${API_BASE_URL}/api/prediction-checkpoints/by-book/${bookId}`,
                                { headers }
                            );
                            
                            if (predictionCheckpointRes.data && predictionCheckpointRes.data.id) {
                                // Use the checkpoint ID from the response
                                const checkpointId = predictionCheckpointRes.data.id;
                                
                                // Now fetch attempts using the correct checkpoint ID
                                const predictionAttemptsRes = await axios.get(
                                    `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${checkpointId}/count`,
                                    { headers }
                                );
                                console.log(`Prediction attempts for book ${bookId}:`, predictionAttemptsRes.data);
                                predictionAttemptsData[bookId] = predictionAttemptsRes.data;
                            } else {
                                console.log(`No prediction checkpoints found for book ${bookId}`);
                                predictionAttemptsData[bookId] = 0;
                            }
                        } catch (err) {
                            console.error(`Error fetching prediction attempts for book ${bookId}:`, err);
                            predictionAttemptsData[bookId] = 0;
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
                    
                    // Calculate average prediction score
                    let predictionTotal = 0;
                    let predictionCount = 0;
                    Object.keys(predictionAttemptsData).forEach(bookId => {
                        if (predictionAttemptsData[bookId] > 0) {
                            predictionTotal += calculatePredictionScore(predictionAttemptsData[bookId]);
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
        // If minutes is undefined, try to use fallbackDuration (old field)
        let mins = minutes;
        if (typeof mins !== 'number' || isNaN(mins)) {
            if (typeof fallbackDuration === 'object' && fallbackDuration !== null && 'seconds' in fallbackDuration) {
                mins = Math.floor(fallbackDuration.seconds / 60);
            } else if (typeof fallbackDuration === 'number') {
                mins = Math.floor(fallbackDuration / 60);
            } else {
                mins = 0;
            }
        }
        const hours = Math.floor(mins / 60);
        const remainingMinutes = mins % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    if (loading) {
        return (
            <>
                <StudentNavbar />
                <div className="flex justify-center items-center min-h-[80vh]">
                    <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <StudentNavbar />
                <div className="max-w-5xl mx-auto mt-8 mb-8 px-4">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        {error.includes('log in') && (
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                            >
                                Go to Login
                            </button>
                        )}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <StudentNavbar />
            <div className="max-w-5xl mx-auto mt-8 mb-8 px-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Reading Progress Dashboard</h1>
                    <button
                        onClick={() => navigate('/student/badges')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        View Achievements
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                        <span className="text-gray-500 text-lg mb-2">Completed Books</span>
                        <span className="text-4xl font-bold text-blue-600">{stats.completedCount}</span>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                        <span className="text-gray-500 text-lg mb-2">Books in Progress</span>
                        <span className="text-4xl font-bold text-yellow-500">{stats.inProgressCount}</span>
                    </div>
                </div>
                
                {/* Average Scores Cards */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Average Activity Scores</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 text-md mb-1">Snake Game</span>
                            <div className="flex items-center">
                                <span role="img" aria-label="snake" className="mr-2 text-2xl">🐍</span>
                                <span className="text-3xl font-bold text-green-600">{averageScores.snakeGame}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 text-md mb-1">Sequencing</span>
                            <div className="flex items-center">
                                <span role="img" aria-label="puzzle" className="mr-2 text-2xl">🧩</span>
                                <span className="text-3xl font-bold text-blue-600">{averageScores.ssa}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                            <span className="text-gray-500 text-md mb-1">Prediction</span>
                            <div className="flex items-center">
                                <span role="img" aria-label="crystal-ball" className="mr-2 text-2xl">🔮</span>
                                <span className="text-3xl font-bold text-purple-600">{averageScores.prediction}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Books in Progress */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Books in Progress</h2>
                    <ul>
                        {inProgressBooks.length === 0 && (
                            <li className="text-gray-400 italic">No books in progress.</li>
                        )}
                        {inProgressBooks.map((book) => (
                            <li key={`in-progress-${book.id}`} className="mb-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center">
                                        {book.book.imageURL ? (
                                            <img 
                                                src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                                alt={book.book.title}
                                                className="w-16 h-20 object-cover rounded mr-4"
                                                title={book.book.title}
                                            />
                                        ) : (
                                            <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center mr-4">
                                                <span className="text-xs text-gray-500">No image</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold">{book.book.title}</h3>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Last read: {new Date(book.lastReadAt).toLocaleDateString()}<br />
                                                Page {book.lastPageRead} of {book.book.pageIds ? book.book.pageIds.length : 1} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                                                {snakeGameAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-green-600">
                                                        <span role="img" aria-label="snake">🐍</span> Snake Game Score: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                                {ssaAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-blue-600">
                                                        <span role="img" aria-label="puzzle">🧩</span> Sequencing Score: {calculateSSAScore(ssaAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                                {predictionAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-purple-600">
                                                        <span role="img" aria-label="crystal-ball">🔮</span> Prediction Score: {calculatePredictionScore(predictionAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/2 mt-2 md:mt-0">
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full"
                                                style={{ width: `${book.book.pageIds && book.lastPageRead ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                       
                                        <div className="text-xs text-gray-400 mt-1 text-right">
                                            {book.book.pageIds ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}% complete
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Completed Books */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Completed Books</h2>
                    <ul>
                        {completedBooks.length === 0 && (
                            <li className="text-gray-400 italic">No completed books yet.</li>
                        )}
                        {completedBooks.map((book) => (
                            <li key={`completed-${book.id}`} className="mb-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center">
                                        {book.book.imageURL ? (
                                            <img 
                                                src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                                alt={book.book.title}
                                                className="w-16 h-20 object-cover rounded mr-4"
                                                title={book.book.title}
                                            />
                                        ) : (
                                            <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center mr-4">
                                                <span className="text-xs text-gray-500">No image</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold">{book.book.title}</h3>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Completed on: {new Date(book.endTime).toLocaleDateString()}<br />
                                                Total reading time: {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)}
                                                {snakeGameAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-green-600">
                                                        <span role="img" aria-label="snake">🐍</span> Snake Game Score: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                                {ssaAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-blue-600">
                                                        <span role="img" aria-label="puzzle">🧩</span> Sequencing Score: {calculateSSAScore(ssaAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                                {predictionAttempts[book.book.bookID] > 0 && (
                                                    <div className="mt-1 text-purple-600">
                                                        <span role="img" aria-label="crystal-ball">🔮</span> Prediction Score: {calculatePredictionScore(predictionAttempts[book.book.bookID])} points
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default StudentProgressDashboard;