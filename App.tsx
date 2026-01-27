import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Cashier } from './pages/Cashier';
import { Admin } from './pages/Admin';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Cashier />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
};

export default App;