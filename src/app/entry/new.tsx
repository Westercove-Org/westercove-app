import { NewEntry } from '@/features/journal/NewEntry';

/** Compose a new entry. Reached at `/entry/new?type=X`. */
export default function NewEntryRoute() {
  return <NewEntry />;
}
