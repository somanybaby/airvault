<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import { statusStore, devicesStore } from '../lib/stores.svelte';
  import EmptyState from '../lib/components/EmptyState.svelte';
  import DeviceTile from '../lib/components/DeviceTile.svelte';
  import OrphanBackups from '../lib/components/OrphanBackups.svelte';
  import PairWizard from '../lib/components/PairWizard.svelte';
  import Icon from '../lib/components/Icon.svelte';

  // Ref-counted subscribe (Nav holds statusStore); SSE keeps it fresh while mounted.
  $effect(() => devicesStore.start());

  const devices = $derived(devicesStore.data ?? []);
  // Orphaned sources (backups whose phone is gone) get their own section
  // below the grid instead of masquerading as offline phones.
  const phones = $derived(devices.filter((device) => !device.orphaned));
  const orphans = $derived(devices.filter((device) => device.orphaned));
  const showOffline = $derived(devicesStore.offline && !devicesStore.ready);
  const loadError = $derived(devicesStore.loadError('devices_load_failed'));
  const showEmpty = $derived(devicesStore.ready && phones.length === 0);
  // Exception-only: daemon is fine but the device muxer under it is not
  // (global backend unreachability is App.svelte's job).
  const muxer = $derived(statusStore.data?.muxer);
  const muxerDown = $derived(!!muxer && !muxer.up);

  let pairOpen = $state(false);
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-xl font-semibold tracking-tight sm:text-2xl">设备</h1>
      <p class="mt-1 text-sm text-base-content/60">将 iPhone 无线备份到这台 NAS</p>
    </div>
    <button type="button" class="btn btn-primary btn-sm" onclick={() => (pairOpen = true)}>
      <Icon name="plug" size={14} />
      配对设备
    </button>
  </div>

  {#if muxerDown}
    <div role="alert" class="alert alert-warning alert-soft">
      <Icon name="alert" size={18} />
      <div>
        <p class="font-medium">USB/Wi-Fi 不可用</p>
        <p class="text-sm opacity-80">
          netmuxd 无响应，暂时无法连接设备。AirVault 会自动尝试重新连接。
        </p>
        {#if muxer?.error}
          <p class="mt-1 font-mono text-xs opacity-60">{muxer.error}</p>
        {/if}
      </div>
    </div>
  {/if}

  {#if showOffline}
    <EmptyState
      icon="offline"
      tone="danger"
      title="服务离线"
      message="暂时无法连接 AirVault，服务恢复后页面会自动更新。"
    />
  {:else if loadError}
    <EmptyState icon="alert" tone="danger" title="无法加载设备列表" message={loadError}>
      <button type="button" class="btn btn-primary btn-sm" onclick={() => devicesStore.refresh()}>重试</button>
    </EmptyState>
  {:else if showEmpty}
    <EmptyState
      icon="plug"
      title="尚无设备"
      message="先通过 USB 配对 iPhone，即可启用无线备份。"
    >
      <button type="button" class="btn btn-primary btn-sm" onclick={() => (pairOpen = true)}>
        <Icon name="plug" size={14} />
        开始配对
      </button>
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {#each phones as device (device.udid)}
        <DeviceTile {device} />
      {/each}
    </div>
  {/if}

  {#if devicesStore.ready && orphans.length > 0}
    <OrphanBackups {orphans} />
  {/if}
</div>

{#if pairOpen}
  <PairWizard onclose={() => (pairOpen = false)} />
{/if}
