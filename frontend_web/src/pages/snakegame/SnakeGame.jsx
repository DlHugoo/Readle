import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import SnakeUp from "../../assets/snake/snakeup.png";
import SnakeDown from "../../assets/snake/snakedown.png";
import SnakeLeft from "../../assets/snake/snakeleft.png";
import SnakeRight from "../../assets/snake/snakeright.png";
import Confetti from "react-confetti";

const gridSize = 10;
const cellSize = 50; // Increased from 40px
const gapSize = 2; // Reduced from 4px
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
  const [currentDirection, setCurrentDirection] = useState("ArrowRight");
  const [questions, setQuestions] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [answerPositions, setAnswerPositions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef();
  const gridContainerRef = useRef();

  // Calculate the exact grid container size
  const gridContainerSize = gridSize * cellSize + (gridSize - 1) * gapSize;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/snake-questions/random?count=5"
        );
        setQuestions(res.data);

        // Set the sequence of correct answers (to check against)
        const correctAnswers = res.data.map(
          (q) => q.answers.find((a) => a.correct)?.answer
        );
        setSequence(correctAnswers);

        // Get all answers (correct and incorrect) for the grid
        const allAnswers = res.data.flatMap((q) =>
          q.answers.map((a) => a.answer)
        );
        const positions = allAnswers.map((ans) => ({
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
    if (gameOver || gameWon) return;

    intervalRef.current = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };
        const newHead = {
          x: head.x + dir.x,
          y: head.y + dir.y,
        };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= gridSize ||
          newHead.y < 0 ||
          newHead.y >= gridSize
        ) {
          setGameOver(true);
          clearInterval(intervalRef.current);
          return prev;
        }

        // Self collision
        if (
          prev.some(
            (segment, index) =>
              index > 0 && segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          setGameOver(true);
          clearInterval(intervalRef.current);
          return prev;
        }

        const found = answerPositions.find(
          (p) => p.x === newHead.x && p.y === newHead.y
        );
        if (found) {
          if (found.text === sequence[currentIndex]) {
            setCurrentIndex(currentIndex + 1);
            setScore((prev) => prev + 100);
            setSpeed((prev) => Math.max(prev - 20, 100)); // Increase speed
            setAnswerPositions(
              answerPositions.filter(
                (p) => !(p.x === found.x && p.y === found.y)
              )
            );
            if (currentIndex + 1 === sequence.length) {
              setGameWon(true);
              clearInterval(intervalRef.current);
            }
            return [newHead, ...prev];
          } else {
            setGameOver(true);
            clearInterval(intervalRef.current);
            return prev;
          }
        }

        return [newHead, ...prev.slice(0, -1)];
      });
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [dir, answerPositions, currentIndex, gameOver, gameWon, speed]);

  useEffect(() => {
    const handleKey = (e) => {
      if (directions[e.key]) {
        e.preventDefault();
        // Prevent 180-degree turns
        if (
          !(dir.x === 1 && e.key === "ArrowLeft") &&
          !(dir.x === -1 && e.key === "ArrowRight") &&
          !(dir.y === 1 && e.key === "ArrowUp") &&
          !(dir.y === -1 && e.key === "ArrowDown")
        ) {
          setDir(directions[e.key]);
          setCurrentDirection(e.key);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dir]);

  const resetGame = () => {
    setSnake(initialSnake);
    setDir(directions.ArrowRight);
    setCurrentDirection("ArrowRight");
    setCurrentIndex(0);
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    setSpeed(300);
    // Re-fetch questions for a new game
    axios
      .get("http://localhost:8080/api/snake-questions/random?count=5")
      .then((res) => {
        setQuestions(res.data);
        const correctAnswers = res.data.map(
          (q) => q.answers.find((a) => a.correct)?.answer
        );
        setSequence(correctAnswers);
        const allAnswers = res.data.flatMap((q) =>
          q.answers.map((a) => a.answer)
        );
        const positions = allAnswers.map((ans) => ({
          text: ans,
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        }));
        setAnswerPositions(positions);
      })
      .catch((err) => console.error(err));
  };

  const getSnakeSymbol = (segment, index, snakeArray) => {
    if (index === 0) {
      const directionToImage = {
        ArrowUp: SnakeUp,
        ArrowDown: SnakeDown,
        ArrowLeft: SnakeLeft,
        ArrowRight: SnakeRight,
      };
      return (
        <img
          src={directionToImage[currentDirection]}
          alt="snake-head"
          className="w-8 h-8 transition-transform duration-100"
        />
      );
    } else {
      return (
        <div className="w-6 h-6 bg-green-500 rounded-sm transition-all duration-100" />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {gameWon && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
        />
      )}

      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left side - Game info */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                Snake Quiz
              </h2>

              <div className="flex justify-between items-center mb-6">
                <div className="bg-green-100 px-4 py-2 rounded-lg">
                  <p className="text-sm text-green-600">Progress</p>
                  <p className="text-2xl font-bold text-green-800">
                    {currentIndex}/{sequence.length}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  Questions:
                </h3>
                <ol className="space-y-3">
                  {questions.map((q, i) => (
                    <li
                      key={i}
                      className={`p-3 rounded-lg transition-all ${
                        i < currentIndex
                          ? "bg-green-50 text-green-700 line-through"
                          : i === currentIndex
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">
                        {i + 1}. {q.text}
                      </span>
                      {i === currentIndex && (
                        <span className="block mt-1 text-sm text-blue-600">
                          Find: <span className="font-bold">{sequence[i]}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-yellow-800 mb-1">
                  How to play:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use arrow keys to move the snake</li>
                  <li>• Eat answers in the correct order</li>
                  <li>• Correct answer grows the snake</li>
                  <li>• Wrong answer ends the game</li>
                </ul>
              </div>

              {(gameOver || gameWon) && (
                <button
                  onClick={resetGame}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                >
                  {gameWon ? "Play Again" : "Try Again"}
                </button>
              )}
            </div>
          </div>

          {/* Right side - Game board */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {(gameOver || gameWon) && (
                <div
                  className={`absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50 rounded-2xl ${
                    gameOver ? "animate-fade-in" : ""
                  }`}
                >
                  <div className="bg-white p-8 rounded-xl max-w-md text-center">
                    <h3
                      className={`text-3xl font-bold mb-4 ${
                        gameWon ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {gameWon ? "You Won! 🎉" : "Game Over! 😢"}
                    </h3>
                    <p className="text-lg mb-6">
                      {gameWon
                        ? `You answered all ${sequence.length} questions correctly!`
                        : `You made it to question ${currentIndex + 1} of ${
                            sequence.length
                          }`}
                    </p>
                    <button
                      onClick={resetGame}
                      className={`px-6 py-3 rounded-lg font-bold text-white ${
                        gameWon
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      } transition-colors`}
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}

              <div
                ref={gridContainerRef}
                className="mx-auto bg-gray-100 rounded-xl shadow-inner overflow-hidden"
                style={{
                  width: `${gridContainerSize + 8}px`,
                  height: `${gridContainerSize + 8}px`,
                  padding: "4px",
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
                    gap: `${gapSize}px`,
                    width: `${gridContainerSize}px`,
                    height: `${gridContainerSize}px`,
                  }}
                >
                  {[...Array(gridSize)].map((_, y) =>
                    [...Array(gridSize)].map((_, x) => {
                      const snakeSegment = snake.findIndex(
                        (s) => s.x === x && s.y === y
                      );
                      const isSnake = snakeSegment !== -1;
                      const answer = answerPositions.find(
                        (p) => p.x === x && p.y === y
                      );

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`flex items-center justify-center rounded-md transition-all duration-100 ${
                            isSnake
                              ? "bg-green-100 shadow-inner"
                              : answer
                              ? "bg-indigo-100 text-indigo-700 font-bold animate-pulse"
                              : "bg-gray-50"
                          }`}
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                          }}
                        >
                          {isSnake ? (
                            getSnakeSymbol({ x, y }, snakeSegment, snake)
                          ) : answer ? (
                            <span className="text-sm">{answer.text}</span>
                          ) : (
                            ""
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
