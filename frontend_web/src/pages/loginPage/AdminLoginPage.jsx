import { useState } from "react";
import mascot from "../../assets/mascot.png";
import MicrosoftLoginButton from "../../components/MicrosoftLoginButton";

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.role !== "ADMIN") {
          setErrorMessage("Only admins can log in here.");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userId", data.userId);

        window.location.href = "/admin-dashboard";
      } else {
        setErrorMessage(data.message || "Incorrect email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="w-full md:w-1/2 bg-blue-box p-10 flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Admin Panel Login
          </h2>
          <img src={mascot} alt="Readle Mascot" className="w-80 h-auto" />
        </div>

        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-2xl text-center font-bold text-gray-800 mb-6">
            Welcome Back, Admin!
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300"
              required
            />

            <div className="mb-6 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Log In
            </button>

            {errorMessage && (
              <div className="mt-4 text-center text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            - OR -
          </div>
          
          <MicrosoftLoginButton />
          
          <div className="mt-6 text-center text-sm text-gray-700">
            <a href="/" className="text-blue-500 font-medium hover:underline">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
