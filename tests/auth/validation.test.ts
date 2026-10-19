import { describe, expect, it } from 'vitest';
import { userLoginSchema, userRegistrationSchema } from '@/lib/validations/auth';

describe('Auth validation', () => {
  it('normalizes login email to lowercase', () => {
    expect(userLoginSchema.parse({ email: 'USER@EXAMPLE.COM', password: 'secret' })).toEqual({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('accepts valid registration and rejects weak passwords', () => {
    expect(userRegistrationSchema.safeParse({
      name: 'Asha Sharma',
      email: 'asha@example.com',
      password: 'StrongPass1!',
    }).success).toBe(true);

    expect(userRegistrationSchema.safeParse({
      name: 'Asha Sharma',
      email: 'asha@example.com',
      password: 'password',
    }).success).toBe(false);
  });

});
