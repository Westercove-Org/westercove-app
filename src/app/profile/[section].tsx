import { useLocalSearchParams } from 'expo-router';

import { SectionPage } from '@/features/profile/SectionPage';

/** Generic Profile / Settings section page. Reached at `/profile/:section`. */
export default function ProfileSectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>();
  return <SectionPage slug={section} />;
}
