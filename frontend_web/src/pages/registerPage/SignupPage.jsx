import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mascot from "../../assets/mascot.png";
import { register as apiRegister } from "../../api/api";

// === NEW: backend base (env with fallback) ===
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ✅ Reusable Error Modal
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm">
      <h2 className="text-xl font-semibold text-red-600 mb-2">⚠️ Signup Error</h2>
      <p className="text-gray-700 text-sm">{message}</p>
      <button
        onClick={onClose}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded"
      >
        Close
      </button>
    </div>
  </div>
);

const SignupPage = () => {
  const nav = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const showErrorModal = (message) => {
    setErrorMessage(message || "Something went wrong");
    setShowError(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // role chosen on previous screen and stored
    const role = localStorage.getItem("userRole");
    if (!role) {
      showErrorModal("Please select a role before signing up.");
      return;
    }

    // unique username based on email + timestamp
    const localPart = formData.email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "");
    const generatedUsername = `${localPart}-${Date.now().toString(36).slice(-6)}`;

    const payload = {
      ...formData,
      username: generatedUsername,
      role: role.toUpperCase(), // must match your Role enum
    };

    try {
      setLoading(true);
      await apiRegister(payload); // returns { message: "Check your email..." }

      // Save email so Verify page knows who to verify
      localStorage.setItem("pendingEmail", formData.email);

      // Go to /verify (the verify page will POST /api/auth/verify-email)
      nav(`/verify?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      const msg = (err && err.message) || "";
      if (/exist/i.test(msg) || /duplicate/i.test(msg) || /conflict/i.test(msg)) {
        showErrorModal("User already exists. Try logging in or use a different email.");
      } else {
        showErrorModal(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // === NEW: Microsoft signup
  const handleMicrosoftSignup = () => {
    // Optional: if you want to require role before OAuth, uncomment:
    // const role = localStorage.getItem("userRole");
    // if (!role) return showErrorModal("Please select a role before continuing.");
    window.location.href = `${API_BASE}/auth/microsoft/start`;
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-5xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Create an Account</h2>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-4 mb-6">
              <div className="w-1/2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div className="w-1/2">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
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
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300 ${
                loading
                  ? "bg-yellow-300 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-500"
              }`}
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>

            {/* === NEW: Divider + Microsoft button === */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-500 uppercase tracking-wide">
                or
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleMicrosoftSignup}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3"
            >
              {/* Inline Microsoft “four squares” so you don’t need an asset */}
              <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
                <rect width="10" height="10" x="1" y="1" />
                <rect width="10" height="10" x="12" y="1" />
                <rect width="10" height="10" x="1" y="12" />
                <rect width="10" height="10" x="12" y="12" />
              </svg>
              Continue with Microsoft
            </button>

            <p className="text-sm text-gray-600 mt-6 text-center">
              By signing up, you agree to our{" "}
              <a href="/terms" className="text-blue-500 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-500 hover:underline">
                Privacy Policy
              </a>.
            </p>
          </form>
        </div>

        {/* Right side - Branding */}
        <div className="w-full md:w-1/2 bg-blue-500 p-8 flex flex-col justify-center items-center">
          <h2 className="text-4xl font-bold text-white mb-8">Join Readle Today</h2>
          <div className="flex justify-center items-center">
            <img src={mascot} alt="Readle Mascot" className="w-96 h-auto" />
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showError && (
        <ErrorModal message={errorMessage} onClose={() => setShowError(false)} />
      )}
    </div>
  );
};

export default SignupPage;
