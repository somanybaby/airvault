<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import { link } from 'svelte-spa-router';
  import type { Device } from '../api/devices';
  import { now } from '../clock';
  import { connectionUi, lastBackupFailure, modelDisplayName, osName, stageUi } from '../device-ui';
  import { liveRun } from '../events.svelte';
  import { formatBytes, formatDateTime, formatSpeed, relativeTime, shortUdid } from '../format';
  import DeviceFrame from './DeviceFrame.svelte';
  import DeviceBattery from './DeviceBattery.svelte';
  import Icon from './Icon.svelte';
  import Pill from './Pill.svelte';

  let { device }: { device: Device } = $props();

  const conn = $derived(connectionUi(device.connection));
  const live = $derived(liveRun(device.udid));
  const isRunning = $derived(live !== null);
  const speed = $derived(formatSpeed(live?.speed));
  const progress = $derived(live?.progress ?? 0);
  const isRestore = $derived(live?.restore ?? false);
  const currentStage = $derived(stageUi(live?.stage, isRestore));
  const lastFailure = $derived(lastBackupFailure(device, live));

  // Discovery fills this metadata asynchronously; the shortened UDID keeps a
  // freshly Wi-Fi-registered device identifiable in the meantime.
  const subtitle = $derived(
    [
      modelDisplayName(device.productType),
      device.iosVersion && `${osName(device.productType, device.iosVersion)} ${device.iosVersion}`,
    ]
      .filter(Boolean)
      .join(' · ') || shortUdid(device.udid),
  );
</script>

{#snippet encryptionLock()}
  <span
    class={device.encrypted ? 'text-success' : 'text-warning'}
    title={device.encrypted ? "备份已加密" : "备份未加密"}
  >
    <Icon name={device.encrypted ? 'lock' : 'unlocked'} size={15} stroke={2} />
  </span>
{/snippet}

<a
  use:link
  href={`/device/${encodeURIComponent(device.udid)}`}
  class="card card-sm card-border mx-auto h-full w-full max-w-xs bg-base-100 shadow-sm transition-shadow hover:shadow-md"
>
  <figure class="flex flex-col gap-2 p-4">
    <div class="flex w-full items-center justify-between gap-3">
      <Pill tone={conn.tone}>
        <Icon name={conn.icon} size={13} stroke={2} />
        {conn.label}
      </Pill>

      <div class="flex min-w-0 items-center gap-3">
        {#if device.connection !== 'offline'}
          <DeviceBattery {device} />
        {:else if device.lastSeen}
          <span class="truncate text-xs text-base-content/50" title={formatDateTime(device.lastSeen)}>
            上次连接于 {relativeTime(device.lastSeen, $now)}
          </span>
        {/if}
      </div>
    </div>

    <DeviceFrame
      udid={device.udid}
      productType={device.productType}
      connection={device.connection}
      lockScreen={device.lockScreen}
    />

    <figcaption class="w-full text-center">
      <h2 class="card-title justify-center" title={device.name}><span class="min-w-0 truncate">{device.name}</span></h2>
      <p class="truncate text-xs text-base-content/60" title={device.udid}>{subtitle}</p>
    </figcaption>
  </figure>

  <div class="card-body">
    <section class="card card-border bg-primary/5">
      <div class="p-3">
        {#if isRunning}
          <div class="flex items-center justify-between gap-3">
            <span class="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Icon name={isRestore ? 'refresh' : 'backup'} size={14} stroke={2} />
              <span class="truncate">{currentStage}</span>
            </span>
            <span class="flex shrink-0 items-center gap-1.5">
              {#if speed}
                <span class="font-mono text-xs tabular-nums text-base-content/50">{speed}</span>
              {/if}
              {@render encryptionLock()}
            </span>
          </div>

          <div class="mt-2 flex min-h-7 items-center gap-2">
            {#if progress > 0}
              <progress class="progress progress-primary min-w-0 flex-1" value={progress} max="100"></progress>
              <span class="shrink-0 font-mono text-sm font-semibold tabular-nums">{progress}%</span>
            {:else}
              <progress class="progress progress-primary min-w-0 flex-1"></progress>
            {/if}
          </div>
        {:else}
          <div class="flex items-center justify-between gap-3 text-primary">
            <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <Icon name="backup" size={14} stroke={2} />
              最近备份
            </span>
            <span class="flex items-center gap-1.5">
              {#if lastFailure}
                <span class="tooltip tooltip-left tooltip-error" data-tip={lastFailure}>
                  <Icon name="alert" size={15} stroke={2} class="text-error" />
                </span>
              {:else if device.lastBackup}
                <Icon name="check" size={15} stroke={2} class="text-success" />
              {/if}
              {@render encryptionLock()}
            </span>
          </div>
          <div class="mt-2 flex min-h-7 items-end justify-between gap-2">
            <strong class="truncate text-lg" title={formatDateTime(device.lastBackup)}>
              {device.lastBackup
                ? relativeTime(device.lastBackup, $now)
                : device.restorePoints
                  ? "没有可用备份"
                  : "尚无备份"}
            </strong>
            {#if device.lastBackup}
              <span class="max-w-28 truncate text-xs text-base-content/50">
                {formatDateTime(device.lastBackup)}
              </span>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <div class="stats grid w-full grid-cols-2 border border-base-300 bg-base-100">
      <div class="stat">
        <div class="stat-title">占用空间</div>
        <div
          class="stat-value text-xl"
          title="所有恢复点引用的数据对象去重后的大小，不含文件清单和文件系统开销"
        >
          {device.diskBytes !== undefined ? formatBytes(device.diskBytes) : '—'}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">恢复点</div>
        <div class="stat-value text-xl" title="保留的可恢复备份数量">
          {device.restorePoints || '—'}
        </div>
      </div>
    </div>

    <div class="card-actions mt-auto items-center justify-between text-xs text-base-content/60">
      <span>查看设备</span>
      <Icon name="arrowRight" size={18} stroke={2} class="text-primary" />
    </div>
  </div>
</a>
