import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import TeacherNav from '../../components/TeacherNav';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const SnakeQuestionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookId, setBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [hasExistingQuestions, setHasExistingQuestions] = useState(false);
  const [questions, setQuestions] = useState([
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
  ]);

  // Get bookId from navigation state or URL params
  useEffect(() => {
    if (location.state?.bookId) {
      setBookId(location.state.bookId);
      // If book title is passed directly in state, use it
      if (location.state.bookTitle) {
        setBookTitle(location.state.bookTitle);
      }
    } else if (location.search) {
      const params = new URLSearchParams(location.search);
      setBookId(params.get('bookId'));
    } else {
      // If no bookId found, redirect back
      navigate(-1);
    }
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

  // Check if questions already exist for this book
  useEffect(() => {
    if (bookId) {
      setLoading(true);
      // Fix: Use the correct endpoint format
      axios.get(`http://localhost:8080/api/snake-questions/book/${bookId}`)
        .then(response => {
          if (response.data && response.data.length > 0) {
            setExistingQuestions(response.data);
            setHasExistingQuestions(true);
          } else {
            setHasExistingQuestions(false);
          }
        })
        .catch(error => {
          console.error('Error checking existing questions:', error);
          setHasExistingQuestions(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookId]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!bookId) {
        alert('No book associated with these questions');
        return;
      }

      // Prepare all questions with bookId
      const questionsToSubmit = questions.map(q => ({
        ...q,
        bookId: bookId
      }));

      // Submit all questions
      const promises = questionsToSubmit.map(q => 
        axios.post('http://localhost:8080/api/snake-questions', q)
      );

      await Promise.all(promises);
      alert('5 questions submitted successfully!');
      
      // Refresh the page to show the newly created questions
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to submit questions');
    }
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
        
        {hasExistingQuestions ? (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex items-center justify-center mb-4 text-green-600">
              <CheckCircle size={24} className="mr-2" />
              <h3 className="text-xl font-semibold">
                Questions Already Created
              </h3>
            </div>
            
            <div className="space-y-6">
              {existingQuestions.map((q, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-lg mb-2">Question {index + 1}</h4>
                  <p className="mb-2"><span className="font-medium">Question:</span> {q.text}</p>
                  <p><span className="font-medium">Answer:</span> {q.answers && q.answers.length > 0 ? 
                    q.answers.find(a => a.correct)?.answer || q.answers[0].answer : 'No answer provided'}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">
                This book already has Snake Game questions. Each book can only have one set of questions.
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
    </div>
  );
};

export default SnakeQuestionForm;