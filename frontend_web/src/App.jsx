import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import RegisterPage from "./pages/registerPage/RegisterPage";
import LoginPage from "./pages/loginPage/LoginPage";
import ClassroomManagement from "./pages/classroom/ClassroomManagement";
import StudentLibraryPage from "./pages/studentPage/StudentLibraryPage";
import ClassroomContent from "./pages/classroom/ClassroomContentManager";
import BookPage from "./pages/studentPage/BookPage";

// 🐍 Snake game & form
import SnakeGame from "./pages/snakegame/SnakeGame";
import SnakeQuestionForm from "./pages/snakegame/SnakeQuestionForm";

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/classroom" element={<ClassroomManagement />} />
        <Route path="/library" element={<StudentLibraryPage />} />
        <Route
          path="/classroom-content/:classroomId"
          element={<ClassroomContent />}
        />
        {/* 🐍 Snake game routes */}
        <Route path="/snake-questions" element={<SnakeQuestionForm />} />
        <Route path="/snake-game" element={<SnakeGame />} />
        <Route path="/book/:bookId" element={<BookPage />} />
      </Routes>
    </Router>
  );
}

export default App;
