<script lang="ts">
  import { onMount } from 'svelte';
  import { people } from './people/state.svelte';
  import type { Person } from './people/people';
  import { paletteFrom, type Palette } from './palette';
  import { onPrefsChange } from './prefs-live';
  import Home from './screens/home.svelte';
  import Person_ from './screens/person.svelte';
  import Editor from './screens/editor.svelte';

  type View = { name: 'home' } | { name: 'person'; username: string } | { name: 'add' } | { name: 'edit'; person: Person };

  let view = $state<View>({ name: 'home' });
  let palette = $state<Palette>(paletteFrom(undefined));
  let scale = $state(1);

  const applyNomieValues = (plugin: any) => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const home = () => (view = { name: 'home' });
  // after an edit, the person's page is shown again
  const backToPerson = () => {
    if (view.name === 'edit') view = { name: 'person', username: view.person.username };
  };

  // the person on screen opens in the editor
  const editPerson = () => {
    if (view.name !== 'person') return;
    view = { name: 'edit', person: { ...people.people[view.username] } };
  };

  const addFromNomie = async () => {
    const added = await people.addFromNomie();
    if (added) view = { name: 'person', username: added };
  };

  onMount(() => {
    const plugin = new NomiePlugin({
      name: 'My People',
      emoji: '👨‍👩‍👧‍👦',
      description: 'Keep up with the people that matter most: who you have not seen for a while, birthdays, and quick check-ins in your timeline.',
      uses: ['createNote', 'openNoteEditor', 'openURL', 'searchNotes', 'selectTrackables', 'confirm', 'getStorageItem', 'setStorageItem'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: false,
    });
    people.plugin = plugin;
    onPrefsChange(plugin, () => applyNomieValues(plugin));
    plugin.onRegistered(async () => {
      applyNomieValues(plugin);
      if (!people.loaded) await people.load(plugin);
    });
    plugin.onUIOpened(async () => {
      applyNomieValues(plugin);
      if (!people.loaded) await people.load(plugin);
      else await people.refresh();
      view = { name: 'home' };
    });
  });
</script>

<div class="root" style="--page: {palette.page}; --card: {palette.card}; --card-inner: {palette.cardInner}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --good: {palette.good}; --danger: {palette.danger}; --scale: {scale};">
  <header class="top">
    <div class="title">
      <span aria-hidden="true">👨‍👩‍👧‍👦</span>
      <h1>My People</h1>
    </div>
    {#if people.busy}<span class="muted">Looking…</span>{/if}
  </header>

  {#if !people.loaded}
    <p class="muted">Loading…</p>
  {:else if view.name === 'person'}
    <Person_ username={view.username} edit={editPerson} back={home} removed={home} />
  {:else if view.name === 'add'}
    <Editor person={null} isNew={true} done={home} />
  {:else if view.name === 'edit'}
    <Editor person={view.person} isNew={false} done={backToPerson} />
  {:else}
    <Home open={(username) => (view = { name: 'person', username })} add={() => (view = { name: 'add' })} fromNomie={addFromNomie} />
  {/if}
</div>

<style>
  .root { box-sizing: border-box; min-height: 100vh; max-width: 520px; margin: 0 auto; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .title { display: flex; align-items: center; gap: 8px; }
  h1 { margin: 0; font-size: calc(22px * var(--scale)); font-weight: 700; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
</style>
