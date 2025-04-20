import logo from "../assets/logo-face.png";
import { useNavigate } from "react-router-dom";

function TeahcerNav() {
  const navigate = useNavigate();

  return (
    <nav className="bg-blue-500 py-4 px-6 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Readle Logo" className="h-12 drop-shadow-lg" />
        <span className="text-white text-3xl font-bold drop-shadow-sm">Readle Teacher</span>
      </div>
    </nav>
  );
}

export default TeahcerNav;
