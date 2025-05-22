import React from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const StudentProgressModal = ({
  isOpen,
  onClose,
  selectedStudent,
  progressLoading,
  progressError,
  progressStats,
  completedBooks,
  inProgressBooks,
  snakeGameAttempts,
  ssaAttempts
}) => {
  if (!isOpen) return null;

  // Helper function to format reading time
  const formatDuration = (minutes, fallbackDuration) => {
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

  // Functions to calculate scores based on attempts
  const calculateSnakeGameScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 2);
    return Math.max(score, 0);
  };

  const calculateSSAScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 25);
    return Math.max(score, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            Student Progress: {selectedStudent?.firstName || ''} {selectedStudent?.lastName || ''}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {progressLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : progressError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{progressError}</span>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <span className="text-gray-500 text-lg mb-2">Completed Books</span>
                  <span className="text-4xl font-bold text-blue-600">{progressStats.completedCount}</span>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <span className="text-gray-500 text-lg mb-2">Books in Progress</span>
                  <span className="text-4xl font-bold text-yellow-500">{progressStats.inProgressCount}</span>
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
                            <div className="w-16 h-20 bg-gray-200 rounded mr-4 flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-800">{book.book.title}</h3>
                            <div className="text-sm text-gray-500 mt-1">
                              Last read: {book.lastReadAt ? new Date(book.lastReadAt).toLocaleDateString() : 'Never'}<br />
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
              <div className="bg-white rounded-lg shadow p-6 mb-8">
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
                            <div className="w-16 h-20 bg-gray-200 rounded mr-4 flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-800">{book.book.title}</h3>
                            <div className="text-sm text-gray-500 mt-1">
                              Completed on: {book.endTime ? new Date(book.endTime).toLocaleDateString() : 'Unknown'}<br />
                              Total pages: {book.book.pageIds ? book.book.pageIds.length : 1} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <div className="text-sm text-gray-600">Reading Progress: 100%</div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          {snakeGameAttempts[book.book.bookID] > 0 && (
                            <div className="mt-2 text-green-600 text-sm">
                              <span role="img" aria-label="snake">🐍</span> Snake Game Score: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])} points
                            </div>
                          )}
                          {ssaAttempts[book.book.bookID] > 0 && (
                            <div className="mt-1 text-blue-600 text-sm">
                              <span role="img" aria-label="puzzle">🧩</span> Sequencing Score: {calculateSSAScore(ssaAttempts[book.book.bookID])} points
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgressModal;