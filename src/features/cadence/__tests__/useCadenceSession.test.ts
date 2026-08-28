import { AppState } from 'react-native';

import { useCadenceSession } from '@/features/cadence/useCadence';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { renderHook } from '@/test-utils';

// useCadence.ts pulls useFocusEffect from expo-router (used by the sibling
// journaling-timer hook); stub it so the module loads under jest. (jest.mock is
// hoisted above the imports above.)
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

describe('useCadenceSession', () => {
  it('reports app_open on mount and on each return to the foreground', async () => {
    const appOpen = jest.spyOn(useCadenceStore.getState(), 'appOpen').mockImplementation(() => {});
    jest.spyOn(useCadenceStore.getState(), 'hydrate').mockResolvedValue();

    let handler: (s: string) => void = () => {};
    const remove = jest.fn();
    const addListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, h) => {
        handler = h as (s: string) => void;
        return { remove } as ReturnType<typeof AppState.addEventListener>;
      });
    (AppState as { currentState: string }).currentState = 'active';

    const { unmount } = await renderHook(() => useCadenceSession());

    // Mounting the shell = one session open.
    expect(appOpen).toHaveBeenCalledTimes(1);
    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function));

    // Backgrounding does not open a session; the next foreground does.
    handler('background');
    handler('active');
    expect(appOpen).toHaveBeenCalledTimes(2);

    // An inactive→active bounce is a return too (the server no-ops a tiny gap).
    handler('inactive');
    handler('active');
    expect(appOpen).toHaveBeenCalledTimes(3);

    // Staying active does not re-open.
    handler('active');
    expect(appOpen).toHaveBeenCalledTimes(3);

    unmount();
    jest.restoreAllMocks();
  });
});
