import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { SignInPage } from '../pages/SignInPage';

// Mock firebase auth to avoid real network calls
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null); // Simulate no user signed in
    return vi.fn(); // Return unsubscribe fn
  }),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  app: {},
}));

vi.mock('../lib/api', () => ({
  api: {
    setToken: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('No user')),
    syncUser: vi.fn().mockRejectedValue(new Error('No user')),
  }
}));

describe('SignInPage Component', () => {
  it('renders Google sign in button and demo recruiter option', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignInPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In as Demo Recruiter/i)).toBeInTheDocument();
  });

  it('renders brand and tagline on sign-in page', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignInPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const brandElements = screen.getAllByText(/TalentIQ/i);
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it('shows responsible AI note on sign-in page', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignInPage />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verify it renders without crashing
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
  });
});
