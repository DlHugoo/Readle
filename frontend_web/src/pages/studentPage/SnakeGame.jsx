import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './SnakeGame.css'; // For styling

const gridSize = 10;
const initialSnake = [{ x: 0, y: 0 }];
const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(initialSnake);
  const [dir, setDir] = useState(directions.ArrowRight);
  const [questions, setQuestions] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [answerPositions, setAnswerPositions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef();

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/snake-questions/random?count=5');
        setQuestions(res.data);

        const sequence = res.data.map(q => q.answers.find(a => a.correct)?.text);
        setSequence(sequence);

        const allAnswers = res.data.flatMap(q => q.answers.map(a => a.text));
        const positions = allAnswers.map(ans => ({
          text: ans,
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        }));
        setAnswerPositions(positions);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuestions();
  }, []);

  // Snake movement
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const newHead = {
          x: (head.x + dir.x + gridSize) % gridSize,
          y: (head.y + dir.y + gridSize) % gridSize,
        };

        // Check if the new head position has the correct answer
        const found = answerPositions.find(p => p.x === newHead.x && p.y === newHead.y);
        if (found) {
          if (found.text === sequence[currentIndex]) {
            setCurrentIndex(currentIndex + 1);
            setAnswerPositions(answerPositions.filter(p => !(p.x === found.x && p.y === found.y)));
            if (currentIndex + 1 === sequence.length) {
              alert('You won!');
              clearInterval(intervalRef.current);
            }
            return [newHead, ...prev]; // grow
          } else {
            alert('Wrong answer! Game over.');
            clearInterval(intervalRef.current);
            return prev;
          }
        }

        // Move snake
        return [newHead, ...prev.slice(0, -1)];
      });
    }, 300);

    return () => clearInterval(intervalRef.current);
  }, [dir, answerPositions, currentIndex]);

  // Key controls
  useEffect(() => {
    const handleKey = e => {
      if (directions[e.key]) setDir(directions[e.key]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div>
      <h2>Snake Quiz Game</h2>
      <p>Eat answers in correct order:</p>
      <ol>
        {sequence.map((ans, i) => (
          <li key={i} style={{ textDecoration: i < currentIndex ? 'line-through' : 'none' }}>
            {ans}
          </li>
        ))}
      </ol>
      <div className="grid">
        {[...Array(gridSize)].map((_, y) =>
          [...Array(gridSize)].map((_, x) => {
            const isSnake = snake.some(s => s.x === x && s.y === y);
            const answer = answerPositions.find(p => p.x === x && p.y === y);
            return (
              <div key={`${x}-${y}`} className={`cell ${isSnake ? 'snake' : ''}`}>
                {answer ? answer.text : ''}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SnakeGame;
