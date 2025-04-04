import { useState } from "react";
import mascot from "../../assets/mascot.png";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const role = localStorage.getItem("userRole");

    if (!role) {
      alert("Please select a role before signing up.");
      return;
    }

    const generatedUsername = formData.email.split("@")[0] + "_" + Date.now();

    const payload = {
      ...formData,
      username: generatedUsername,
      role: role.toUpperCase(), // Expecting "STUDENT" or "TEACHER"
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registration successful! Token:", data.token);
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard"; // Change as needed
      } else {
        console.error("Registration failed:", data);
        alert(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-5xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Create an Account
          </h2>

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

            <div className="mb-8">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Sign Up
            </button>

            <p className="text-sm text-gray-600 mt-6 text-center">
              By Signing up, you agree to our{" "}
              <a href="/terms" className="text-blue-500 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-500 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>

        {/* Right side - Branding */}
        <div className="w-full md:w-1/2 bg-blue-500 p-8 flex flex-col justify-center items-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Join Readle Today
          </h2>
          <div className="flex justify-center items-center">
            <img src={mascot} alt="Readle Mascot" className="w-64 h-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
