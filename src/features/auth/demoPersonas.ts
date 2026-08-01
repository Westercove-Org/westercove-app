import type { Entry } from '@/features/journal/types';
import { SafetyLevel } from '@/services/safety';
import type { Entitlement, EntryPath, GateAnswers } from './types';

/**
 * Named demo accounts used for walkthroughs. Each persona is a self-contained
 * fixture: a stable id (the per-user storage key), an identity, day-zero gate
 * answers, and an established journal from prior days. Signing in as one lands
 * straight in the tab shell (gate already complete) with their history present,
 * so "continue journaling as this person" shows real continuity.
 *
 * Their journals live under the persona id in the entries store, so anything
 * added during a walkthrough is saved to that persona and is still there the
 * next time you sign in as them.
 */
export interface DemoPersona {
  /** Stable per-user storage id. */
  id: string;
  email: string;
  firstName: string;
  fullName: string;
  entryPath: EntryPath;
  entitlement: Entitlement;
  gateAnswers: GateAnswers;
  seedEntries: Entry[];
}

function daysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Build a two-turn entry (the person's words + the companion's reply). */
function mk(
  id: string,
  type: string,
  headline: string,
  createdAt: string,
  body: string,
  response: string,
): Entry {
  return {
    id,
    type,
    headline,
    createdAt,
    safetyLevel: SafetyLevel.Normal,
    turns: [
      { id: `${id}-u`, role: 'user', text: body, at: createdAt },
      { id: `${id}-c`, role: 'companion', text: response, at: createdAt },
    ],
  };
}

/** Append extra turns to an entry so some threads read as longer conversations. */
function withReplies(entry: Entry, ...pairs: [string, string][]): Entry {
  let n = entry.turns.length;
  for (const [user, companion] of pairs) {
    const at = entry.turns[entry.turns.length - 1].at;
    entry.turns.push({ id: `${entry.id}-u${n}`, role: 'user', text: user, at });
    entry.turns.push({ id: `${entry.id}-c${n}`, role: 'companion', text: companion, at });
    n += 1;
  }
  return entry;
}

const patrice: DemoPersona = {
  id: 'patrice-ellison',
  email: 'patrice@westercove.app',
  firstName: 'Patrice',
  fullName: 'Patrice Ellison',
  entryPath: 'consumer_trial',
  entitlement: 'trial_active',
  gateAnswers: {
    callName: 'Patrice',
    lovedOneName: 'Earl',
    relationship: 'my father',
    mode: 'human',
    tone: 'gentle and plain',
    skipped: [],
  },
  seedEntries: [
    withReplies(
      mk(
        'pat-e1',
        'Memory',
        'Dad at the workbench, sawdust and coffee',
        daysAgo(1, 20, 40),
        'I stood in the garage today and could almost smell it — sawdust and old coffee. Dad was always out there fixing something, humming a little. I did not think I would miss the sound of a sander.',
        'That garage held so much of him — the humming, the smell, the quiet fixing of things. It makes sense that standing there brought all of it close. You do not have to explain why the sander matters; it matters because he did.',
      ),
      ['I keep his tape measure in my coat pocket now. It is silly.', 'It is not silly at all. Carrying a small thing that was his is a way of keeping his hand near yours. Let it be exactly as meaningful as it is.'],
    ),
    mk(
      'pat-e2',
      'Struggle',
      'Sundays are the hardest',
      daysAgo(3, 9, 15),
      'Sundays were when I called him. I still reach for the phone around four and then remember. The whole afternoon goes grey after that.',
      'Four o\'clock on a Sunday has his shape in it. Reaching for the phone is not a mistake — it is love still running on its old schedule. Be gentle with the grey afternoons; they are grief keeping the appointment you two always kept.',
    ),
    withReplies(
      mk(
        'pat-e3',
        'Letter',
        'The things I never got to thank him for',
        daysAgo(6, 21, 50),
        'Dad — I never thanked you for teaching me to drive in the church parking lot, or for not laughing when I cried over the algebra. I thought there would be more time to say it.',
        'This is a good place to say it, and it is not too late for him to receive it here. The parking lot, the algebra, the patience — he gave you those, and now you are giving them back as gratitude. Say as much as you want; it will keep.',
      ),
      ['There is so much more. I do not know where to start.', 'Then start anywhere. You do not have to say it all today. This letter can stay open, and you can add to it whenever another thank-you finds you.'],
    ),
    mk(
      'pat-e4',
      'Anniversary',
      'His birthday is in nine days',
      daysAgo(9, 18, 30),
      'His birthday is coming and I feel it in my chest already. We always did a caramel cake. I do not know if I can face making one, or if not making one is worse.',
      'Birthdays can arrive in the body before the calendar. There is no wrong choice about the cake — baking it can be a way of sitting with him, and not baking it can be its own kind of honesty. We can move toward the day together, at whatever pace is yours.',
    ),
    mk(
      'pat-e5',
      'Journal',
      'A small good moment',
      daysAgo(12, 7, 20),
      'Something small — the coffee was good this morning and the light came in the kitchen the way it used to. For a minute it did not hurt. I felt guilty about that minute.',
      'A minute of ease is not a betrayal of him. Grief and gladness can share a kitchen. The light coming in the old way sounds like a small visit. You are allowed to keep the minute without paying for it in guilt.',
    ),
    mk(
      'pat-e6',
      'Practice',
      'Walking the block he liked',
      daysAgo(16, 19, 0),
      'I have started walking the block by the elementary school in the evenings, the one Dad liked because of the big oak. It helps a little to move.',
      'Movement can loosen what sitting holds tight, and walking his favorite block lets him keep you company on the way. A little help is still help. This sounds like a practice worth keeping.',
    ),
  ],
};

const maria: DemoPersona = {
  id: 'maria-delgado',
  email: 'maria@westercove.app',
  firstName: 'Maria',
  fullName: 'Maria Delgado',
  entryPath: 'consumer_trial',
  entitlement: 'trial_active',
  gateAnswers: {
    callName: 'Maria',
    lovedOneName: 'Miguel',
    relationship: 'my husband',
    mode: 'human',
    tone: 'warm, a little humor is okay',
    skipped: [],
  },
  seedEntries: [
    withReplies(
      mk(
        'mar-e1',
        'Memory',
        'Miguel dancing in the kitchen',
        daysAgo(1, 22, 5),
        'Thirty-one years and the man never once danced on time. Tonight I put on the record we played at the wedding and I could see him, spinning me around the kitchen, completely off the beat, grinning like he invented the song.',
        'Thirty-one years of a husband who danced to his own count — what a thing to have been held by. I can almost see the kitchen and that grin. You do not have to tidy this memory; let it spin as fully as it wants to.',
      ),
      ['I laughed and cried at the same time. Is that normal?', 'Completely. Laughing and crying at once is grief telling the truth — the joy and the missing are both real, and they arrived together because he was worth both.'],
    ),
    mk(
      'mar-e2',
      'Struggle',
      'The empty side of the bed',
      daysAgo(2, 6, 30),
      'It is the mornings. I wake up and reach over and the sheets are cold. Fifty years old and I do not know how to make coffee for one.',
      'The reaching is love, still moving before the mind catches up. Cold sheets on his side are a hard way to be woken. Coffee for one is a small ache with a big grief behind it — you are allowed to fumble it for a while.',
    ),
    withReplies(
      mk(
        'mar-e3',
        'Letter',
        'You forgot to tell me how to do this',
        daysAgo(5, 20, 15),
        'Miguel, you handled the taxes and the car and the scary phone calls, and you forgot to tell me how to do the hardest thing, which is the day without you in it. I am furious with you and I miss you so much I can not breathe.',
        'Both of those are welcome here — the fury and the missing that steals your breath. He left you holding things he always carried, and it is fair to be angry about that even while you ache for him. Say it all to him; this letter can hold the anger and the love at once.',
      ),
      ['I do not really mean the furious part.', 'You are allowed to mean it and not mean it. Anger at someone for dying is not a failure of love — it is often love with nowhere left to go. He can take it. So can this page.'],
    ),
    mk(
      'mar-e4',
      'Sign',
      'The cardinal on the fence',
      daysAgo(8, 8, 45),
      'A cardinal sat on the back fence this morning for the longest time, looking right at the window. Miguel always said his mother came back as one. I know how it sounds. I sat and watched it anyway.',
      'It does not sound like anything you need to defend. Whether it was a message or a bright red bird on a fence, you sat with something that felt like him, and that stillness was its own comfort. You are allowed to keep what the morning gave you.',
    ),
    mk(
      'mar-e5',
      'Journal',
      'Told our granddaughter a Miguel story',
      daysAgo(11, 19, 40),
      'Lucia asked about Grandpa today and I told her about the time he tried to fix the fence and made it worse, and how he laughed hardest of anyone. She laughed too. It was the best I have felt in weeks.',
      'Handing Lucia a story is handing her a piece of him she gets to keep. That she laughed where he would have laughed — that is him living on in the room. It makes sense this is the lightest you have felt; love was being passed down.',
    ),
  ],
};

export const DEMO_PERSONAS: DemoPersona[] = [patrice, maria];

export function getPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}
