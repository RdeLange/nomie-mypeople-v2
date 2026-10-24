<script lang="ts">
  import { people } from '../people/state.svelte';
  import { CHECK_INS, birthdayIn, checkInNote, daysSince, noContactScore, telLink } from '../people/people';
  import { shortDate } from '../format';

  let { username, edit, back, removed }: { username: string; edit: () => void; back: () => void; removed: () => void } = $props();

  const p = $derived(people.people[username]);
  const now = new Date();
  const recent = $derived(people.notesFor(username).slice(0, 8));
  const sinceDays = $derived(p ? daysSince(p, now) : undefined);
  const left = $derived(p ? birthdayIn(p, now) : undefined);
  const score = $derived(p ? noContactScore(p, now) : 1000);

  const remove = async () => {
    if (await people.remove(username)) removed();
  };
  const call = () => p?.phone && people.plugin.openURL(telLink(p.phone), p.displayName);
  const mail = () => p?.email && people.plugin.openURL(`mailto:${p.email}`, p.displayName);
</script>

{#if !p}
  <p class="muted">This person is not in the list any more.</p>
  <button class="ghost" onclick={back}>Back</button>
{:else}
  <button class="link" onclick={back}>‹ Everyone</button>
  <h2>{p.displayName}</h2>
  <p class="muted">@{p.username}</p>

  <section class="card">
    <div class="row"><span>Last contact</span><span class="muted">{sinceDays === undefined ? 'None yet' : sinceDays === 0 ? 'Today' : `${sinceDays} days ago`}</span></div>
    {#if p.maxNoContactDays}
      <div class="row"><span>Aim for contact every</span><span class="muted">{p.maxNoContactDays} days</span></div>
      <div class="row"><span>Status</span><span class="muted">{score < 0 ? `${-score} days overdue` : score === 0 ? 'Due today' : `Due in ${score} days`}</span></div>
    {/if}
    {#if left !== undefined}<div class="row"><span>Birthday</span><span class="muted">{left === 0 ? 'Today' : `In ${left} days`}</span></div>{/if}
    {#if p.phone || p.email}
      <div class="actions">
        {#if p.phone}<button class="chip" onclick={call}>Call</button>{/if}
        {#if p.email}<button class="chip" onclick={mail}>Email</button>{/if}
      </div>
    {/if}
  </section>

  <h2>Check in</h2>
  <div class="chips">
    {#each CHECK_INS as kind (kind)}
      <button onclick={() => people.checkIn(checkInNote(kind, p.username), p.username)}>{kind.replace(' with', '')}</button>
    {/each}
  </div>

  <h2>Recent notes</h2>
  <section class="card">
    {#each recent as note (note.id ?? note.end)}
      <div class="row note"><span>{shortDate(note.end)}</span><span class="muted note-text">{note.note ?? ''}</span></div>
    {:else}
      <p class="muted pad">No notes with @{p.username} in the last 30 days.</p>
    {/each}
  </section>

  <div class="row-buttons">
    <button class="ghost" onclick={edit}>Edit</button>
    <button class="ghost" onclick={() => people.toggleHidden(p.username)}>{p.hidden ? 'Show in list' : 'Hide from list'}</button>
    <button class="ghost danger" onclick={remove}>Remove</button>
  </div>
{/if}

<style>
  h2 { margin: 6px 0 2px; font-size: calc(24px * var(--scale)); font-weight: 700; color: var(--text); text-transform: none; letter-spacing: 0; }
  .link { padding: 4px 0; border: 0; background: transparent; color: var(--tint); font: inherit; cursor: pointer; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .pad { padding: 10px 0; }
  .card { padding: 4px 16px; border-radius: 16px; background: var(--card); margin: 10px 0; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); }
  .row:first-child { border-top: 0; }
  .note { align-items: flex-start; }
  .note-text { text-align: right; overflow-wrap: anywhere; }
  .actions { display: flex; gap: 8px; padding: 8px 0 10px; }
  .chip { padding: 8px 14px; border: 0; border-radius: 10px; background: var(--fill); color: var(--tint); font: inherit; cursor: pointer; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chips button { padding: 8px 12px; border: 0; border-radius: 10px; background: var(--fill); color: var(--text); font: inherit; font-size: calc(14px * var(--scale)); cursor: pointer; }
  h2:not(:first-of-type) { margin-top: 16px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .row-buttons { display: flex; gap: 8px; margin-top: 16px; }
  .ghost { flex: 1; padding: 12px 6px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; font-size: calc(14px * var(--scale)); }
  .danger { color: var(--danger); }
</style>
