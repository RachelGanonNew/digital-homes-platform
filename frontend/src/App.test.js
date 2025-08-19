import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import App from './App';

test('renders navbar and routes without crashing', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(await screen.findByRole('navigation')).toBeInTheDocument();
});

