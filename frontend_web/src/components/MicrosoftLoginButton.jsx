import React from 'react';

const MicrosoftLoginButton = () => {
  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <button
      onClick={handleMicrosoftLogin}
      className="w-full bg-[#2F2F2F] hover:bg-[#1E1E1E] text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
        <path fill="#f3f3f3" d="M0 0h10.931v10.931H0z"/>
        <path fill="#f35325" d="M11.954 0h10.931v10.931H11.954z"/>
        <path fill="#81bc06" d="M0 11.954h10.931v10.931H0z"/>
        <path fill="#05a6f0" d="M11.954 11.954h10.931v10.931H11.954z"/>
      </svg>
      Sign in with Microsoft
    </button>
  );
};

export default MicrosoftLoginButton;