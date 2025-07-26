import * as React from 'react';
import { useState } from 'react';
import { DeviceManagement } from './DeviceManagement';
import { GeofenceManagement } from './GeofenceManagement';
import { DeviceAssignment } from './DeviceAssignment';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

type TabType = 'devices' | 'geofences' | 'assignments';

export const IoTDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const { user, signIn, signOut, signUp } = useSimpleAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        await signUp(authForm.email, authForm.password, authForm.name);
      } else {
        await signIn(authForm.email, authForm.password);
      }
      setShowAuthForm(false);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const renderAuthForm = () => (
    <div className="auth-form">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleAuth}>
        {isSignUp && (
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={authForm.name}
              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <p>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="btn-link"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );

  const renderTabs = () => (
    <div className="dashboard-tabs">
      <button
        className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
        onClick={() => setActiveTab('devices')}
      >
        📱 Devices
      </button>
      <button
        className={`tab ${activeTab === 'geofences' ? 'active' : ''}`}
        onClick={() => setActiveTab('geofences')}
      >
        🗺️ Geofences
      </button>
      <button
        className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
        onClick={() => setActiveTab('assignments')}
      >
        🔗 Assignments
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'devices':
        return <DeviceManagement />;
      case 'geofences':
        return <GeofenceManagement />;
      case 'assignments':
        return <DeviceAssignment />;
      default:
        return <DeviceManagement />;
    }
  };

  if (!user) {
    return (
      <div className="iot-dashboard">
        <div className="header">
          <h1>🚀 AWS IoT Core Realtime Dashboard</h1>
          <p>Manage your IoT devices and geofences with real-time monitoring</p>
        </div>
        
        <div className="auth-section">
          {showAuthForm ? (
            renderAuthForm()
          ) : (
            <div className="welcome-section">
              <h2>Welcome to IoT Dashboard</h2>
              <p>Sign in to start managing your IoT devices and geofences</p>
              <button
                onClick={() => setShowAuthForm(true)}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="iot-dashboard">
      <div className="header">
        <div className="header-content">
          <h1>🚀 AWS IoT Core Realtime Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.name || user.email}!</span>
            <button onClick={signOut} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {renderTabs()}
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>

      <div className="features-overview">
        <h3>🎯 Core Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>📱 Device Management</h4>
            <p>Create and manage your IoT devices and trackers</p>
          </div>
          <div className="feature-card">
            <h4>🗺️ Geofence Creation</h4>
            <p>Define virtual boundaries for location-based monitoring</p>
          </div>
          <div className="feature-card">
            <h4>🔗 Device Assignment</h4>
            <p>Assign devices to geofences for automated monitoring</p>
          </div>
          <div className="feature-card">
            <h4>📧 Email Notifications</h4>
            <p>Receive alerts when devices exit their assigned geofences</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 