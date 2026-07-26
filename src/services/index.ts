import { MockAuthService, type AuthService } from './auth';
import { MockCompanionService, type CompanionService } from './companion';
import { MockCrmService, type CrmService } from './crm';
import { MockSafetyService, type SafetyService } from './safety';
import { MockVoiceService, type VoiceService } from './voice';

/**
 * The service registry. Every service is an interface with a Mock… impl now
 * and an Api… impl later (real FastAPI/AWS backend). Swap an implementation
 * here and the whole app moves to the real backend behind the same types.
 */
export const services: {
  safety: SafetyService;
  auth: AuthService;
  crm: CrmService;
  companion: CompanionService;
  voice: VoiceService;
} = {
  safety: new MockSafetyService(),
  auth: new MockAuthService(),
  crm: new MockCrmService(),
  companion: new MockCompanionService(),
  voice: new MockVoiceService(),
};

export * from './safety';
export * from './auth';
export * from './crm';
export * from './companion';
export * from './voice';
