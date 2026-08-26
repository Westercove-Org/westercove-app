import { CognitoAuthService, type AuthService } from './auth';
import { ApiCadenceService, type CadenceService } from './cadence';
import { ApiChatSessionService, type ChatSessionService } from './chat';
import { MockCompanionService, type CompanionService } from './companion';
import { ApiLibraryService, type LibraryService } from './library';
import { ApiContentService, type ContentService } from './content';
import { ApiCrmService, type CrmService } from './crm';
import { ApiSafetyService, type SafetyService } from './safety';
import { ApiSubscriptionService, type SubscriptionService } from './subscription';
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
  chat: ChatSessionService;
  cadence: CadenceService;
  survey: SurveyService;
  library: LibraryService;
} = {
  safety: new ApiSafetyService(),
  auth: new CognitoAuthService(),
  crm: new ApiCrmService(),
  companion: new MockCompanionService(),
  voice: new MockVoiceService(),
  content: new ApiContentService(),
  subscription: new ApiSubscriptionService(),
  chat: new ApiChatSessionService(),
  cadence: new ApiCadenceService(),
  survey: new ApiSurveyService(),
  library: new ApiLibraryService(),
};

export * from './chat';
export * from './cadence';
export * from './library';
export * from './safety';
export * from './auth';
export * from './crm';
export * from './companion';
export * from './voice';
export * from './content';
export * from './subscription';
export * from './survey';
