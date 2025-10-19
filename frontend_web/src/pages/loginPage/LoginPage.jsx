import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { login as apiLogin } from "../../api/api";
import mascot from "../../assets/mascot.png";

// Use environment variable for API base URL
// For production: empty string uses Vercel proxy (HTTPS to HTTPS)
// For local dev: set VITE_API_BASE_URL=http://localhost:3000
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { login: authLogin } = useAuth(); // from context

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in both email and password.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await apiLogin({
        email: formData.email,
        password: formData.password,
      });

      console.log("Login response:", data); // Debug log

      // data = { token, role, userId }
      if (!data || !data.token) {
        setErrorMessage("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      authLogin({
        token: data.token,
        role: data.role,
        userId: data.userId,
        email: formData.email,
      });

      console.log("Navigating to dashboard for role:", data.role); // Debug log

      // ✅ Use setTimeout to ensure state update completes before navigation
      setTimeout(() => {
        switch (data.role) {
          case "TEACHER":
            navigate("/classroom");
            break;
          case "ADMIN":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/library");
        }
      }, 0);
    } catch (err) {
      console.error("Login error:", err);

      // Extract error message from axios response
      let errorMsg = "An error occurred. Please try again.";

      if (err.response) {
        // Backend returned an error response
        const backendMsg =
          err.response.data?.message || err.response.data?.error || "";
        const status = err.response.status;

        // Check for email verification requirement
        if (/not\s*verified|verify\s*your\s*email/i.test(backendMsg)) {
          localStorage.setItem("pendingEmail", formData.email);
          navigate(`/verify?email=${encodeURIComponent(formData.email)}`);
          return;
        }

        // Handle specific status codes
        if (status === 401 || status === 403) {
          errorMsg =
            backendMsg || "Incorrect email or password. Please try again.";
        } else if (status === 404) {
          errorMsg = "User not found. Please check your email or register.";
        } else if (status === 500) {
          errorMsg = "Incorrect email or password. Please try again.";
        } else if (backendMsg) {
          errorMsg = backendMsg;
        } else {
          errorMsg = "Incorrect email or password. Please try again.";
        }
      } else if (err.request) {
        // Network error - no response received
        errorMsg =
          "Unable to connect to server. Please check your internet connection.";
      } else if (err.message) {
        // Other errors
        errorMsg = err.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Microsoft login
  const handleMicrosoftLogin = () => {
    const authUrl = API_BASE
      ? `${API_BASE}/auth/microsoft/start`
      : "/auth/microsoft/start";
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Left Side */}
        <div className="w-full md:w-1/2 bg-blue-box p-10 flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl md:text-3xl font-bold mb-6 text-center">
            Adventure starts with every page
          </h2>
          <img src={mascot} alt="Readle Mascot" className="w-96 h-auto" />
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-2xl text-center md:text-3xl font-bold text-gray-800 mb-6">
            Welcome Back,
            <br /> Reader!
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>

            {/* NEW: Divider + Microsoft button */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-500 uppercase tracking-wide">
                or
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3"
              disabled={isLoading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 23 23"
                aria-hidden="true"
              >
                <rect width="10" height="10" x="1" y="1" />
                <rect width="10" height="10" x="12" y="1" />
                <rect width="10" height="10" x="1" y="12" />
                <rect width="10" height="10" x="12" y="12" />
              </svg>
              Continue with Microsoft
            </button>

            {errorMessage && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-blue-500 hover:underline text-sm"
            >
              Forgot Password?
            </a>
          </div>

          <div className="mt-6 text-center text-sm text-gray-700">
            New to Readle?{" "}
            <a
              href="/register"
              className="text-blue-500 font-medium hover:underline"
            >
              Join now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
