import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentNavbar from '../../components/StudentNavbar';

const API_BASE_URL = 'http://localhost:8080';

const StudentProgressDashboard = () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCount: 0,
        inProgressCount: 0,
    });
    const [completedBooks, setCompletedBooks] = useState([]);
    const [inProgressBooks, setInProgressBooks] = useState([]);
    const [error, setError] = useState(null);

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
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Reading Progress Dashboard</h1>

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
                                            <div className="text-sm text-gray-500 mt-1">
                                                Last read: {new Date(book.lastReadAt).toLocaleDateString()}<br />
                                                Page {book.lastPageRead} of {book.book.pageIds ? book.book.pageIds.length : 1} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
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
                                        <div className="text-sm text-gray-500 mt-1">
                                            Completed on: {new Date(book.endTime).toLocaleDateString()}<br />
                                            Total reading time: {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)}
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