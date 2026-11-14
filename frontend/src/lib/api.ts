import {
  Job, Resume, CandidateResult, ScreeningRun,
  InterviewQuestionSet, AnalyticsData, UserProfile,
  ScoringWeights, ReviewStatus
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    // Add auth token if available
    const activeToken = this.token || localStorage.getItem('talentiq_token');
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.detail || errorJson.message || errorMsg;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // Auth & System
  async getHealth() {
    return this.request<{ status: string }>('/health');
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async syncUser(data: { displayName?: string; photoUrl?: string; organization?: string }): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Jobs
  async listJobs(status?: string, search?: string): Promise<Job[]> {
    const params = new URLSearchParams();
    if (status) params.append('status_filter', status);
    if (search) params.append('search', search);
    return this.request<Job[]>(`/jobs?${params.toString()}`);
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async toggleArchiveJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/archive`, {
      method: 'PATCH',
    });
  }

  async deleteJob(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async parseJobDescription(rawText: string) {
    return this.request<any>('/jobs/parse-description', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    });
  }

  // Resumes
  async listResumes(jobId?: string): Promise<Resume[]> {
    const params = new URLSearchParams();
    if (jobId) params.append('job_id', jobId);
    return this.request<Resume[]>(`/resumes?${params.toString()}`);
  }

  async uploadResumes(files: File[], jobId?: string): Promise<{ resumes: Resume[]; duplicateCount: number; failedCount: number }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (jobId) formData.append('job_id', jobId);

    return this.request<{ resumes: Resume[]; duplicateCount: number; failedCount: number }>('/resumes/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getResume(id: string): Promise<Resume> {
    return this.request<Resume>(`/resumes/${id}`);
  }

  async retryResume(id: string): Promise<Resume> {
    return this.request<Resume>(`/resumes/${id}/retry`, {
      method: 'POST',
    });
  }

  async deleteResume(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resumes/${id}`, {
      method: 'DELETE',
    });
  }

  async analyzeResumeQuality(id: string): Promise<any> {
    return this.request<any>(`/resumes/${id}/quality-analysis`);
  }

  // Screening
  async listScreeningRuns(jobId?: string): Promise<ScreeningRun[]> {
    const params = new URLSearchParams();
    if (jobId) params.append('job_id', jobId);
    return this.request<ScreeningRun[]>(`/screening/runs?${params.toString()}`);
  }

  async createScreeningRun(jobId: string, resumeIds?: string[], customWeights?: ScoringWeights): Promise<ScreeningRun> {
    return this.request<ScreeningRun>('/screening/runs', {
      method: 'POST',
      body: JSON.stringify({ jobId, resumeIds, customWeights }),
    });
  }

  async getScreeningRun(id: string): Promise<ScreeningRun> {
    return this.request<ScreeningRun>(`/screening/runs/${id}`);
  }

  async getRunResults(runId: string): Promise<CandidateResult[]> {
    return this.request<CandidateResult[]>(`/screening/runs/${runId}/results`);
  }

  // Candidates
  async listCandidates(params?: { jobId?: string; reviewStatus?: string; search?: string; minScore?: number }): Promise<CandidateResult[]> {
    const searchParams = new URLSearchParams();
    if (params?.jobId) searchParams.append('job_id', params.jobId);
    if (params?.reviewStatus) searchParams.append('review_status', params.reviewStatus);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.minScore !== undefined) searchParams.append('min_score', params.minScore.toString());
    return this.request<CandidateResult[]>(`/candidates?${searchParams.toString()}`);
  }

  async getCandidate(id: string): Promise<CandidateResult> {
    return this.request<CandidateResult>(`/candidates/${id}`);
  }

  async updateCandidateReview(id: string, reviewStatus: ReviewStatus, recruiterNotes?: string): Promise<CandidateResult> {
    return this.request<CandidateResult>(`/candidates/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus, recruiterNotes }),
    });
  }

  async compareCandidates(jobId: string, candidateResultIds: string[]): Promise<any> {
    return this.request<any>('/candidates/compare', {
      method: 'POST',
      body: JSON.stringify({ jobId, candidateResultIds }),
    });
  }

  // Interviews
  async generateInterviewQuestions(data: {
    jobId: string;
    candidateResultId?: string;
    categories?: string[];
    questionCount?: number;
    targetDifficulty?: string;
  }): Promise<InterviewQuestionSet> {
    return this.request<InterviewQuestionSet>('/interviews/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listInterviewQuestionSets(jobId: string): Promise<InterviewQuestionSet[]> {
    return this.request<InterviewQuestionSet[]>(`/interviews/${jobId}`);
  }

  // Analytics
  async getDashboardAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/analytics/dashboard');
  }

  // Reports
  getCsvDownloadUrl(runId: string): string {
    return `${API_BASE}/reports/csv/${runId}`;
  }

  getPdfDownloadUrl(resultId: string): string {
    return `${API_BASE}/reports/pdf/${resultId}`;
  }

  // Settings & Deletion
  async getSettings(): Promise<any> {
    return this.request<any>('/settings');
  }

  async updateSettings(settings: Record<string, any>): Promise<any> {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async deleteData(scope: string, resourceId?: string, confirmationText: string = 'DELETE'): Promise<any> {
    return this.request<any>('/settings/delete-data', {
      method: 'POST',
      body: JSON.stringify({ scope, resourceId, confirmationText }),
    });
  }
}

export const api = new ApiClient();
