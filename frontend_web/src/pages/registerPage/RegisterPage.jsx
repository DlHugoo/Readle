import { useState } from "react";
import logo from "../../assets/logo-final.png";
import student from "../../assets/student.png";
import teacher from "../../assets/teacher.png";
import SignupForm from "./SignupPage"; // Import the signup form component

const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    localStorage.setItem("userRole", role);
    console.log(`Selected role: ${role}`);
    // Show signup form after a short delay for better UX
    setTimeout(() => {
      setShowSignup(true);
    }, 300);
  };

  // If signup form should be shown, render that instead
  if (showSignup) {
    return <SignupForm />;
  }

  // Otherwise show the role selection screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Header with more space above */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to</h1>
        <div className="flex justify-center items-center">
          <img src={logo} alt="Readle Logo" className="h-12 mr-2" />
        </div>
      </div>

      {/* Cards with more generous spacing and larger cards */}
      <div className="flex flex-col md:flex-row gap-10 mb-20 w-full max-w-4xl justify-center px-4">
        <div
          className={`bg-white rounded-lg shadow-lg p-10 flex flex-col items-center transition-all duration-300 cursor-pointer
                      hover:shadow-xl hover:scale-105 w-full md:w-5/12 h-80
                      ${
                        selectedRole === "student" ? "ring-4 ring-blue-400" : ""
                      }`}
          onClick={() => handleRoleSelect("student")}
        >
          <div className="flex-grow flex items-center justify-center">
            <img src={student} alt="Student" className="w-44 h-44" />
          </div>
          <h2 className="text-3xl font-bold text-btn-blue mt-6">STUDENT</h2>
        </div>

        <div
          className={`bg-white rounded-lg shadow-lg p-10 flex flex-col items-center transition-all duration-300 cursor-pointer
                      hover:shadow-xl hover:scale-105 w-full md:w-5/12 h-80
                      ${
                        selectedRole === "teacher" ? "ring-4 ring-blue-400" : ""
                      }`}
          onClick={() => handleRoleSelect("teacher")}
        >
          <div className="flex-grow flex items-center justify-center">
            <img src={teacher} alt="Teacher" className="w-44 h-44" />
          </div>
          <h2 className="text-3xl font-bold text-btn-blue mt-6">TEACHER</h2>
        </div>
      </div>

      {/* Footer with more space below */}
      <div className="text-center mt-auto pb-8">
        <p className="text-gray-700 text-lg mb-2">Already have an account?</p>
        <a
          href="/login"
          className="text-btn-blue text-xl font-medium hover:underline"
        >
          Log in
        </a>
      </div>
    </div>
  );
};

export default RegisterPage;
