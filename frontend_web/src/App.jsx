import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import RegisterPage from "./pages/registerPage/RegisterPage";
import LoginPage from "./pages/loginPage/LoginPage";
import ClassroomManagement from "./pages/classroom/ClassroomManagement";
import StudentLibraryPage from "./pages/studentPage/StudentLibraryPage";
import ClassroomContent from "./pages/classroom/ClassroomContentManager";
import ClassroomStudents from "./pages/classroom/ClassroomStudents";
import BookPageEditor from "./pages/bookTeacherPage/BookPageEditor";
import BookPage from "./pages/studentPage/BookPage";
import SnakeGame from "./pages/snakegame/SnakeGame";
import SnakeQuestionForm from "./pages/snakegame/SnakeQuestionForm";
import StudentClassroomPage from "./pages/studentPage/StudentClassroomPage"; // Add this import
import ClassroomContentPage from "./pages/classroom/ClassroomContentPage";
import StorySequencingPage from "./pages/activityPage/storySequencingPage/StorySequencingPage";
import CreateSSA from "./pages/activityPage/storySequencingPage/CreateSSA";

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/classroom" element={<ClassroomManagement />} />
        <Route
          path="/student-classrooms"
          element={<StudentClassroomPage />}
        />{" "}
        {/* New route for student classroom page */}
        <Route path="/library" element={<StudentLibraryPage />} />
        <Route
          path="/classroom-content/:classroomId"
          element={<ClassroomContent />}
        />
        <Route path="/book-editor/:bookId" element={<BookPageEditor />} />
        <Route
          path="/classroom-students/:classroomId"
          element={<ClassroomStudents />}
        />
        {/* 🐍 Snake game routes */}
        <Route path="/snake-questions" element={<SnakeQuestionForm />} />
        <Route path="/snake-game" element={<SnakeGame />} />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route
          path="/classroom-content/:id"
          element={<ClassroomContentPage />}
        />
        <Route
          path="/book/:bookId/sequencing"
          element={<StorySequencingPage />}
        />
        <Route path="/create-ssa" element={<CreateSSA />} />
      </Routes>
    </Router>
  );
}

export default App;
