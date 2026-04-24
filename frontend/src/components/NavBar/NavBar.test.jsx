import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from './NavBar';

jest.mock('react-router-dom');

// Ensure window.matchMedia is mocked before component import
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Navbar', () => {
  it('renders primary navigation links', () => {
    render(<Navbar />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument();
  });
});

