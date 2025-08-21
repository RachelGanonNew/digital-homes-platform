import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('HomePage Component', () => {
  test('renders hero section with main heading', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Smart Real Estate')).toBeInTheDocument();
    expect(screen.getByText('Investing for Everyone')).toBeInTheDocument();
  });

  test('renders call-to-action buttons', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Explore Properties')).toBeInTheDocument();
    expect(screen.getByText('View Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Get Started Today')).toBeInTheDocument();
  });

  test('renders statistics section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('Total Properties')).toBeInTheDocument();
    expect(screen.getByText('2,847')).toBeInTheDocument();
    expect(screen.getByText('Active Investors')).toBeInTheDocument();
  });

  test('renders features section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('AI-Powered Valuation')).toBeInTheDocument();
    expect(screen.getByText('Fractional Ownership')).toBeInTheDocument();
    expect(screen.getByText('Automatic Returns')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Security')).toBeInTheDocument();
  });

  test('renders how it works section', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Browse Properties')).toBeInTheDocument();
    expect(screen.getByText('Buy Shares')).toBeInTheDocument();
    expect(screen.getByText('Earn Returns')).toBeInTheDocument();
  });
});
