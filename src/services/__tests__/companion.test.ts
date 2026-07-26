import { MockCompanionService } from '@/services/companion';

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
