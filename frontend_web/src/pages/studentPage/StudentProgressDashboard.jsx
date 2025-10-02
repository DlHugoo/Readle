import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Filter state
    const [filterType, setFilterType] = useState('global'); // 'global' or 'classroom'
    const [selectedClassroomId, setSelectedClassroomId] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [filteredCompletedBooks, setFilteredCompletedBooks] = useState([]);
    const [filteredInProgressBooks, setFilteredInProgressBooks] = useState([]);

    // 🔒 Redirect admins trying to access this dashboard
    useEffect(() => {
        if (role === 'ADMIN') {
            navigate('/admin-dashboard');
        }
    }, [role, navigate]);

    // Initialize filter state from URL parameters
    useEffect(() => {
        const urlFilterType = searchParams.get('filter') || 'global';
        const urlClassroomId = searchParams.get('classroom');
        
        setFilterType(urlFilterType);
        if (urlClassroomId) {
            setSelectedClassroomId(parseInt(urlClassroomId));
        }
    }, [searchParams]);

    // Update URL when filter changes
    const updateFilter = (newFilterType, newClassroomId = null) => {
        setFilterType(newFilterType);
        setSelectedClassroomId(newClassroomId);
        
        const newParams = new URLSearchParams();
        newParams.set('filter', newFilterType);
        if (newClassroomId) {
            newParams.set('classroom', newClassroomId.toString());
        }
        setSearchParams(newParams);
    };

    // Fetch user's classrooms
    const fetchClassrooms = async () => {
        if (!userId || !token) return;
        
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/student/${userId}`, { headers });
            setClassrooms(response.data);
            console.log('Fetched classrooms:', response.data);
        } catch (error) {
            console.error('Error fetching classrooms:', error);
        }
    };

    // Filter books based on selected filter
    const filterBooks = (books) => {
        if (filterType === 'global') {
            return books; // Show all books
        } else if (filterType === 'classroom' && selectedClassroomId) {
            return books.filter(book => 
                book.book.classroomId === selectedClassroomId
            );
        }
        return books;
    };

    // Update filtered books when filter changes
    useEffect(() => {
        setFilteredCompletedBooks(filterBooks(completedBooks));
        setFilteredInProgressBooks(filterBooks(inProgressBooks));
    }, [filterType, selectedClassroomId, completedBooks, inProgressBooks]);

    // Update stats when filtered books change
    useEffect(() => {
        setStats({
            completedCount: filteredCompletedBooks.length,
            inProgressCount: filteredInProgressBooks.length,
        });
    }, [filteredCompletedBooks, filteredInProgressBooks]);

    // Recalculate average scores when filtered books change
    useEffect(() => {
        const allFilteredBooks = [...filteredCompletedBooks, ...filteredInProgressBooks];
        
        if (allFilteredBooks.length === 0) {
            setAverageScores({
                snakeGame: 0,
                ssa: 0,
                prediction: 0
            });
            return;
        }

        // Get book IDs from the filtered books
        const bookIds = allFilteredBooks.map(book => book.book.bookID);
        
        // Calculate average snake game score
        let snakeTotal = 0;
        let snakeCount = 0;
        bookIds.forEach(bookId => {
            if (snakeGameAttempts[bookId] > 0) {
                snakeTotal += calculateSnakeGameScore(snakeGameAttempts[bookId]);
                snakeCount++;
            }
        });
        
        // Calculate average SSA score
        let ssaTotal = 0;
        let ssaCount = 0;
        bookIds.forEach(bookId => {
            if (ssaAttempts[bookId] > 0) {
                ssaTotal += calculateSSAScore(ssaAttempts[bookId]);
                ssaCount++;
            }
        });
        
        // Calculate average prediction score (use correct)
        let predictionTotal = 0;
        let predictionCount = 0;
        bookIds.forEach(bookId => {
            const attempt = predictionAttempts[bookId];
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
    }, [filteredCompletedBooks, filteredInProgressBooks, snakeGameAttempts, ssaAttempts, predictionAttempts]);

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
                
                // Debug: Log the structure of the progress data
                console.log('Completed books data:', completedBooksRes.data);
                console.log('In-progress books data:', inProgressBooksRes.data);
                
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
                                    // First check if there are any attempts to avoid 404s
                                    const attemptCountRes = await axios.get(
                                        `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${checkpointId}/count`,
                                        { headers }
                                    );
                                    if (attemptCountRes.data && Number(attemptCountRes.data) > 0) {
                                        // Fetch the latest attempt only if there is at least one
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
                
                // Calculate average scores based on current filter
                const calculateAverages = (booksToCalculate) => {
                    // Get book IDs from the filtered books
                    const bookIds = booksToCalculate.map(book => book.book.bookID);
                    
                    // Calculate average snake game score
                    let snakeTotal = 0;
                    let snakeCount = 0;
                    bookIds.forEach(bookId => {
                        if (snakeAttemptsData[bookId] > 0) {
                            snakeTotal += calculateSnakeGameScore(snakeAttemptsData[bookId]);
                            snakeCount++;
                        }
                    });
                    
                    // Calculate average SSA score
                    let ssaTotal = 0;
                    let ssaCount = 0;
                    bookIds.forEach(bookId => {
                        if (ssaAttemptsData[bookId] > 0) {
                            ssaTotal += calculateSSAScore(ssaAttemptsData[bookId]);
                            ssaCount++;
                        }
                    });
                    
                    // Calculate average prediction score (use correct)
                    let predictionTotal = 0;
                    let predictionCount = 0;
                    bookIds.forEach(bookId => {
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
                
                // Calculate initial averages with all books
                calculateAverages([...completedBooksRes.data, ...inProgressBooksRes.data]);
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
            fetchClassrooms();
        }
    }, [userId, token]);

    const formatDuration = (totalReadingTimeSeconds) => {
        // Debug: Log the input value
        console.log('formatDuration input:', totalReadingTimeSeconds, 'type:', typeof totalReadingTimeSeconds);
        
        // Handle the case where totalReadingTimeSeconds might be undefined or null
        if (!totalReadingTimeSeconds || typeof totalReadingTimeSeconds !== 'number' || isNaN(totalReadingTimeSeconds)) {
            console.log('formatDuration: Using fallback 0h 0m 0s');
            return '0h 0m 0s';
        }
        
        const totalSeconds = Math.floor(totalReadingTimeSeconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const result = `${hours}h ${minutes}m ${seconds}s`;
        console.log('formatDuration result:', result);
        return result;
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

                    {/* Filter Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            🔍 Filter Books
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                            {/* Filter Type Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => updateFilter('global')}
                                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                                        filterType === 'global'
                                            ? 'bg-white text-blue-600 shadow-sm font-semibold'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    🌍 Global
                                </button>
                                <button
                                    onClick={() => updateFilter('classroom')}
                                    className={`px-4 py-2 rounded-md transition-all duration-200 ${
                                        filterType === 'classroom'
                                            ? 'bg-white text-blue-600 shadow-sm font-semibold'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    🏫 By Classroom
                                </button>
                            </div>

                            {/* Classroom Selector */}
                            {filterType === 'classroom' && (
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Classroom:</label>
                                    <select
                                        value={selectedClassroomId || ''}
                                        onChange={(e) => {
                                            const classroomId = e.target.value ? parseInt(e.target.value) : null;
                                            updateFilter('classroom', classroomId);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                                    >
                                        <option value="">Select a classroom</option>
                                        {classrooms.map((classroom) => (
                                            <option key={classroom.id} value={classroom.id}>
                                                {classroom.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        {/* Filter Status */}
                        <div className="mt-4 text-center">
                            <span className="text-sm text-gray-600">
                                {filterType === 'global' 
                                    ? 'Showing all books'
                                    : selectedClassroomId 
                                        ? `Showing books from ${classrooms.find(c => c.id === selectedClassroomId)?.name || 'selected classroom'}`
                                        : 'Please select a classroom'
                                }
                            </span>
                        </div>
                    </div>

                    {/* Statistics Cards with Enhanced Design */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-blue-500">
                            <div className="bg-blue-100 rounded-full p-4 mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <span className="text-gray-600 text-xl mb-3 font-medium">Completed Books</span>
                            <span className="text-5xl font-bold text-blue-600">{stats.completedCount}</span>
                            <div className="mt-2 text-sm text-gray-500">Great job!</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-yellow-500">
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
                        <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            🎯 Average Activity Scores
                        </h2>
                        <p className="text-center text-gray-600 mb-8">
                            {filterType === 'global' 
                                ? 'Across all books'
                                : selectedClassroomId 
                                    ? `For ${classrooms.find(c => c.id === selectedClassroomId)?.name || 'selected classroom'}`
                                    : 'Please select a classroom to view scores'
                            }
                        </p>
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
                                <div className="text-sm text-green-600 mt-2 text-center">
                                    {filterType === 'global' ? 'Global Average' : 'Classroom Average'}
                                </div>
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
                                <div className="text-sm text-blue-600 mt-2 text-center">
                                    {filterType === 'global' ? 'Global Average' : 'Classroom Average'}
                                </div>
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
                                <div className="text-sm text-purple-600 mt-2 text-center">
                                    {filterType === 'global' ? 'Global Average' : 'Classroom Average'}
                                </div>
                            </div>
                        </div>
                    </div>
                
                    {/* Books in Progress with Enhanced Design */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            📖 Books in Progress
                        </h2>
                        <div className="space-y-6">
                            {filteredInProgressBooks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <p className="text-gray-500 text-xl">
                                        {filterType === 'global' 
                                            ? 'No books in progress yet.'
                                            : selectedClassroomId 
                                                ? 'No books in progress for this classroom.'
                                                : 'Please select a classroom to view books.'
                                        }
                                    </p>
                                    <p className="text-gray-400 mt-2">
                                        {filterType === 'global' 
                                            ? 'Start reading to see your progress here!'
                                            : 'Try selecting a different classroom or switch to Global view.'
                                        }
                                    </p>
                                </div>
                            )}
                            {filteredInProgressBooks.map((book) => (
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
                                                        {formatDuration(book.totalReadingTimeSeconds)} read
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
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            ✅ Completed Books
                        </h2>
                        <div className="space-y-6">
                            {filteredCompletedBooks.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <p className="text-gray-500 text-xl">
                                        {filterType === 'global' 
                                            ? 'No completed books yet.'
                                            : selectedClassroomId 
                                                ? 'No completed books for this classroom.'
                                                : 'Please select a classroom to view books.'
                                        }
                                    </p>
                                    <p className="text-gray-400 mt-2">
                                        {filterType === 'global' 
                                            ? 'Finish reading a book to see it here!'
                                            : 'Try selecting a different classroom or switch to Global view.'
                                        }
                                    </p>
                                </div>
                            )}
                            {filteredCompletedBooks.map((book) => (
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
                                                        Total reading time: {formatDuration(book.totalReadingTimeSeconds)}
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