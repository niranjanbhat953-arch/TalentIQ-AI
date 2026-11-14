import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InterviewAssistantPage } from '../pages/InterviewAssistantPage';
import { api } from '../lib/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-123', email: 'test@talentiq.dev' },
    idToken: 'mock-token',
    loading: false,
    error: null,
  })),
}));

vi.mock('../lib/api', () => ({
  api: {
    listJobs: vi.fn(),
    listCandidates: vi.fn(),
    generateInterviewQuestions: vi.fn(),
  },
}));

const mockJobs = [
  {
    id: 'job-101',
    title: 'Senior Cloud Engineer',
    department: 'Infrastructure',
    status: 'ACTIVE',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    responsibilities: [],
    requiredSkills: ['AWS', 'Kubernetes'],
    preferredSkills: [],
    minExperienceYears: 5,
    educationRequirements: [],
    certifications: [],
    scoringWeights: { requiredSkills: 40, experience: 25, projects: 20, educationCerts: 15 },
    candidateCount: 2,
    screeningCount: 1,
    criteriaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'job-102',
    title: 'Staff Frontend Architect',
    department: 'Design Engineering',
    status: 'ACTIVE',
    location: 'San Francisco, CA',
    employmentType: 'FULL_TIME',
    responsibilities: [],
    requiredSkills: ['React', 'TypeScript'],
    preferredSkills: [],
    minExperienceYears: 6,
    educationRequirements: [],
    certifications: [],
    scoringWeights: { requiredSkills: 40, experience: 25, projects: 20, educationCerts: 15 },
    candidateCount: 4,
    screeningCount: 2,
    criteriaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('InterviewAssistantPage - Target Role Dropdown & Job States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully populates the Target Role dropdown with saved jobs', async () => {
    vi.mocked(api.listJobs).mockResolvedValueOnce(mockJobs as any);
    vi.mocked(api.listCandidates).mockResolvedValueOnce([] as any);

    render(
      <BrowserRouter>
        <InterviewAssistantPage />
      </BrowserRouter>
    );

    // Verify loading state transitions to populated options
    await waitFor(() => {
      const select = screen.getByLabelText(/Target Role/i) as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.options.length).toBe(2);
      expect(select.options[0].text).toContain('Senior Cloud Engineer');
      expect(select.options[0].value).toBe('job-101');
      expect(select.options[1].text).toContain('Staff Frontend Architect');
      expect(select.options[1].value).toBe('job-102');
    });
  });

  it('updates selected role and triggers candidates fetching on option change', async () => {
    vi.mocked(api.listJobs).mockResolvedValueOnce(mockJobs as any);
    vi.mocked(api.listCandidates).mockResolvedValue([] as any);

    render(
      <BrowserRouter>
        <InterviewAssistantPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Senior Cloud Engineer/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Target Role/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'job-102' } });

    expect(select.value).toBe('job-102');
    await waitFor(() => {
      expect(api.listCandidates).toHaveBeenCalledWith({ jobId: 'job-102' });
    });
  });

  it('renders helpful empty state and links to create jobs when no jobs exist', async () => {
    vi.mocked(api.listJobs).mockResolvedValueOnce([] as any);

    render(
      <BrowserRouter>
        <InterviewAssistantPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No saved jobs found/i)).toBeInTheDocument();
      expect(screen.getByText(/Create New Job/i)).toBeInTheDocument();
      expect(screen.getByText(/View Job Postings/i)).toBeInTheDocument();
      const select = screen.getByLabelText(/Target Role/i) as HTMLSelectElement;
      expect(select).toBeDisabled();
      expect(select.options[0].text).toContain('No job postings available');
    });
  });

  it('displays a meaningful error and provides a retry button on request failure', async () => {
    vi.mocked(api.listJobs).mockRejectedValueOnce(new Error('Network error 503 Service Unavailable'));

    render(
      <BrowserRouter>
        <InterviewAssistantPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error 503 Service Unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    // Test retry recovery
    vi.mocked(api.listJobs).mockResolvedValueOnce(mockJobs as any);
    vi.mocked(api.listCandidates).mockResolvedValueOnce([] as any);

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/Senior Cloud Engineer/i)).toBeInTheDocument();
      expect(screen.queryByText(/Network error 503/i)).not.toBeInTheDocument();
    });
  });
});
