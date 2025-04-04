import logo from "../assets/logo-final.png";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-white py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Readle Logo" className="h-12 px-[25px]" />
        </div>
        <div className="flex items-center space-x-8">
          <a href="#features" className="text-gray-700 font-medium">
            FEATURES
          </a>
          <a href="#about" className="text-gray-700 font-medium">
            ABOUT US
          </a>
          <a href="#login" className="text-gray-700 font-medium">
            LOG IN
          </a>
          <button
            onClick={() => navigate("/register")}
            className="bg-btn-blue text-white font-medium px-4 py-2 rounded-full hover:bg-btn-blue-hover transition"
          >
            GET STARTED
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
