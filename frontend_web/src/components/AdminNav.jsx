import React from "react";
import { Link } from "react-router-dom";

const AdminNav = () => {
  return (
    <nav className="w-full fixed top-0 left-0 bg-blue-600 text-white shadow z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold">Readle Admin</h1>
        <div className="space-x-4">
          <Link to="/admin-dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/admin-books" className="hover:underline">
            Books
          </Link>
          <Link to="/admin-badges" className="hover:underline">
            Badges
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;
