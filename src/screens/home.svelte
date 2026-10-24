<script lang="ts">
  import { people } from '../people/state.svelte';
  import { birthdayIn, daysSince, needsAttention, noContactScore, sortPeople, upcomingBirthdays, type Person, type SortMode } from '../people/people';

  let { open, add, fromNomie }: { open: (username: string) => void; add: () => void; fromNomie: () => void } = $props();

  let query = $state('');
  const now = new Date();
  const SORTS: Array<[SortMode, string]> = [
    ['attention', 'Attention'],
    ['latest', 'Latest'],
    ['oldest', 'Oldest'],
    ['a-z', 'A–Z'],
    ['z-a', 'Z–A'],
  ];
  const matches = (p: Person) => !query.trim() || p.displayName.toLowerCase().includes(query.trim().toLowerCase());
  const everyone = $derived(sortPeople(people.list, people.sort, now).filter(matches));
  const due = $derived(needsAttention(people.list, now).filter(matches));
  const birthdays = $derived(upcomingBirthdays(people.list, now).filter(matches));

  const sinceText = (p: Person): string => {
    const days = daysSince(p, now);
    if (days === undefined) return 'No contact yet';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };
  const dueText = (p: Person): string => {
    const score = noContactScore(p, now);
    if (score >= 1000) return '';
    if (score < 0) return `${-score} days overdue`;
    return score === 0 ? 'Due today' : `Due in ${score} days`;
  };
  const birthdayText = (p: Person): string => {
    const left = birthdayIn(p, now);
    return left === 0 ? 'Birthday today' : `Birthday in ${left} days`;
  };
</script>

<input class="search" type="search" placeholder="Search people" bind:value={query} aria-label="Search people" />

<div class="chips" role="group" aria-label="Sort">
  {#each SORTS as [mode, label] (mode)}
    <button class:on={people.sort === mode} aria-pressed={people.sort === mode} onclick={() => people.setSort(mode)}>{label}</button>
  {/each}
</div>

{#if due.length}
  <h2>Reach out</h2>
  <section class="card">
    {#each due as p (p.username)}
      <button class="row" onclick={() => open(p.username)}>
        <span class="text"><span class="title">{p.displayName}</span><span class="muted">{dueText(p)}</span></span>
        <span class="badge">{noContactScore(p, now) < 0 ? '!' : '•'}</span>
      </button>
    {/each}
  </section>
{/if}

{#if birthdays.length}
  <h2>Birthdays</h2>
  <section class="card">
    {#each birthdays as p (p.username)}
      <button class="row" onclick={() => open(p.username)}>
        <span class="text"><span class="title">🎂 {p.displayName}</span><span class="muted">{birthdayText(p)}</span></span>
      </button>
    {/each}
  </section>
{/if}

<h2>Everyone</h2>
<section class="card">
  {#each everyone as p (p.username)}
    <button class="row" onclick={() => open(p.username)}>
      <span class="avatar" aria-hidden="true">{p.displayName.slice(0, 2).toUpperCase()}</span>
      <span class="text">
        <span class="title">{p.displayName}</span>
        <span class="muted">{sinceText(p)}{dueText(p) ? ` · ${dueText(p)}` : ''}</span>
      </span>
    </button>
  {:else}
    <p class="muted pad">{query ? 'No one matches.' : 'Mention someone with @name in a note, or add them here.'}</p>
  {/each}
</section>

<div class="row-buttons">
  <button class="ghost" onclick={add}>Add a person</button>
  <button class="ghost" onclick={fromNomie}>From Nomie</button>
</div>

<style>
  .search { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
  .chips button { padding: 7px 11px; border: 0; border-radius: 10px; background: var(--fill); color: var(--text); font: inherit; font-size: calc(14px * var(--scale)); cursor: pointer; }
  .chips button.on { background: var(--tint-soft); color: var(--tint); font-weight: 600; }
  h2 { margin: 16px 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 4px 16px; border-radius: 16px; background: var(--card); }
  .row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 0; border: 0; border-top: 1px solid var(--line); background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .row:first-child { border-top: 0; }
  .text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .title { font-weight: 600; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .pad { padding: 12px 0; }
  .avatar { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; background: var(--tint-soft); color: var(--tint); font-weight: 700; font-size: calc(13px * var(--scale)); flex-shrink: 0; }
  .badge { color: var(--danger); font-weight: 700; }
  .row-buttons { display: flex; gap: 8px; margin-top: 14px; }
  .ghost { flex: 1; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>
