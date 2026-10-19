import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
const auth = vi.hoisted(() => ({
  state: { user: null as { role: string } | null, isAuthenticated: false, isLoading: false },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/admin/doctors',
}));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth.state }));

import { AdminGuard } from '@/components/admin/AdminGuard';

describe('Admin route access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects signed-out users to login and hides admin content', () => {
    auth.state = { user: null, isAuthenticated: false, isLoading: false };
    render(<AdminGuard><p>Manage doctors</p></AdminGuard>);

    expect(router.replace).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fdoctors');
    expect(screen.queryByText('Manage doctors')).toBeNull();
  });

  it('blocks patient users and allows admin users', () => {
    auth.state = { user: { role: 'user' }, isAuthenticated: true, isLoading: false };
    const view = render(<AdminGuard><p>Manage doctors</p></AdminGuard>);

    expect(screen.getByText('Admin access required')).toBeTruthy();
    expect(screen.queryByText('Manage doctors')).toBeNull();

    auth.state = { user: { role: 'admin' }, isAuthenticated: true, isLoading: false };
    view.rerender(<AdminGuard><p>Manage doctors</p></AdminGuard>);
    expect(screen.getByText('Manage doctors')).toBeTruthy();
  });
});
