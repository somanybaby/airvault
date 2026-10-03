<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import { push } from 'svelte-spa-router';
  import Logo from '../lib/components/Logo.svelte';
  import ErrorLine from '../lib/components/ErrorLine.svelte';
  import { login } from '../lib/api/session';
  import { errMsg } from '../lib/api/client';

  let token = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  async function submit(event: Event) {
    event.preventDefault();
    const value = token.trim();
    if (!value || busy) return;
    busy = true;
    error = null;
    try {
      await login(value);
      push('/');
    } catch (err) {
      error = errMsg(err, 'sign_in_failed');
    } finally {
      busy = false;
    }
  }

</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
  <div class="card w-full max-w-sm border border-base-300 bg-base-100 shadow-sm">
    <form class="card-body gap-4" onsubmit={submit}>
      <div class="flex flex-col items-center gap-2 text-center">
        <Logo size={40} />
        <h1 class="text-lg font-semibold tracking-tight">登录 AirVault</h1>
        <p class="text-sm text-base-content/60">
          请输入管理页面访问令牌
        </p>
      </div>

      <input
        type="password"
        class="input w-full"
        placeholder="管理页面访问令牌"
        autocomplete="current-password"
        aria-label="管理页面访问令牌"
        bind:value={token}
        disabled={busy}
        {@attach (node) => node.focus()}
      />

      <ErrorLine {error} variant="alert" />

      <button type="submit" class="btn btn-primary" disabled={busy || !token.trim()}>
        {#if busy}<span class="loading loading-spinner loading-sm"></span>{/if}
        登录
      </button>
    </form>
  </div>
</div>
