<script lang="ts">
  import { people } from '../people/state.svelte';
  import type { Person } from '../people/people';

  let { person, isNew, done }: { person: Person | null; isNew: boolean; done: () => void } = $props();

  // a working copy, saved only when it is valid
  // svelte-ignore state_referenced_locally
  let draft = $state({
    username: person?.username ?? '',
    displayName: person?.displayName ?? '',
    birthday: person?.birthday ?? '',
    phone: person?.phone ?? '',
    email: person?.email ?? '',
    maxNoContactDays: person?.maxNoContactDays ?? 0,
    latest: person?.latest,
    hidden: person?.hidden ?? false,
  });
  let problem = $state<string | null>(null);

  const save = () => {
    const error = people.save({
      ...draft,
      birthday: draft.birthday.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      maxNoContactDays: Number(draft.maxNoContactDays) > 0 ? Math.round(Number(draft.maxNoContactDays)) : undefined,
    });
    problem = error;
    if (!error) done();
  };
</script>

<h2>{isNew ? 'New person' : 'Edit person'}</h2>

<section class="card">
  <label class="field"><span class="muted">Name</span><input class="input" bind:value={draft.displayName} placeholder="Sam Lee" /></label>
  <label class="field">
    <span class="muted">Tag (used as @tag in notes)</span>
    <input class="input" bind:value={draft.username} placeholder="Filled from the name" disabled={!isNew && !!person} />
  </label>
  <label class="field"><span class="muted">Birthday (YYYY-MM-DD)</span><input class="input" bind:value={draft.birthday} placeholder="1990-10-24" /></label>
  <label class="field"><span class="muted">Phone</span><input class="input" bind:value={draft.phone} inputmode="tel" /></label>
  <label class="field"><span class="muted">Email</span><input class="input" bind:value={draft.email} inputmode="email" /></label>
  <label class="field">
    <span class="muted">Aim for contact every (days, 0 for none)</span>
    <input class="input" type="number" min="0" max="365" bind:value={draft.maxNoContactDays} />
  </label>
</section>

{#if problem}<p class="problem">{problem}</p>{/if}
<button class="primary" onclick={save}>Save</button>
<button class="ghost" onclick={done}>Cancel</button>

<style>
  h2 { margin: 12px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 10px 16px; border-radius: 16px; background: var(--card); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .input { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; }
  .problem { color: var(--danger); font-weight: 600; }
  .primary { display: block; width: 100%; margin-top: 14px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>
