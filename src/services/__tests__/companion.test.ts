import { MockCompanionService } from '@/services/companion';
import { systemPrompt } from '@/services/companionPrompt';

describe('MockCompanionService', () => {
  const svc = new MockCompanionService();

  it('generates a neutral headline from the entry text', async () => {
    const reply = await svc.respond({
      type: 'Memory',
      text: 'The lake house, and the way he laughed all summer long',
    });
    expect(reply.headline.toLowerCase()).toContain('the lake house');
    expect(reply.response.length).toBeGreaterThan(0);
  });

  it('gives only a brief acknowledgment when the user chose "just heard"', async () => {
    const reply = await svc.respond({
      type: 'Journal',
      text: 'I just need to say this out loud',
      justHeard: true,
    });
    expect(reply.response).toBe('It is heard. It stays here.');
  });

  it('uses the loved one’s name when known', async () => {
    const reply = await svc.respond({
      type: 'Letter',
      text: 'I miss you',
      lovedOneName: 'Sam',
    });
    expect(reply.response).toContain('Sam');
  });
});

describe('systemPrompt library and profile', () => {
  const base = { history: [{ role: 'user' as const, content: 'hi' }] };

  it('names no book when the person has built no library', () => {
    const out = systemPrompt({ ...base, entryType: 'Journal' });
    expect(out).not.toContain('Books you can draw on');
  });

  it('offers the books with their practices when there are some', () => {
    const out = systemPrompt({
      ...base,
      entryType: 'Grief Question',
      library: [
        { title: 'Goodbye, Friend', author: 'Gary Kowalski', guidance: ['Hold a small ceremony.'] },
      ],
    });
    expect(out).toContain('Goodbye, Friend by Gary Kowalski');
    expect(out).toContain('Practices: Hold a small ceremony.');
    expect(out).toContain('name it by its title and author');
  });

  it('carries what the person already told us', () => {
    const out = systemPrompt({ ...base, profile: ['What helps me steady myself: walking'] });
    expect(out).toContain('What helps me steady myself: walking');
    expect(out).toContain('never recite it back');
  });
});
