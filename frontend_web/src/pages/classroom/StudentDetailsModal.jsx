import React from 'react';

const StudentDetailsModal = ({ 
  isOpen, 
  student: selectedStudent, 
  onClose, 
  formatTime, 
  calculateSnakeGameScore, 
  calculateSSAScore 
}) => {
  if (!isOpen || !selectedStudent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedStudent.firstName} {selectedStudent.lastName} - Progress Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Student Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedStudent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium">{selectedStudent.userId || selectedStudent.id || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Progress Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Progress Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Books Completed</p>
                <p className="text-xl font-bold text-blue-600">{selectedStudent.progressData?.completedCount || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Books In Progress</p>
                <p className="text-xl font-bold text-orange-600">{selectedStudent.progressData?.inProgressCount || 0}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Reading Time</p>
                <p className="text-xl font-bold text-green-600">{formatTime(selectedStudent.progressData?.totalReadingTimeMinutes || 0)}</p>
              </div>
            </div>
          </div>
          
          {/* Completed Books */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Completed Books</h3>
            {selectedStudent.progressData?.completedBooks && selectedStudent.progressData.completedBooks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snake Game</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story Sequencing</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedStudent.progressData.completedBooks.map((book, index) => {
                      const bookId = book.book.bookID;
                      const snakeAttempts = selectedStudent.progressData.snakeAttemptsData?.[bookId] || 0;
                      const ssaAttempts = selectedStudent.progressData.ssaAttemptsData?.[bookId] || 0;
                      const snakeScore = calculateSnakeGameScore(snakeAttempts);
                      const ssaScore = calculateSSAScore(ssaAttempts);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{book.book.title}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {book.endTime ? new Date(book.endTime).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {formatTime(book.totalReadingTimeMinutes || 
                              (book.totalReadingTime?.seconds ? Math.floor(book.totalReadingTime.seconds / 60) : 0))}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {snakeAttempts > 0 ? (
                              <span className="text-green-600">{snakeScore} points ({snakeAttempts} attempts)</span>
                            ) : (
                              <span className="text-gray-400">Not attempted</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {ssaAttempts > 0 ? (
                              <span className="text-blue-600">{ssaScore} points ({ssaAttempts} attempts)</span>
                            ) : (
                              <span className="text-gray-400">Not attempted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No completed books yet.</p>
            )}
          </div>
          
          {/* In Progress Books */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Books In Progress</h3>
            {selectedStudent.progressData?.inProgressBooks && selectedStudent.progressData.inProgressBooks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Read</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snake Game</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story Sequencing</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedStudent.progressData.inProgressBooks.map((book, index) => {
                      const bookId = book.book.bookID;
                      const snakeAttempts = selectedStudent.progressData.snakeAttemptsData?.[bookId] || 0;
                      const ssaAttempts = selectedStudent.progressData.ssaAttemptsData?.[bookId] || 0;
                      const snakeScore = calculateSnakeGameScore(snakeAttempts);
                      const ssaScore = calculateSSAScore(ssaAttempts);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{book.book.title}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {book.lastReadAt ? new Date(book.lastReadAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {formatTime(book.totalReadingTimeMinutes || 
                              (book.totalReadingTime?.seconds ? Math.floor(book.totalReadingTime.seconds / 60) : 0))}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${book.progress || 0}%` }}
                                ></div>
                              </div>
                              <span>{book.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {snakeAttempts > 0 ? (
                              <span className="text-green-600">{snakeScore} points ({snakeAttempts} attempts)</span>
                            ) : (
                              <span className="text-gray-400">Not attempted</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {ssaAttempts > 0 ? (
                              <span className="text-blue-600">{ssaScore} points ({ssaAttempts} attempts)</span>
                            ) : (
                              <span className="text-gray-400">Not attempted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No books in progress.</p>
            )}
          </div>
          
          {/* Comprehension Activities */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Comprehension Activities</h3>
            <p className="text-gray-500 mb-2">Average Comprehension Score: <span className="font-bold">{selectedStudent.progressData?.avgComprehensionScore || 0}%</span></p>
            <p className="text-sm text-gray-500">
              This score is calculated based on the student's performance in Snake Game and Sentence Sorting activities across all books.
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;