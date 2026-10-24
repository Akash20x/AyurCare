import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const auth = vi.hoisted(() => ({
  state: {
    user: null as { email: string; role: string } | null,
    isAuthenticated: null as boolean | null,
    isLoading: false,
    logout: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth.state }));

import Header from '@/components/layout/Header';

function renderHeader() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Header />
    </QueryClientProvider>,
  );
}

describe('Header authentication control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.state = {
      user: null,
      isAuthenticated: null,
      isLoading: false,
      logout: vi.fn(),
    };
  });

  it('shows a neutral placeholder while authentication is unresolved', () => {
    renderHeader();

    expect(screen.getByRole('status', { name: 'Checking sign-in status' })).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open account menu' })).toBeNull();
  });

  it('shows Sign In only after an unauthenticated session is resolved', () => {
    auth.state.isAuthenticated = false;
    renderHeader();

    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('shows the account menu for an authenticated session', () => {
    auth.state = {
      ...auth.state,
      user: { email: 'patient@example.com', role: 'user' },
      isAuthenticated: true,
    };
    renderHeader();

    expect(screen.getByRole('button', { name: 'Open account menu' })).toBeTruthy();
  });
});
