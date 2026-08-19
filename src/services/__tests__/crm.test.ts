const mockPost = jest.fn();
const mockPatch = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: { post: (...a: unknown[]) => mockPost(...a), patch: (...a: unknown[]) => mockPatch(...a) },
}));

import { ApiCrmService } from '@/services/crm';

describe('ApiCrmService', () => {
  const svc = new ApiCrmService();
  beforeEach(() => {
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('creates a contact with lifecycle facts only (snake_case body)', async () => {
    mockPost.mockResolvedValue({ synced: true });
    await svc.createContact({
      email: 'a@b.co',
      firstName: 'Sam',
      entryPath: 'partner_license',
      entitlement: 'license_active',
      sponsorOrganization: 'Westercove Care',
    });

    expect(mockPost).toHaveBeenCalledWith('/crm/contact', {
      email: 'a@b.co',
      first_name: 'Sam',
      entry_path: 'partner_license',
      entitlement: 'license_active',
      sponsor_organization: 'Westercove Care',
    });
  });

  it('patches the entitlement', async () => {
    mockPatch.mockResolvedValue({ synced: false }); // synced:false is not an error
    await expect(svc.updateEntitlement('a@b.co', 'lapsed')).resolves.toBeUndefined();
    expect(mockPatch).toHaveBeenCalledWith('/crm/contact/entitlement', {
      email: 'a@b.co',
      entitlement: 'lapsed',
    });
  });
});
