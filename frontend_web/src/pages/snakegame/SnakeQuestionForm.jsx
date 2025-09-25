import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import TeacherNav from '../../components/TeacherNav';
import { 
  ArrowLeft, 
  CheckCircle, 
  Edit, 
  Save, 
  X, 
  Sparkles,
  Star,
  Heart,
  Zap,
  Brain,
  Play,
  FileText,
  ChevronLeft,
  Plus,
  Target,
  Gamepad2,
  Trophy,
  Lightbulb,
  BookOpen
} from 'lucide-react';

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
      axios.get(`http://localhost:3000/api/books/${bookId}`)
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
      
      axios.get(`http://localhost:3000/api/snake-questions/book/${bookId}`, {
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
      `http://localhost:3000/api/snake-questions/book/${bookId}`,
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
      axios.post('http://localhost:3000/api/snake-questions', q, { headers })
    );

    await Promise.all(promises);
    
    // Instead of reloading, fetch the newly created questions and update state
    const response = await axios.get(`http://localhost:3000/api/snake-questions/book/${bookId}`, { headers });
    setExistingQuestions(response.data);
    setHasExistingQuestions(true);
    setShowSuccessModal(true);
    
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
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.put(
        `http://localhost:3000/api/snake-questions/${questionID}`,
        {
          text: editFormData.text,
          answer: editFormData.answer,
          bookId: bookId
        },
        { headers }
      );

      const response = await axios.get(`http://localhost:3000/api/snake-questions/book/${bookId}`, { headers });
      setExistingQuestions(response.data);
      setEditingQuestionId(null);
      setShowSuccessModal(true);
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
    <div className="w-full min-h-screen bg-white">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeacherNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-32">
        {/* Floating decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-200/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-orange-200/20 rounded-full blur-2xl"></div>
        </div>

        {/* Enhanced Header Section */}
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="group flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft size={20} className="text-green-600 group-hover:text-green-700" />
              <span className="font-semibold text-green-600 group-hover:text-green-700">Back to Book</span>
            </button>
            
            {/* Decorative elements */}
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              <Star className="text-orange-500" size={16} />
              <Heart className="text-red-400" size={16} />
            </div>
          </div>
          
          {/* Professional Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-orange-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Gamepad2 size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent mb-1">
                      Snake Game Questions
                    </h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">Book:</span>
                      <span className="font-semibold text-gray-800">"{bookTitle || 'Loading...'}"</span>
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Book Stats */}
                <div className="hidden lg:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-500">Questions</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {hasExistingQuestions ? 'Created' : 'New'}
                    </div>
                    <div className="text-sm text-gray-500">Status</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">Quiz</div>
                    <div className="text-sm text-gray-500">Activity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Loading snake questions...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we prepare everything</p>
              </div>
            </div>
          </div>
        ) : hasExistingQuestions ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-orange-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-orange-50 px-6 py-3 rounded-xl border border-green-200">
                  <CheckCircle size={28} className="text-green-600" />
                  <h3 className="text-2xl font-bold text-green-800">
                    Questions Already Created
                  </h3>
                  <Trophy size={24} className="text-orange-500" />
                </div>
              </div>
            
              <div className="space-y-6">
                {existingQuestions.map((q, index) => (
                  <div key={q.questionID} className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-orange-200 rounded-full transform translate-x-8 -translate-y-8"></div>
                    <div className="relative z-10">
                      {editingQuestionId === q.questionID ? (
                        <div className="space-y-6">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                              <Brain size={20} className="text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Editing Question {index + 1}</h4>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Lightbulb size={16} className="inline mr-2" />
                                Question Text
                              </label>
                              <input
                                type="text"
                                name="text"
                                value={editFormData.text}
                                onChange={handleEditFormChange}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                                placeholder="Enter your question here..."
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Target size={16} className="inline mr-2" />
                                Correct Answer
                              </label>
                              <input
                                type="text"
                                name="answer"
                                value={editFormData.answer}
                                onChange={handleEditFormChange}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                                placeholder="Enter the correct answer..."
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={handleCancelEdit}
                              className="group px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                            >
                              <X size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                              <span className="font-semibold">Cancel</span>
                            </button>
                            <button
                              onClick={() => handleUpdateQuestion(q.questionID)}
                              className="group px-6 py-3 bg-gradient-to-r from-green-500 to-orange-600 hover:from-green-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                            >
                              <Save size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                              <span className="font-semibold">Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-lg">{index + 1}</span>
                              </div>
                              <h4 className="text-xl font-bold text-gray-800">Snake Game Question {index + 1}</h4>
                            </div>
                            <button
                              onClick={() => handleEditClick(q)}
                              className="group p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                              title="Edit question"
                            >
                              <Edit size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                              <div className="flex items-start">
                                <Lightbulb size={20} className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-gray-700 mb-1">Question:</p>
                                  <p className="text-gray-800 leading-relaxed">{q.text}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl border border-green-200">
                              <div className="flex items-start">
                                <Target size={20} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-gray-700 mb-1">Answer:</p>
                                  <p className="text-gray-800 leading-relaxed">{q.answers?.[0]?.answer || q.answer}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            
              <div className="mt-8 text-center">
                <div className="bg-gradient-to-r from-green-50 to-orange-50 p-6 rounded-xl border border-green-200 mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <Trophy size={24} className="text-orange-500 mr-2" />
                    <p className="text-lg font-semibold text-gray-700">
                      This book already has Snake Game questions!
                    </p>
                  </div>
                  <p className="text-gray-600">
                    You can edit the questions above or return to the book to create other activities.
                  </p>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-orange-600 hover:from-green-600 hover:to-orange-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center mx-auto"
                >
                  <BookOpen size={20} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Return to Book</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Form Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-orange-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Plus size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Create Snake Game Questions</h2>
                      <p className="text-sm text-gray-600">Add 5 engaging questions for the snake game</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-orange-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Snake Game Question {index + 1}</h3>
                        <p className="text-sm text-gray-600">Create an engaging question for students</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <Lightbulb size={16} className="mr-2 text-blue-600" />
                          Question Text
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your question here... (e.g., What happens when the snake eats food?)"
                          value={q.text}
                          onChange={(e) => handleQuestionChange(index, e.target.value)}
                          required
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                          <Target size={16} className="mr-2 text-orange-600" />
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          placeholder="Enter the correct answer... (e.g., The snake grows longer)"
                          value={q.answer}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          required
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center space-x-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="group px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center"
                >
                  <X size={20} className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-orange-600 hover:from-green-600 hover:to-orange-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center"
                >
                  <Gamepad2 size={20} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Create Snake Questions</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Enhanced Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-orange-500/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle className="text-white w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Success! 🎉</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Your snake game questions have been created successfully! Students can now enjoy the quiz activity.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={() => {
                      closeSuccessModal();
                      navigate(-1); // Go back to the book page
                    }}
                    className="group flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-orange-600 hover:from-green-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <BookOpen size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Return to Book</span>
                  </button>
                  <button
                    onClick={closeSuccessModal}
                    className="group flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <Play size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Stay Here</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeQuestionForm;