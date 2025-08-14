import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userId = params.get('userId');
    
    if (token && role && userId) {
      // Get email from token if available (optional)
      const email = params.get('email') || '';
      
      // Login the user
      login({
        token,
        role,
        userId,
        email
      });

      // Redirect based on role
      switch (role) {
        case 'TEACHER':
          navigate('/classroom');
          break;
        case 'ADMIN':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/library');
      }
    } else {
      // Handle error
      navigate('/login?error=authentication_failed');
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">Completing login, please wait...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;