import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage/LandingPage";
import RegisterPage from "./pages/registerPage/RegisterPage";
import LoginPage from "./pages/loginPage/LoginPage";
import ClassroomManagement from "./pages/classroom/ClassroomManagement";
import StudentLibraryPage from "./pages/studentPage/StudentLibraryPage";
import ClassroomContent from "./pages/classroom/ClassroomContentManager";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/classroom" element={<ClassroomManagement />} />
        <Route path="/library" element={<StudentLibraryPage />} />
        <Route
          path="/classroom-content/:classroomId"
          element={<ClassroomContent />}
        />
      </Routes>
    </Router>
  );
}

export default App;
