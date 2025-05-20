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
import StudentClassroomPage from "./pages/studentPage/StudentClassroomPage"; // Keep this import
import ClassroomContentPage from "./pages/classroom/ClassroomContentPage";
import StorySequencingPage from "./pages/activityPage/storySequencingPage/StorySequencingPage";
import CreateSSA from "./pages/activityPage/storySequencingPage/CreateSSA";
import TeacherCreateSSA from "./pages/activityPage/storySequencingPage/TeacherCreateSSA";
import StudentProgressDashboard from "./pages/studentPage/StudentProgressDashboard";
import StudentBadgeDashboard from "./pages/studentPage/StudentBadgeDashboard";
import ClassroomProgress from "./pages/classroom/ClassroomProgress";
import BookCompletionPage from "./pages/studentPage/BookCompletionPage";
import AdminLoginPage from "./pages/loginPage/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";


function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/classroom" element={<ClassroomManagement />} />
        <Route path="/student-classrooms" element={<StudentClassroomPage />} />
        <Route path="/library" element={<StudentLibraryPage />} />
        <Route path="/dashboard" element={<StudentProgressDashboard />} />

        {/* ⬇️ Differentiated content routes for teacher vs student */}
        <Route
          path="/classroom-content/:classroomId"
          element={<ClassroomContent />}
        />
        <Route
          path="/student/classroom-content/:classroomId"
          element={<ClassroomContentPage />}
        />

        <Route path="/book-editor/:bookId" element={<BookPageEditor />} />
        <Route
          path="/classroom-students/:classroomId"
          element={<ClassroomStudents />}
        />
        <Route
          path="/classroom-progress/:classroomId"
          element={<ClassroomProgress />}
        />
        <Route path="/snake-questions" element={<SnakeQuestionForm />} />
        <Route path="/book/:bookId/snake-game" element={<SnakeGame />} />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route path="/book/:bookId/complete" element={<BookCompletionPage />} />

        <Route
          path="/book/:bookId/sequencing"
          element={<StorySequencingPage />}
        />
        <Route path="/create-ssa" element={<CreateSSA />} />
        <Route path="/teacher-create-ssa" element={<TeacherCreateSSA />} />
        <Route path="/book/:bookId/snake-game" element={<SnakeGame />} />
        <Route path="/student/badges" element={<StudentBadgeDashboard />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
