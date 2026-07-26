import { MockAuthService, type AuthService } from './auth';
import { MockCrmService, type CrmService } from './crm';
import { MockSafetyService, type SafetyService } from './safety';

/**
 * The service registry. Every service is an interface with a Mock… impl now
 * and an Api… impl later (real FastAPI/AWS backend). Swap an implementation
 * here and the whole app moves to the real backend behind the same types.
 */
export const services: {
  safety: SafetyService;
  auth: AuthService;
  crm: CrmService;
} = {
  safety: new MockSafetyService(),
  auth: new MockAuthService(),
  crm: new MockCrmService(),
};

export * from './safety';
export * from './auth';
export * from './crm';
