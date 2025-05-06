import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import SnakeUp from '../../assets/snake/snakeup.png';
import SnakeDown from '../../assets/snake/snakedown.png';
import SnakeLeft from '../../assets/snake/snakeleft.png';
import SnakeRight from '../../assets/snake/snakeright.png';

const gridSize = 10;
const cellSize = 40; // pixels
const gapSize = 4;   // pixels
const initialSnake = [{ x: 0, y: 0 }];
const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const arrowSymbols = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→'
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(initialSnake);
  const [dir, setDir] = useState(directions.ArrowRight);
  const [currentDirection, setCurrentDirection] = useState('ArrowRight');
  const [questions, setQuestions] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [answerPositions, setAnswerPositions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef();

  // Calculate the exact grid container size
  const gridContainerSize = gridSize * cellSize + (gridSize - 1) * gapSize;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/snake-questions/random?count=5');
        setQuestions(res.data);

        // Set the sequence of correct answers (to check against)
        const correctAnswers = res.data.map(q => 
          q.answers.find(a => a.correct)?.answer
        );
        setSequence(correctAnswers);

        // Get all answers (correct and incorrect) for the grid
        const allAnswers = res.data.flatMap(q => 
          q.answers.map(a => a.answer)
        );
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
      if (directions[e.key]) {
        e.preventDefault(); 
        setDir(directions[e.key]);
        setCurrentDirection(e.key);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const getSnakeSymbol = (segment, index, snakeArray) => {
    if (index === 0) {
      const directionToImage = {
        ArrowUp: SnakeUp,
        ArrowDown: SnakeDown,
        ArrowLeft: SnakeLeft,
        ArrowRight: SnakeRight
      };
      return (
        <img
          src={directionToImage[currentDirection]}
          alt="snake-head"
          className="w-6 h-6"
        />
      );
    } else {
      return (
        <div className="w-5 h-5 bg-green-500 rounded-sm" />
      );
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="container mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Snake Quiz Game</h2>
        <p className="text-center text-gray-600 mb-6">
          Use arrow keys to move. Eat answers in the correct order for each question:
        </p>

        <ol className="max-w-xl mx-auto list-decimal list-inside mb-10 bg-white p-6 rounded-2xl shadow-lg space-y-2">
          {questions.map((q, i) => (
            <li
              key={i}
              className={`text-lg ${i < currentIndex ? 'line-through text-green-500' : 'text-gray-700'}`}
            >
              {q.text}
              <span className="ml-2 text-sm text-gray-500">
                (Find: {sequence[i]})
              </span>
            </li>
          ))}
        </ol>

        <div className="mx-auto bg-white rounded-2xl shadow-lg overflow-hidden"
          style={{
            width: `${gridContainerSize + 8}px`,
            height: `${gridContainerSize + 8}px`,
            padding: '4px'
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
              gap: `${gapSize}px`,
              width: `${gridContainerSize}px`,
              height: `${gridContainerSize}px`
            }}
          >
            {[...Array(gridSize)].map((_, y) =>
              [...Array(gridSize)].map((_, x) => {
                const snakeSegment = snake.findIndex(s => s.x === x && s.y === y);
                const isSnake = snakeSegment !== -1;
                const answer = answerPositions.find(p => p.x === x && p.y === y);
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`flex items-center justify-center rounded-md text-xl font-bold ${
                      isSnake ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                    }`}
                    style={{ 
                      width: `${cellSize}px`, 
                      height: `${cellSize}px` 
                    }}
                  >
                    {isSnake ? getSnakeSymbol({x, y}, snakeSegment, snake) : (answer ? answer.text : '')}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;