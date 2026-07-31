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

  it('reflects a fragment of the user’s own words back', async () => {
    const reply = await svc.respond({
      type: 'Memory',
      text: 'She drew foxes on everything and narrated her whole life out loud',
      lovedOneName: 'Lily',
    });
    expect(reply.response).toContain('Lily');
    expect(reply.response.toLowerCase()).toContain('drew foxes');
  });

  it('never emits em dashes or exclamation points (brand voice)', async () => {
    const reply = await svc.respond({
      type: 'Journal',
      text: 'It was wonderful — the best day! — and then it was not',
      lovedOneName: 'Lily',
    });
    expect(reply.response).not.toMatch(/[—–!]/);
    expect(reply.headline).not.toMatch(/[—–!]/);
  });
});
