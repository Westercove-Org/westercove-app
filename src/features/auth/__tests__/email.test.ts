import { isEmail } from '@/features/auth/email';

describe('isEmail', () => {
  it('accepts a normal address', () => {
    expect(isEmail('you@example.com')).toBe(true);
    expect(isEmail('  a.b+tag@sub.example.co  ')).toBe(true);
  });

  it('rejects empty and malformed input', () => {
    for (const bad of ['', '   ', 'you', 'you@', '@example.com', 'you@example', 'a b@c.com']) {
      expect(isEmail(bad)).toBe(false);
    }
  });
});
