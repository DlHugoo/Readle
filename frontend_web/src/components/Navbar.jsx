import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo-final.png";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavClick = (path) => {
    if (path.startsWith("/")) {
      navigate(path);
    }
    closeMenu();
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    closed: {
      opacity: 0,
      x: -20,
    },
    open: {
      opacity: 1,
      x: 0,
    },
  };

  return (
    <>
      <nav className="bg-white py-4 px-4 md:px-6 flex justify-between items-center shadow-sm sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src={logo}
            alt="Readle Logo"
            className="h-10 md:h-12 px-2 md:px-[25px] cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a
            href="#features"
            className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
          >
            FEATURES
          </a>
          <a
            href="#about"
            className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
          >
            ABOUT US
          </a>
          <a
            onClick={() => navigate("/login")}
            className="text-gray-700 font-medium cursor-pointer hover:text-blue-600 transition-colors"
          >
            LOG IN
          </a>
          <button
            onClick={() => navigate("/register")}
            className="bg-btn-blue text-white font-medium px-4 py-2 rounded-full hover:bg-btn-blue-hover transition"
          >
            GET STARTED
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <motion.div
            className="w-6 h-6 flex flex-col justify-center space-y-1.5"
            animate={isMenuOpen ? "open" : "closed"}
          >
            <motion.span
              className="block h-0.5 w-6 bg-gray-700 rounded"
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: 45, y: 6 },
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block h-0.5 w-6 bg-gray-700 rounded"
              variants={{
                closed: { opacity: 1 },
                open: { opacity: 0 },
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block h-0.5 w-6 bg-gray-700 rounded"
              variants={{
                closed: { rotate: 0, y: 0 },
                open: { rotate: -45, y: -6 },
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg overflow-hidden"
          >
            <motion.div
              className="flex flex-col py-4 px-6 space-y-4"
              variants={{
                open: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  },
                },
                closed: {
                  transition: {
                    staggerChildren: 0.05,
                    staggerDirection: -1,
                  },
                },
              }}
            >
              <motion.a
                href="#features"
                onClick={closeMenu}
                variants={itemVariants}
                className="text-gray-700 font-medium py-2 hover:text-blue-600 transition-colors"
              >
                FEATURES
              </motion.a>
              <motion.a
                href="#about"
                onClick={closeMenu}
                variants={itemVariants}
                className="text-gray-700 font-medium py-2 hover:text-blue-600 transition-colors"
              >
                ABOUT US
              </motion.a>
              <motion.a
                onClick={() => handleNavClick("/login")}
                variants={itemVariants}
                className="text-gray-700 font-medium py-2 hover:text-blue-600 transition-colors cursor-pointer"
              >
                LOG IN
              </motion.a>
              <motion.button
                onClick={() => handleNavClick("/register")}
                variants={itemVariants}
                className="bg-btn-blue text-white font-medium px-6 py-3 rounded-full hover:bg-btn-blue-hover transition text-left w-full"
              >
                GET STARTED
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
