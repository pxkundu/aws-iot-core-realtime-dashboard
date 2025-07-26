import React from 'react';
import { IoTDashboard } from './components/IoTDashboard';
import './AppSimple.css';

const AppSimple: React.FC = () => {
  return (
    <div className="app">
      <IoTDashboard />
    </div>
  );
};

export default AppSimple; 