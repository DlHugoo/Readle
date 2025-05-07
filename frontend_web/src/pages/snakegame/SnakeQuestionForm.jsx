import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const SnakeQuestionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookId, setBookId] = useState(null);
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
    } else if (location.search) {
      const params = new URLSearchParams(location.search);
      setBookId(params.get('bookId'));
    } else {
      // If no bookId found, redirect back
      navigate(-1);
    }
  }, [location, navigate]);

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
      navigate(-1); // Go back after submission
    } catch (err) {
      console.error(err);
      alert('Failed to submit questions');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="container mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Submit 5 Snake Quiz Questions {bookId && `for Book #${bookId}`}
        </h2>
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
      </div>
    </div>
  );
};

export default SnakeQuestionForm;