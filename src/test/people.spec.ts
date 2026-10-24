import { describe, expect, it } from 'vitest';
import { birthdayIn, checkInNote, daysSince, mergeMentions, needsAttention, noContactScore, nextBirthday, noContactScore as score, sortPeople, tagOf, telLink, upcomingBirthdays, type Person } from '../people/people';

const now = new Date(2026, 9, 21, 12);
const sam: Person = { username: 'sam', displayName: 'Sam', latest: new Date(2026, 9, 10, 9).toISOString(), maxNoContactDays: 14 };
const lee: Person = { username: 'lee', displayName: 'Lee', latest: new Date(2026, 9, 20, 9).toISOString() };

describe('names and tags', () => {
  it('a tag is the name in lower case, with the letters and digits only', () => {
    expect(tagOf('Ann Lee')).toBe('ann_lee');
    expect(tagOf('@Sam!')).toBe('sam_');
  });
});

describe('the contact you aim for', () => {
  it('the days left before the contact is due, and no target gives a large number', () => {
    expect(noContactScore(sam, now)).toBe(14 - 11);
    expect(score(lee, now)).toBe(1000);
    expect(daysSince(sam, now)).toBe(11);
  });

  it('a person who is due soon needs attention, unless it is their birthday', () => {
    const due: Person = { ...sam, latest: new Date(2026, 9, 1, 9).toISOString() };
    expect(needsAttention([due, lee], now).map((p) => p.username)).toEqual(['sam']);
    const birthdayToday: Person = { ...due, birthday: '1990-10-21' };
    expect(needsAttention([birthdayToday], now)).toEqual([]);
  });
});

describe('birthdays', () => {
  it('the next birthday is this year when it is still to come, otherwise next year', () => {
    expect(nextBirthday({ ...sam, birthday: '1990-12-01' }, now)?.getFullYear()).toBe(2026);
    expect(nextBirthday({ ...sam, birthday: '1990-01-05' }, now)?.getFullYear()).toBe(2027);
    expect(birthdayIn({ ...sam, birthday: '1990-10-24' }, now)).toBe(3);
  });

  it('the birthdays of the next 30 days, soonest first', () => {
    const list = [{ ...sam, birthday: '1990-11-01' }, { ...lee, birthday: '1990-10-23' }, { ...lee, username: 'x', birthday: '1990-12-30' }];
    expect(upcomingBirthdays(list, now).map((p) => p.username)).toEqual(['lee', 'sam']);
  });
});

describe('mentions in the notes', () => {
  it('a new mention adds the person, and a later one moves the last contact forward', () => {
    const notes = [
      { end: new Date(2026, 9, 19, 9).toISOString(), elements: [{ type: 'person', id: 'ann', raw: 'Ann' }] },
      { end: new Date(2026, 9, 21, 9).toISOString(), elements: [{ type: 'person', id: 'sam' }, { type: 'tracker', id: 'mood' }] },
    ];
    const { people, changed } = mergeMentions({ sam }, notes);
    expect(changed).toBe(true);
    expect(people.ann.displayName).toBe('Ann');
    expect(people.sam.latest).toBe(new Date(2026, 9, 21, 9).toISOString());
  });

  it('nothing changes when the notes are older than what is known', () => {
    const { changed } = mergeMentions({ sam }, [{ end: new Date(2026, 9, 1).toISOString(), elements: [{ type: 'person', id: 'sam' }] }]);
    expect(changed).toBe(false);
  });
});

describe('the list', () => {
  it('sorts by attention, by last contact, or by name, and leaves out the hidden people', () => {
    const hidden: Person = { username: 'h', displayName: 'Hidden', hidden: true };
    expect(sortPeople([lee, sam, hidden], 'attention', now).map((p) => p.username)).toEqual(['sam', 'lee']);
    expect(sortPeople([lee, sam], 'latest', now).map((p) => p.username)).toEqual(['lee', 'sam']);
    expect(sortPeople([lee, sam], 'a-z', now).map((p) => p.username)).toEqual(['lee', 'sam']);
  });

  it('a check-in starts with the kind and the tag of the person', () => {
    expect(checkInNote('Lunch with', 'sam')).toBe('Lunch with @sam ');
    expect(telLink('+31 (0)6 12-34')).toBe('tel:+31061234');
  });
});
