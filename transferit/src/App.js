import './App.css';
import React from 'react';
import {BrowserRouter as Router, Route, Routes, Link, useLocation} from 'react-router-dom';
import Send from './pages/Send';
import Recieve from './pages/Recieve';
import './index.css';

const Header = () => {
  const location = useLocation();
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
          TransferIT
        </Link>
        
        <div className="flex space-x-1">
          <Link
            to="/send"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/send'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Send
          </Link>
          
          <Link
            to="/recieve"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/recieve'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Receive
          </Link>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
              <div className="text-center max-w-lg">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  TransferIT
                </h1>
                
                <p className="text-lg text-gray-600 mb-12">
                  Simple file sharing
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/send"
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </Link>
                  
                  <Link
                    to="/recieve"
                    className="px-8 py-4 bg-white text-gray-900 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Receive
                  </Link>
                </div>
              </div>
            </div>
          }
        />
        
        <Route
          path="/send"
          element={
            <div>
              <Header />
              <Send />
            </div>
          }
        />
        
        <Route
          path="/recieve"
          element={
            <div>
              <Header />
              <Recieve />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;