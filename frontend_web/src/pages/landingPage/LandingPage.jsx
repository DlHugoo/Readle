import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "../../assets/hero-desktop.webp";
import books from "../../assets/books.png";
import girl1 from "../../assets/girl1.webp";
import boy1 from "../../assets/boy1.webp";
import girl2 from "../../assets/girl2.webp";
import Navbar from "../../components/Navbar";

function LandingPage() {
  const navigate = useNavigate();

    useEffect(() => {
    // Clear any remaining session storage on page load
    sessionStorage.clear();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navbar />
      {/* Hero Section */}
      <div className="relative bg-blue-500 overflow-hidden">
        <div
          className="w-full relative h-96 md:h-[500px] lg:h-[600px]"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container mx-auto pt-12 pb-24 px-6 h-full flex items-center">
            <div className="md:w-1/2 text-white pl-44">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Thousands of books.
                <br />
                Unlimited potential.
              </h1>
              <p className="text-xl mb-8">
                Inspire a lifetime of reading and discovery
                <br />
                with our award-winning digital library.
              </p>
              <div className="space-y-4">
                <button className="bg-white text-pink-500 px-8 py-3 rounded-full font-bold">
                  Families. Start Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Library Section */}
      <div className="container mx-auto py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-700 mb-12">
          A Comprehensive Digital Library at Your Fingertips.
        </h2>
        <img
          src={books}
          alt="Collection of children's books"
          className="w-full max-w-4xl mx-auto"
        />
      </div>

      {/* Value Proposition Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-700 mb-16">
            We help kids be their best selves.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {/* Value Prop 1 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 relative">
                <div className="bg-pink-500 rounded-full w-48 h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={girl1}
                    alt="Child excited about reading"
                    className="w-full"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">
                Fall in love
                <br />
                with reading.
              </h3>
              <p className="text-gray-600 text-center">
                From reluctant readers to total <br /> bookworms, any kid can
                get
                <br />
                excited about books.
              </p>
            </div>

            {/* Value Prop 2 */}
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <div className="bg-green-700 rounded-full w-48 h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={boy1}
                    alt="Child exploring through reading"
                    className="w-full"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">
                Grow through
                <br />
                exploration.
              </h3>
              <p className="text-gray-600 text-center">
                They can read about the topics
                <br /> they love and discover new ones,
                <br />
                all while learning about the world
                <br />
                and themselves.
              </p>
            </div>

            {/* Value Prop 3 */}
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <div className="bg-purple-700 rounded-full w-48 h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={girl2}
                    alt="Children succeeding in classroom"
                    className="w-full"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">
                Succeed in
                <br />
                the classroom
                <br />& beyond.
              </h3>
              <p className="text-gray-600 text-center">
                Our ever-expanding library and
                <br /> enrichment tools boost reading
                <br />
                and critical thinking skills.
              </p>
            </div>
          </div>

          {/* <div className="mt-16">
            <button className="bg-btn-blue text-white px-8 py-3 rounded-full font-medium hover:bg-btn-blue-hover transition">
              GET STARTED
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
