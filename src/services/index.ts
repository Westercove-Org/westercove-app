import { MockAuthService, type AuthService } from './auth';
import { ApiCompanionService, type CompanionService } from './companion';
import { ApiContentService, type ContentService } from './content';
import { MockCrmService, type CrmService } from './crm';
import { MockSafetyService, type SafetyService } from './safety';
import { MockSubscriptionService, type SubscriptionService } from './subscription';
import { ApiSurveyService, type SurveyService } from './survey';
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
  content: ContentService;
  subscription: SubscriptionService;
  survey: SurveyService;
} = {
  safety: new MockSafetyService(),
  auth: new MockAuthService(),
  crm: new MockCrmService(),
  companion: new ApiCompanionService(),
  voice: new MockVoiceService(),
  content: new ApiContentService(),
  subscription: new MockSubscriptionService(),
  survey: new ApiSurveyService(),
};

export * from './safety';
export * from './auth';
export * from './crm';
export * from './companion';
export * from './voice';
export * from './content';
export * from './subscription';
export * from './survey';
