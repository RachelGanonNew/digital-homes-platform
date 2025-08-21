import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  test('renders navbar with brand name', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Digital Homes')).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders connect wallet button', () => {
    renderWithRouter(<Navbar />);
    // Initially only desktop button is in the DOM
    expect(screen.getAllByText('Connect Wallet')).toHaveLength(1);
  });

  test('highlights active navigation item', () => {
    renderWithRouter(<Navbar />, { initialEntries: ['/properties'] });
    const propertiesLink = screen.getAllByText('Properties')[0];
    expect(propertiesLink.closest('a')).toHaveClass('text-primary-600');
  });

  test('mobile menu toggles correctly', () => {
    renderWithRouter(<Navbar />);
    
    // Find mobile menu button
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeInTheDocument();
    
    // Mobile navigation should not be visible initially
    const mobileNav = screen.queryByTestId('mobile-nav');
    expect(mobileNav).not.toBeInTheDocument();

    // Click to open mobile menu
    fireEvent.click(menuButton);

    // Now mobile nav and its Connect Wallet should be visible
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    expect(screen.getAllByText('Connect Wallet')).toHaveLength(2);
  });
});
