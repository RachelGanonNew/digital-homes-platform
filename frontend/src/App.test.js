import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders navbar and routes without crashing', () => {
  render(<App />);
  // Navbar brand/title presence
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

