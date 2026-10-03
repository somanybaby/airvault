<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // Backups whose phone is no longer registered stay visible so stored data
  // never lingers unnoticed.
  import { link } from 'svelte-spa-router';
  import type { Device } from '../api/devices';
  import { deleteAllBackups } from '../stores.svelte';
  import { formatBytes, formatDateTime, relativeTime, shortUdid } from '../format';
  import { deviceIcon, modelDisplayName } from '../device-ui';
  import { now } from '../clock';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import Icon from './Icon.svelte';

  let { orphans }: { orphans: Device[] } = $props();

  let pending = $state<Device | null>(null);
</script>

<section class="flex flex-col gap-3">
  <div>
    <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/50">
      未关联设备的备份
    </h2>
    <p class="mt-1 text-xs text-base-content/60">
      这些手机已不在设备列表中，但备份仍然保留。可用于迁移到新手机，也可删除以释放空间。
    </p>
  </div>
  <div class="card bg-base-100 shadow-sm">
    <ul class="divide-y divide-base-300">
      {#each orphans as orphan (orphan.udid)}
        {@const named = orphan.name !== orphan.udid}
        <li class="flex flex-wrap items-center justify-between gap-3 p-4">
          <a
            use:link
            href={`/device/${encodeURIComponent(orphan.udid)}`}
            class="flex min-w-0 items-center gap-3"
            title="查看这台手机已保存的备份"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-box bg-base-200 text-base-content/60">
              <Icon name={deviceIcon(orphan.productType)} size={17} />
            </span>
            <span class="min-w-0">
              {#if named}
                <span class="block truncate text-sm font-medium" title={orphan.name}>{orphan.name}</span>
              {:else}
                <span class="block truncate font-mono text-sm" title={orphan.udid}>{shortUdid(orphan.udid)}</span>
              {/if}
              <span class="mt-0.5 block text-xs text-base-content/60">
                {#if named}
                  {#if orphan.productType}{modelDisplayName(orphan.productType)} · {/if}<span class="font-mono" title={orphan.udid}>{shortUdid(orphan.udid)}</span> ·
                {/if}
                {orphan.restorePoints || 0} 个恢复点
                {#if orphan.diskBytes !== undefined}· {formatBytes(orphan.diskBytes)}{/if}
                {#if orphan.lastBackup}
                  · 备份于
                  <span title={formatDateTime(orphan.lastBackup)}>{relativeTime(orphan.lastBackup, $now)}</span>
                {/if}
              </span>
            </span>
          </a>
          <button
            type="button"
            class="btn btn-error btn-outline btn-xs"
            onclick={() => (pending = orphan)}
          >
            <Icon name="trash" size={13} />
            删除……
          </button>
        </li>
      {/each}
    </ul>
  </div>
</section>

{#if pending}
  {@const orphan = pending}
  <ConfirmDialog
    title={`删除备份： ${orphan.name !== orphan.udid ? orphan.name : shortUdid(orphan.udid)}?`}
    icon="trash"
    confirmLabel="删除备份"
    busyLabel="正在删除……"
    cancelLabel="保留"
    failureCode="device_action_failed"
    onconfirm={() => deleteAllBackups(orphan)}
    onclose={() => (pending = null)}
  >
    <p class="py-3 text-sm text-base-content/70">
      {orphan.restorePoints === 1 ? "唯一的恢复点" : `全部 ${orphan.restorePoints} 个恢复点`}
      将被删除{#if orphan.diskBytes !== undefined}，预计释放
        <span class="font-medium tabular-nums">{formatBytes(orphan.diskBytes)}</span> {/if}。此操作无法撤销。
    </p>
  </ConfirmDialog>
{/if}
