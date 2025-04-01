import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MdHome, MdDescription, MdAttachMoney, MdChevronLeft, MdChevronRight, MdFormatListBulleted } from 'react-icons/md';
import { FaCalendarAlt } from 'react-icons/fa'; // Nuovo import per l'icona calendario

function Navbar() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`bg-white h-screen shadow-md transition-all duration-300 ${
        isExpanded ? 'w-52' : 'w-16'
      }`}
    >
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

        {/* Nuovo link per la pagina del calendario */}
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
  );
}

export default Navbar;