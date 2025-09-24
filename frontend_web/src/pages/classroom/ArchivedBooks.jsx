import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import ClassroomSidebar from "../../components/ClassroomSidebar";
import { Menu, ArrowLeft, RotateCcw } from "lucide-react";
import axios from "axios";

const ArchivedBooks = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Authentication required.'); setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [cls, res] = await Promise.all([
          axios.get(`/api/classrooms/${classroomId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          // Updated endpoint
          axios.get(`/api/books/classroom/${classroomId}/archived`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        setClassroomName(cls.data.name || 'Classroom');
        setBooks(res.data || []);
        setError(null);
      } catch (e) {
        setError('Failed to load archived books.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [classroomId]);

  const unarchive = async (bookId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/books/${bookId}/unarchive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh the archived books list
      const res = await axios.get(`/api/books/classroom/${classroomId}/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data || []);
    } catch (e) {
      setError('Failed to unarchive book');
    }
  };

  const fullImg = (path) => path ? `http://localhost:3000${path}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <TeahcerNav />
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`pt-[72px] transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button onClick={toggleSidebar} className="mr-4 p-2 rounded-md hover:bg-gray-200">
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{classroomName} - Archived Books</h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {books.map(book => (
                <div key={book.bookID} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 bg-gray-200">
                    {book.imageURL ? (
                      <img src={fullImg(book.imageURL)} alt={book.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold">{book.title}</div>
                    <div className="text-sm text-gray-500">{book.author}</div>
                  </div>
                  <div className="p-3 border-t flex justify-end">
                    <button onClick={() => unarchive(book.bookID)} className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      <RotateCcw size={16} /> Unarchive
                    </button>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <div className="col-span-full text-center text-gray-500">No archived books.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedBooks;


