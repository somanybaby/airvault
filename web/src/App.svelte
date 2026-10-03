<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import Router, { router } from 'svelte-spa-router';
  import Nav from './lib/components/Nav.svelte';
  import Icon from './lib/components/Icon.svelte';
  import { statusStore } from './lib/stores.svelte';
  import Devices from './routes/Devices.svelte';
  import DeviceDetail from './routes/DeviceDetail.svelte';
  import Login from './routes/Login.svelte';

  const routes = {
    '/': Devices,
    '/login': Login,
    '/device/:udid': DeviceDetail,
    '*': Devices,
  };

  // `offline` starts false and only flips true after a fetch actually fails, so
  // this never flashes during the initial load.
  const showOfflineBanner = $derived(statusStore.offline);
  // Login owns the whole viewport — no Nav/SSE (which is what would 401 here).
  const onLogin = $derived(router.location === '/login');

  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev';
</script>

{#if onLogin}
  <Router {routes} />
{:else}
<div class="flex min-h-screen flex-col bg-base-200 text-base-content">
  <Nav />

  {#if showOfflineBanner}
    <div class="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
      <div role="alert" class="alert alert-warning alert-soft">
        <Icon name="offline" size={16} stroke={2} />
        <span>无法连接 AirVault 服务，正在自动重试……</span>
      </div>
    </div>
  {/if}

  <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
    <Router {routes} />
  </main>

  <footer class="border-t border-base-300">
    <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-base-content/60 sm:px-6">
      <span>AirVault · 中文社区版 · 自托管 iPhone 备份</span>
      <span class="flex items-center gap-2">
        <a class="link link-hover" href="https://github.com/somanybaby/airvault/tree/zh-CN" target="_blank" rel="noopener noreferrer">源码</a>
        <a class="link link-hover" href="https://github.com/somanybaby/airvault/blob/zh-CN/NOTICE.md" target="_blank" rel="noopener noreferrer">GPLv3+ · 无担保</a>
      </span>
      <span>{appVersion}</span>
    </div>
  </footer>
</div>
{/if}
