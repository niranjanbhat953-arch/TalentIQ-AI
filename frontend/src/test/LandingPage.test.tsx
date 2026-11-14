import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { LandingPage } from '../pages/LandingPage';

describe('LandingPage Component', () => {
  it('renders brand name and official tagline', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Brand appears in navbar, hero, footer - use getAllByText
    const brandElements = screen.getAllByText(/TalentIQ/i);
    expect(brandElements.length).toBeGreaterThan(0);
    // Tagline appears in hero and footer - use getAllByText
    const taglineElements = screen.getAllByText(/Beyond Resumes\. Discover Potential\./i);
    expect(taglineElements.length).toBeGreaterThan(0);
  });

  it('renders responsible AI commitment section and disclaimer', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Responsible AI \& Data Privacy Commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/Protected Characteristics Ignored/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Automatic Rejection/i)).toBeInTheDocument();
  });

  it('renders How It Works / pipeline section', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // The pipeline section heading in the actual landing page
    expect(screen.getByText(/Four Steps to Explainable Shortlisting/i)).toBeInTheDocument();
  });

  it('renders sign in navigation links', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Should have at least one link pointing to /signin
    const links = screen.getAllByRole('link');
    const hasSignInLink = links.some(link =>
      link.getAttribute('href') === '/signin'
    );
    expect(hasSignInLink).toBe(true);
  });
});
