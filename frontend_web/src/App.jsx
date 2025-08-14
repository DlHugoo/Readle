import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import RegisterPage from "./pages/registerPage/RegisterPage";
import LoginPage from "./pages/loginPage/LoginPage";
import OAuth2RedirectHandler from "./pages/loginPage/OAuth2RedirectHandler";
import ClassroomManagement from "./pages/classroom/ClassroomManagement";
import StudentLibraryPage from "./pages/studentPage/StudentLibraryPage";
import ClassroomContent from "./pages/classroom/ClassroomContentManager";
import ClassroomStudents from "./pages/classroom/ClassroomStudents";
import BookPageEditor from "./pages/bookTeacherPage/BookPageEditor";
import BookPage from "./pages/studentPage/BookPage";
import SnakeGame from "./pages/snakegame/SnakeGame";
import SnakeQuestionForm from "./pages/snakegame/SnakeQuestionForm";
import StudentClassroomPage from "./pages/studentPage/StudentClassroomPage";
import ClassroomContentPage from "./pages/classroom/ClassroomContentPage";
import StorySequencingPage from "./pages/activityPage/storySequencingPage/StorySequencingPage";
import TeacherCreateSSA from "./pages/activityPage/storySequencingPage/TeacherCreateSSA";
import StudentProgressDashboard from "./pages/studentPage/StudentProgressDashboard";
import StudentBadgeDashboard from "./pages/studentPage/StudentBadgeDashboard";
import ClassroomProgress from "./pages/classroom/ClassroomProgress";
import BookCompletionPage from "./pages/studentPage/BookCompletionPage";
import ClassroomVisualization from "./pages/classroom/ClassroomVisualization";
import AdminLoginPage from "./pages/loginPage/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PredictionCheckpointPage from "./pages/activityPage/predictionCheckpoint/PredictionCheckpointPage";
import CreatePredictionCheckpoint from "./pages/activityPage/predictionCheckpoint/CreatePredictionCheckpoint";
import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/unauthorized/UnauthorizedPage";

function App() {
  return (
    <Routes>
      {/* Common Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route path="/student-classrooms" element={<StudentClassroomPage />} />
        <Route path="/library" element={<StudentLibraryPage />} />
        <Route path="/dashboard" element={<StudentProgressDashboard />} />
        <Route
          path="/prediction/:bookId"
          element={<PredictionCheckpointPage />}
        />
        <Route
          path="/student/classroom-content/:classroomId"
          element={<ClassroomContentPage />}
        />
        <Route path="/book/:bookId" element={<BookPage />} />
        <Route path="/book/:bookId/complete" element={<BookCompletionPage />} />
        <Route path="/book/:bookId/snake-game" element={<SnakeGame />} />
        <Route
          path="/book/:bookId/sequencing"
          element={<StorySequencingPage />}
        />
        <Route path="/student/badges" element={<StudentBadgeDashboard />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={["TEACHER"]} />}>
        <Route path="/classroom" element={<ClassroomManagement />} />
        <Route
          path="/classroom-content/:classroomId"
          element={<ClassroomContent />}
        />
        <Route
          path="/classroom-students/:classroomId"
          element={<ClassroomStudents />}
        />
        <Route
          path="/classroom-progress/:classroomId"
          element={<ClassroomProgress />}
        />
        <Route
          path="/classroom-visualization/:classroomId"
          element={<ClassroomVisualization />}
        />
      </Route>

      {/* Routes accessible by both Teacher and Admin */}
      <Route element={<ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]} />}>
        <Route path="/book-editor/:bookId" element={<BookPageEditor />} />
        <Route path="/snake-questions" element={<SnakeQuestionForm />} />
        <Route path="/teacher-create-ssa" element={<TeacherCreateSSA />} />
        <Route
          path="/create-prediction"
          element={<CreatePredictionCheckpoint />}
        />
      </Route>
    </Routes>
  );
}

export default App;
