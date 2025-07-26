import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IoTDashboard } from '../IoTDashboard';
import { useSimpleAuth } from '../../hooks/useSimpleAuth';

// Mock the useSimpleAuth hook
jest.mock('../../hooks/useSimpleAuth');
const mockUseSimpleAuth = useSimpleAuth as jest.MockedFunction<typeof useSimpleAuth>;

// Mock child components
jest.mock('../DeviceManagement', () => ({
  DeviceManagement: () => <div data-testid="device-management">Device Management</div>
}));

jest.mock('../GeofenceManagement', () => ({
  GeofenceManagement: () => <div data-testid="geofence-management">Geofence Management</div>
}));

jest.mock('../DeviceAssignment', () => ({
  DeviceAssignment: () => <div data-testid="device-assignment">Device Assignment</div>
}));

describe('IoTDashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders welcome screen when user is not authenticated', () => {
    mockUseSimpleAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    expect(screen.getByText('🚀 AWS IoT Core Realtime Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to IoT Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders sign in form when Get Started is clicked', () => {
    mockUseSimpleAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    fireEvent.click(screen.getByText('Get Started'));
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
  });

  it('renders dashboard when user is authenticated', () => {
    mockUseSimpleAuth.mockReturnValue({
      user: {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
    expect(screen.getByText('📱 Devices')).toBeInTheDocument();
    expect(screen.getByText('🗺️ Geofences')).toBeInTheDocument();
    expect(screen.getByText('🔗 Assignments')).toBeInTheDocument();
  });

  it('switches between tabs when clicked', () => {
    mockUseSimpleAuth.mockReturnValue({
      user: {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    // Default tab should be devices
    expect(screen.getByTestId('device-management')).toBeInTheDocument();
    
    // Click on geofences tab
    fireEvent.click(screen.getByText('🗺️ Geofences'));
    expect(screen.getByTestId('geofence-management')).toBeInTheDocument();
    
    // Click on assignments tab
    fireEvent.click(screen.getByText('🔗 Assignments'));
    expect(screen.getByTestId('device-assignment')).toBeInTheDocument();
  });

  it('handles sign out', () => {
    const mockSignOut = jest.fn();
    mockUseSimpleAuth.mockReturnValue({
      user: {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      },
      loading: false,
      signIn: jest.fn(),
      signOut: mockSignOut,
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    fireEvent.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('handles sign in form submission', async () => {
    const mockSignIn = jest.fn();
    mockUseSimpleAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(<IoTDashboard />);
    
    fireEvent.click(screen.getByText('Get Started'));
    
    fireEvent.change(screen.getByLabelText('Email:'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password:'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles sign up form submission', async () => {
    const mockSignUp = jest.fn();
    mockUseSimpleAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: mockSignUp
    });

    render(<IoTDashboard />);
    
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Sign Up'));
    
    fireEvent.change(screen.getByLabelText('Name:'), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText('Email:'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password:'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByText('Sign Up'));
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });
  });
}); 