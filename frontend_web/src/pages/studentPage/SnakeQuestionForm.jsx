import React, { useState } from 'react';
import axios from 'axios';

const SnakeQuestionForm = () => {
  const [questions, setQuestions] = useState([
    { text: '', answers: [{ text: '', correct: false }] },
    { text: '', answers: [{ text: '', correct: false }] },
    { text: '', answers: [{ text: '', correct: false }] },
    { text: '', answers: [{ text: '', correct: false }] },
    { text: '', answers: [{ text: '', correct: false }] },
  ]);

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (qIndex, aIndex, key, value) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex][key] = key === 'correct' ? value : value;
    setQuestions(updated);
  };

  const addAnswer = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].answers.push({ text: '', correct: false });
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      for (const q of questions) {
        await axios.post('http://localhost:8080/api/snake-questions', q);
      }
      alert('5 questions submitted successfully!');
      // Reset form if needed
    } catch (err) {
      console.error(err);
      alert('Failed to submit questions');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Submit 5 Snake Quiz Questions</h2>
      {questions.map((q, qIndex) => (
        <div key={qIndex} style={{ marginBottom: '20px' }}>
          <h4>Question {qIndex + 1}</h4>
          <input
            type="text"
            placeholder="Enter question"
            value={q.text}
            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
            required
          />

          {q.answers.map((a, aIndex) => (
            <div key={aIndex}>
              <input
                type="text"
                placeholder="Answer"
                value={a.text}
                onChange={(e) =>
                  handleAnswerChange(qIndex, aIndex, 'text', e.target.value)
                }
                required
              />
              <label>
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={a.correct}
                  onChange={() =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === qIndex
                          ? {
                              ...item,
                              answers: item.answers.map((ans, j) => ({
                                ...ans,
                                correct: j === aIndex,
                              })),
                            }
                          : item
                      )
                    )
                  }
                />
                Correct
              </label>
            </div>
          ))}
          <button type="button" onClick={() => addAnswer(qIndex)}>
            Add Another Answer
          </button>
        </div>
      ))}

      <button type="submit">Submit All</button>
    </form>
  );
};

export default SnakeQuestionForm;
