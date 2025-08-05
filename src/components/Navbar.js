import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdHome, MdDescription, MdAttachMoney, MdChevronLeft, MdChevronRight, MdFormatListBulleted, MdLogout, MdAccountCircle, MdFolderOpen, MdBolt } from 'react-icons/md'; // <-- MODIFICATO
import { FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };

  async function handleLogout() {
    setError('');

    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      setError('Errore durante il logout');
    }
  }

  return (
    <div
      className={`bg-white h-screen shadow-md transition-all duration-300 flex flex-col justify-between ${
        isExpanded ? 'w-52' : 'w-16'
      }`}
    >
      {/* Top section with logo and toggle */}
      <div>
        <div className={`p-4 flex flex-col ${isExpanded ? '' : 'items-center'}`}>
          <div className={`flex ${isExpanded ? 'justify-between' : 'justify-center'} w-full`}>
            {isExpanded ? (
              <div className="flex flex-col items-center w-full">
                <img
                  src="/logo.png"
                  alt="Realine Studio Logo"
                  className="h-20 mb-3"
                />
                <h1 className="text-xl font-bold text-gray-800">Realine Studio</h1>
                <p className="text-xs text-gray-500">Gestione Pratiche</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">R</div>
              </div>
            )}
            <button
              onClick={toggleNavbar}
              className={`p-1 rounded-full hover:bg-gray-100 text-gray-600 ${isExpanded ? '' : 'mt-4'}`}
            >
              {isExpanded ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="mt-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdHome className="h-5 w-5" />
            </span>
            {isExpanded && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/accessi-atti"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdFolderOpen className="h-5 w-5" />
            </span>
            {isExpanded && <span>Accessi Atti</span>}
          </NavLink>

          <NavLink
            to="/ape"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdBolt className="h-5 w-5" /> {/* <-- MODIFICATO */}
            </span>
            {isExpanded && <span>APE</span>}
          </NavLink>

          <NavLink
            to="/pratiche"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdDescription className="h-5 w-5" />
            </span>
            {isExpanded && <span>Pratiche</span>}
          </NavLink>

          <NavLink
            to="/finanze"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdAttachMoney className="h-5 w-5" />
            </span>
            {isExpanded && <span>Finanze</span>}
          </NavLink>

          <NavLink
            to="/prezziario"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <MdFormatListBulleted className="h-5 w-5" />
            </span>
            {isExpanded && <span>Prezziario</span>}
          </NavLink>

          <NavLink
            to="/calendario"
            className={({ isActive }) =>
              `flex items-center py-3 ${isExpanded ? 'px-6' : 'px-0 justify-center'} ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className={isExpanded ? 'mr-3' : ''}>
              <FaCalendarAlt className="h-5 w-5" />
            </span>
            {isExpanded && <span>Calendario</span>}
          </NavLink>
        </nav>
      </div>

      {/* User info and logout section */}
      {currentUser && (
        <div className={`mb-6 ${isExpanded ? 'px-4' : 'px-0 text-center'}`}>
          {isExpanded ? (
            <div className="p-3 bg-gray-100 rounded-md">
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              <div className="flex items-center mb-2">
                <MdAccountCircle className="h-6 w-6 text-gray-600 mr-2" />
                <span className="text-sm text-gray-700 truncate">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <MdLogout className="h-4 w-4 mr-1" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <MdAccountCircle className="h-8 w-8 text-gray-600 mb-2" />
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Logout"
              >
                <MdLogout className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Navbar;