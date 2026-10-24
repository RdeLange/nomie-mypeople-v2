// The state of the plugin: the people, the recent notes that mention them, and the sort. The screens show it.
import { mergeMentions, sortPeople, tagOf, type Person, type SortMode } from './people';

const DAYS_BACK = 30;

class PeopleState {
  plugin: any = null;
  loaded = $state(false);
  people = $state<Record<string, Person>>({});
  sort = $state<SortMode>('attention');
  // the notes of the last 30 days that mention someone
  notes = $state<any[]>([]);
  busy = $state(false);

  async load(plugin: any): Promise<void> {
    this.plugin = plugin;
    await plugin.storage.init();
    this.people = plugin.storage.getItem('people') ?? {};
    this.sort = plugin.storage.getItem('sort') ?? 'attention';
    this.loaded = true;
    await this.refresh();
  }

  // Looks at the notes of the last 30 days, and adds the people who were mentioned in them
  async refresh(): Promise<void> {
    if (!this.plugin || this.busy) return;
    this.busy = true;
    try {
      const all: any[] = (await this.plugin.searchNotes('', new Date(), DAYS_BACK)) ?? [];
      this.notes = all.filter((n) => (n.elements ?? []).some((e: any) => e.type === 'person'));
      const merged = mergeMentions(this.people, this.notes);
      if (merged.changed) this.saveAll(merged.people);
    } finally {
      this.busy = false;
    }
  }

  private saveAll(people: Record<string, Person>): void {
    this.people = people;
    this.plugin?.storage.setItem('people', $state.snapshot(people));
  }

  get list(): Person[] {
    return Object.values(this.people);
  }

  // The recent notes that mention a person
  notesFor(username: string): any[] {
    return this.notes.filter((n) => (n.elements ?? []).some((e: any) => e.type === 'person' && e.id === username));
  }

  setSort(mode: SortMode): void {
    this.sort = mode;
    this.plugin?.storage.setItem('sort', mode);
  }

  // Adds or changes a person. A new one gets its tag from the name.
  save(person: Person): string | null {
    const name = person.displayName.trim();
    if (!name) return 'Give the person a name.';
    const username = person.username || tagOf(name);
    if (!username) return 'The name needs a letter or a digit.';
    if (person.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(person.birthday)) return 'The birthday is YYYY-MM-DD.';
    const next = { ...$state.snapshot(person), username, displayName: name };
    this.saveAll({ ...this.people, [username]: next });
    return null;
  }

  // Takes a person out of the list. Their notes are not changed.
  async remove(username: string): Promise<boolean> {
    const res = await this.plugin.confirm(`Remove ${this.people[username]?.displayName ?? username}?`, 'They are removed from My People. Nothing is removed from Nomie.');
    if (!res?.value) return false;
    const rest = { ...this.people };
    delete rest[username];
    this.saveAll(rest);
    return true;
  }

  toggleHidden(username: string): void {
    const p = this.people[username];
    if (p) this.saveAll({ ...this.people, [username]: { ...p, hidden: !p.hidden } });
  }

  // Adds a person chosen from your Nomie people, as v1 did
  async addFromNomie(): Promise<string | null> {
    const picked = await this.plugin.selectTrackables('person', false);
    const person = picked?.[0]?.person;
    if (!person?.username) return null;
    return this.save({ username: person.username, displayName: person.displayName || person.username, latest: this.people[person.username]?.latest });
  }

  // A check-in opens in the note editor, so the text can be changed before it is saved. The contact is noted as now.
  checkIn(note: string, username: string): void {
    const p = this.people[username];
    if (p) this.saveAll({ ...this.people, [username]: { ...p, latest: new Date().toISOString() } });
    this.plugin.openNoteEditor(note);
  }
}

export const people = new PeopleState();
