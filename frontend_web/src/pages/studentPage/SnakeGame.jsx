import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar'; // adjust the path as needed

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

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const newHead = {
          x: head.x + dir.x,
          y: head.y + dir.y,
        };
    
        // Wall collision check
        if (
          newHead.x < 0 || newHead.x >= gridSize ||
          newHead.y < 0 || newHead.y >= gridSize
        ) {
          alert('You hit the wall! Game over.');
          clearInterval(intervalRef.current);
          return prev;
        }
    
        const found = answerPositions.find(p => p.x === newHead.x && p.y === newHead.y);
        if (found) {
          if (found.text === sequence[currentIndex]) {
            setCurrentIndex(currentIndex + 1);
            setAnswerPositions(answerPositions.filter(p => !(p.x === found.x && p.y === found.y)));
            if (currentIndex + 1 === sequence.length) {
              alert('You won!');
              clearInterval(intervalRef.current);
            }
            return [newHead, ...prev];
          } else {
            alert('Wrong answer! Game over.');
            clearInterval(intervalRef.current);
            return prev;
          }
        }
    
        return [newHead, ...prev.slice(0, -1)];
      });
    }, 300);
    

    return () => clearInterval(intervalRef.current);
  }, [dir, answerPositions, currentIndex]);

  useEffect(() => {
    const handleKey = e => {
      if (directions[e.key]) setDir(directions[e.key]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="container mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Snake Quiz Game</h2>
        <p className="text-center text-gray-600 mb-6">
          Use arrow keys to move. Eat answers in the correct order:
        </p>

        <ol className="max-w-xl mx-auto list-decimal list-inside mb-10 bg-white p-6 rounded-2xl shadow-lg space-y-2">
          {sequence.map((ans, i) => (
            <li
              key={i}
              className={`text-lg ${i < currentIndex ? 'line-through text-green-500' : 'text-gray-700'}`}
            >
              {ans}
            </li>
          ))}
        </ol>

        <div
          className="grid mx-auto bg-white p-4 rounded-2xl shadow-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 40px)`,
            gridTemplateRows: `repeat(${gridSize}, 40px)`,
            gap: '4px',
            width: `${gridSize * 40 + (gridSize - 1) * 4}px`,
          }}
        >
          {[...Array(gridSize)].map((_, y) =>
            [...Array(gridSize)].map((_, x) => {
              const isSnake = snake.some(s => s.x === x && s.y === y);
              const answer = answerPositions.find(p => p.x === x && p.y === y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`flex items-center justify-center border rounded-md text-sm font-medium ${
                    isSnake ? 'bg-green-500 text-white' : 'bg-gray-100'
                  }`}
                  style={{ width: '40px', height: '40px' }}
                >
                  {answer ? answer.text : ''}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
