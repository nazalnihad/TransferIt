import './App.css';
import React from 'react';
import {BrowserRouter as Router, Route, Routes,Link} from 'react-router-dom';
import Send from './pages/Send';
import Recieve from './pages/Recieve';
import './index.css';


function App() {
  return (
    <Router>
      <div className='p-4 text-center'>
        <h1 className='m-3 t-5 text-4xl'>TransferIT</h1>
      </div>
      <div className="space-x-4 m-5 p-2 text-center">
        <Link to="/send" className="bg-blue-500 text-white px-4 py-2 rounded">Send</Link>
        <Link to="/recieve" className="bg-blue-500 text-white px-4 py-2 rounded">Recieve</Link>
      </div>
      <Routes>
        <Route path="/send" element={<Send />} />
        <Route path="/recieve" element={<Recieve />} />
      </Routes>
    </Router>
  );
}

export default App;
