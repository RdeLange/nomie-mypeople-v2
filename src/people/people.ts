// The people: who is in the list, when you last saw them, the contact you aim for, and their birthdays.
// People come from the @mentions in your notes, and from the list the user keeps.
const DAY = 24 * 60 * 60 * 1000;

export type Person = {
  // the tag without the @
  username: string;
  displayName: string;
  // YYYY-MM-DD
  birthday?: string;
  phone?: string;
  email?: string;
  // the most days you want between two contacts
  maxNoContactDays?: number;
  // the last time they were mentioned or met (ISO)
  latest?: string;
  // left out of the list, but kept
  hidden?: boolean;
};

export type Mention = { id: string; raw?: string; end: string };

export type SortMode = 'attention' | 'latest' | 'oldest' | 'a-z' | 'z-a';

// The tag of a name: letters and digits, in lower case, joined by underscores
export const tagOf = (name: string): string =>
  name
    .replace(/[@#+]/g, '')
    .trim()
    .replace(/[^A-Za-z0-9]/g, '_')
    .toLowerCase();

const daysBetween = (from: Date, to: Date): number => Math.floor((to.getTime() - from.getTime()) / DAY);

// The days left before the contact you aim for is due. Without a target the person is not due, and gets a large number.
export const noContactScore = (p: Person, now: Date): number => {
  if (!p.maxNoContactDays) return 1000;
  const last = p.latest ? new Date(p.latest) : new Date('2001-01-01');
  return p.maxNoContactDays - daysBetween(last, now);
};

export const daysSince = (p: Person, now: Date): number | undefined => (p.latest ? daysBetween(new Date(p.latest), now) : undefined);

// The date of the next birthday, at local midnight, or undefined without a birthday
export const nextBirthday = (p: Person, now: Date): Date | undefined => {
  if (!p.birthday) return undefined;
  const [, month, day] = p.birthday.split('-').map(Number);
  if (!month || !day) return undefined;
  const thisYear = new Date(now.getFullYear(), month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return thisYear.getTime() < today.getTime() ? new Date(now.getFullYear() + 1, month - 1, day) : thisYear;
};

// The days until the birthday (0 on the day itself)
export const birthdayIn = (p: Person, now: Date): number | undefined => {
  const next = nextBirthday(p, now);
  if (!next) return undefined;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return daysBetween(today, next);
};

// Adds the people who were mentioned, and moves the last contact of each one forward. Returns the list and whether it changed.
export const mergeMentions = (people: Record<string, Person>, mentions: Array<{ elements?: Array<{ type: string; id: string; raw?: string }>; end: string }>): { people: Record<string, Person>; changed: boolean } => {
  let changed = false;
  const next = { ...people };
  for (const note of mentions) {
    for (const e of (note.elements ?? []).filter((el) => el.type === 'person')) {
      const current = next[e.id];
      if (!current) {
        next[e.id] = { username: e.id, displayName: e.raw ?? e.id, latest: note.end };
        changed = true;
      } else if (!current.latest || new Date(current.latest) < new Date(note.end)) {
        next[e.id] = { ...current, latest: note.end };
        changed = true;
      }
    }
  }
  return { people: next, changed };
};

// The list of people, sorted as the user chose. Hidden people are left out.
export const sortPeople = (list: Person[], mode: SortMode, now: Date): Person[] => {
  const visible = list.filter((p) => !p.hidden);
  const byName = (a: Person, b: Person) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
  const byLatest = (a: Person, b: Person) => (a.latest ?? '').localeCompare(b.latest ?? '');
  switch (mode) {
    case 'attention':
      return [...visible].sort((a, b) => noContactScore(a, now) - noContactScore(b, now) || byName(a, b));
    case 'latest':
      return [...visible].sort((a, b) => byLatest(b, a));
    case 'oldest':
      return [...visible].sort(byLatest);
    case 'a-z':
      return [...visible].sort(byName);
    case 'z-a':
      return [...visible].sort((a, b) => byName(b, a));
  }
};

// People who are due: their target is near (2 days or less), and it is not their birthday
export const needsAttention = (list: Person[], now: Date): Person[] =>
  list.filter((p) => !p.hidden && noContactScore(p, now) <= 2 && birthdayIn(p, now) !== 0);

// The birthdays in the next `days` days
export const upcomingBirthdays = (list: Person[], now: Date, days = 30): Person[] =>
  list
    .filter((p) => !p.hidden)
    .filter((p) => {
      const left = birthdayIn(p, now);
      return left !== undefined && left <= days;
    })
    .sort((a, b) => birthdayIn(a, now)! - birthdayIn(b, now)!);

// The notes a check-in starts with. The tag of the person follows the text.
export const CHECK_INS = ['Lunch with', 'Dinner with', 'Phone call with', 'Virtual meeting with', 'Texted', 'Emailed', 'Drinks with', 'Meeting with', 'Hung out with', 'With'];

export const checkInNote = (kind: string, username: string): string => `${kind} @${username} `;

// A phone number as a link: only digits and the plus sign are kept
export const telLink = (phone: string): string => `tel:${phone.replace(/[^0-9+]/g, '')}`;
