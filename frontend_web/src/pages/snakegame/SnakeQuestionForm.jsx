import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import TeacherNav from '../../components/TeacherNav';
import { ArrowLeft, CheckCircle, Edit, Save, X } from 'lucide-react';

const SnakeQuestionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookId, setBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [hasExistingQuestions, setHasExistingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editFormData, setEditFormData] = useState({ text: '', answer: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [questions, setQuestions] = useState([
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
  ]);

  // Get bookId from navigation state or URL params
  useEffect(() => {
    setLoading(true);
    let id = null;
    
    if (location.state?.bookId) {
      id = location.state.bookId;
      if (location.state.bookTitle) {
        setBookTitle(location.state.bookTitle);
      }
    } 
    else if (location.search) {
      const params = new URLSearchParams(location.search);
      id = params.get('bookId');
    }
    
    if (id) {
      console.log('Found bookId:', id);
      setBookId(id);
    } else {
      console.log('No bookId found, redirecting back');
      alert('No book selected. Returning to previous page.');
      navigate(-1);
    }
    
    setLoading(false);
  }, [location, navigate]);

  // Fetch book title if we have bookId but no title yet
  useEffect(() => {
    if (bookId && !bookTitle) {
      setLoading(true);
      axios.get(`http://localhost:8080/api/books/${bookId}`)
        .then(response => {
          setBookTitle(response.data.title);
        })
        .catch(error => {
          console.error('Error fetching book details:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookId, bookTitle]);

  // Check if questions already exist for this specific book
  useEffect(() => {
    if (bookId) {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      axios.get(`http://localhost:8080/api/snake-questions/book/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          console.log('API Response for book questions:', response.data);
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            setExistingQuestions(response.data);
            setHasExistingQuestions(true);
          } else {
            setExistingQuestions([]);
            setHasExistingQuestions(false);
          }
        })
        .catch(error => {
          console.error('Error checking existing questions:', error);
          if (error.response) {
            if (error.response.status === 403) {
              alert('Access denied. Only teachers and admins can access questions.');
              navigate('/');
            } else if (error.response.status === 404) {
              setExistingQuestions([]);
              setHasExistingQuestions(false);
            } else {
              alert('Error loading questions: ' + (error.response.data?.message || 'Please try again'));
            }
          } else {
            alert('Error loading questions. Please check your connection and try again.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookId, navigate]);

  // Also update the handleSubmit function to include the token
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!bookId) {
        alert('No book associated with these questions');
        return;
      }

      const emptyQuestions = questions.filter(q => !q.text || !q.answer);
      if (emptyQuestions.length > 0) {
        alert('Please fill in all questions and answers');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const checkResponse = await axios.get(
        `http://localhost:8080/api/snake-questions/book/${bookId}`,
        { headers }
      );
      
      if (checkResponse.data && Array.isArray(checkResponse.data) && checkResponse.data.length > 0) {
        alert('Questions already exist for this book. You cannot add more.');
        setLoading(false);
        setHasExistingQuestions(true);
        setExistingQuestions(checkResponse.data);
        return;
      }

      const questionsToSubmit = questions.map(q => ({
        ...q,
        bookId: bookId
      }));

      const promises = questionsToSubmit.map(q => 
        axios.post('http://localhost:8080/api/snake-questions', q, { headers })
      );

      await Promise.all(promises);
      alert('5 questions submitted successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Error submitting questions:', err);
      if (err.response?.status === 403) {
        alert('Access denied. Only teachers and admins can create questions.');
        navigate('/');
      } else {
        alert('Failed to submit questions: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (index, value) => {
    const updated = [...questions];
    updated[index].answer = value;
    setQuestions(updated);
  };

  const handleEditClick = (question) => {
    setEditingQuestionId(question.questionID);
    setEditFormData({
        text: question.text,
        answer: question.answers?.[0]?.answer || question.answer || ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData({ text: '', answer: '' });
  };

  const handleUpdateQuestion = async (questionID) => {
    try {
        if (!editFormData.text || !editFormData.answer) {
            alert('Please fill in both question and answer fields');
            return;
        }

        setLoading(true);

        await axios.put(
            `http://localhost:8080/api/snake-questions/${questionID}`,
            {
                text: editFormData.text,
                answer: editFormData.answer,
                bookId: bookId
            }
        );

        const response = await axios.get(`http://localhost:8080/api/snake-questions/book/${bookId}`);
        setExistingQuestions(response.data);
        setEditingQuestionId(null);
        setShowSuccessModal(true); // Show modal instead of alert
    } catch (error) {
        console.error('Error updating question:', error);
        alert('Failed to update question: ' + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <TeacherNav />
      <div className="container mx-auto pt-24 pb-12 px-6">
        {loading ? (
          <div className="text-center">
            <p className="text-xl">Loading book information...</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => navigate(-1)} 
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ArrowLeft size={20} className="mr-1" />
                Back to Book
              </button>
            </div>
            <h3 className="text-xl text-center text-gray-600 mb-2">
                Snake Quiz Questions 
            </h3>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
              for "{bookTitle}"
            </h2>
          </div>
        )}
        
        {loading ? (
          <div className="text-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : hasExistingQuestions ? (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-center justify-center mb-4 text-green-600">
              <CheckCircle size={24} className="mr-2" />
              <h3 className="text-xl font-semibold">
                Questions Already Created
              </h3>
            </div>
            
            <div className="space-y-6">
              {existingQuestions.map((q, index) => (
                <div key={q.questionID} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                  {editingQuestionId === q.questionID ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Editing Question {index + 1}</h4>
                      <input
                        type="text"
                        name="text"
                        value={editFormData.text}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded"
                        placeholder="Question text"
                      />
                      <input
                        type="text"
                        name="answer"
                        value={editFormData.answer}
                        onChange={handleEditFormChange}
                        className="w-full p-2 border rounded"
                        placeholder="Correct answer"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleUpdateQuestion(q.questionID)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-lg mb-2">Question {index + 1}</h4>
                      <p className="mb-2"><span className="font-medium">Question:</span> {q.text}</p>
                      <p><span className="font-medium">Answer:</span> {q.answers?.[0]?.answer || q.answer}</p>
                      <button
                        onClick={() => handleEditClick(q)}
                        className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"
                        title="Edit question"
                      >
                        <Edit size={18} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">
                This book already has Snake Game questions. You can edit them above.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="bg-blue-500 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-600 transition"
              >
                Return to Book
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg space-y-4"
              >
                <h3 className="text-xl font-semibold text-gray-700">
                  Question {index + 1}
                </h3>
                <input
                  type="text"
                  placeholder="Enter question"
                  value={q.text}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Correct answer"
                  value={q.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            ))}
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-500 text-white font-bold px-8 py-3 rounded-full hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-pink-500 text-white font-bold px-8 py-3 rounded-full hover:bg-pink-600 transition"
              >
                Submit All
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center">
              <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6 text-center">
                The question has been updated successfully.
              </p>
              <button
                onClick={closeSuccessModal}
                className="bg-blue-500 text-white font-bold px-6 py-2 rounded-full hover:bg-blue-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeQuestionForm;