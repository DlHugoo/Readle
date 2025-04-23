import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar'; // adjust path if needed

const SnakeQuestionForm = () => {
  const [questions, setQuestions] = useState([
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
    { text: '', answer: '' },
  ]);

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
      for (const q of questions) {
        await axios.post('http://localhost:8080/api/snake-questions', q);
      }
      alert('5 questions submitted successfully!');
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
          Submit 5 Snake Quiz Questions
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
          <div className="text-center">
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
