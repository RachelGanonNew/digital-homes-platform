import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock lazy imports to avoid Suspense issues in tests
jest.mock('./pages/HomePage', () => {
  return function HomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/PropertiesPage', () => {
  return function PropertiesPage() {
    return <div data-testid="properties-page">Properties Page</div>;
  };
});

jest.mock('./pages/PropertyDetailPage', () => {
  return function PropertyDetailPage() {
    return <div data-testid="property-detail-page">Property Detail Page</div>;
  };
});

jest.mock('./pages/DashboardPage', () => {
  return function DashboardPage() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  };
});

jest.mock('./pages/MarketplacePage', () => {
  return function MarketplacePage() {
    return <div data-testid="marketplace-page">Marketplace Page</div>;
  };
});

// Mock react-hot-toast to avoid console warnings
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

const renderApp = () => render(<App />);

describe('App Component', () => {
  test('renders navbar and routes without crashing', () => {
    renderApp();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Digital Homes')).toBeInTheDocument();
  });

  test('renders home page by default', () => {
    renderApp();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders properties page when navigating to /properties', () => {
    window.history.pushState({}, 'Properties', '/properties');
    renderApp();
    expect(screen.getByTestId('properties-page')).toBeInTheDocument();
  });

  test('renders marketplace page when navigating to /marketplace', () => {
    window.history.pushState({}, 'Marketplace', '/marketplace');
    renderApp();
    expect(screen.getByTestId('marketplace-page')).toBeInTheDocument();
  });

  test('renders dashboard page when navigating to /dashboard', () => {
    window.history.pushState({}, 'Dashboard', '/dashboard');
    renderApp();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});

