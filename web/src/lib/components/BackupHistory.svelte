<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // Failed attempts are runtime events; this list holds only completed restore
  // points that still exist.
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { downloadBackup, snapshotsReclaimable, type RestorePoint } from '../api/backups';
  import { errMsg } from '../api/client';
  import type { Device } from '../api/devices';
  import { blockedReason } from '../device-ui';
  import { liveRun } from '../events.svelte';
  import { deleteRestorePoints, restorePointResources } from '../stores.svelte';
  import { formatBytes, formatDateTime, formatDuration, relativeTime } from '../format';
  import { now } from '../clock';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import EmptyState from './EmptyState.svelte';
  import ErrorLine from './ErrorLine.svelte';
  import Icon from './Icon.svelte';
  import Pill from './Pill.svelte';

  let {
    device,
    onrestore,
  }: {
    device: Device;
    /** Open the restore flow with this snapshot preselected. */
    onrestore: (snapshotId: string) => void;
  } = $props();

  const udid = $derived(device.udid);

  const points = $derived(restorePointResources.for(udid));
  $effect(() => points.start());
  const restorePoints = $derived(points.data ?? []);
  const pointsLoaded = $derived(points.ready);
  const pointsError = $derived(points.loadError('backup_history_failed'));

  const live = $derived(liveRun(udid));
  const isRunning = $derived(live !== null);
  const restoreBlocked = $derived(blockedReason(device, live));
  // Checkboxes appear only in selection mode; leaving it drops the selection.
  let selecting = $state(false);
  const selected = new SvelteSet<string>();
  let pending = $state<RestorePoint[]>([]);
  let reclaim = $state<Promise<number>>();
  // The snapshot whose download is being checked before the browser takes it.
  let downloading = $state<string | null>(null);
  let downloadError = $state<string | null>(null);

  const PAGE_SIZE = 10;
  let page = $state(1);
  const pageCount = $derived(Math.max(1, Math.ceil(restorePoints.length / PAGE_SIZE)));
  const pageStart = $derived((page - 1) * PAGE_SIZE);
  const pagePoints = $derived(restorePoints.slice(pageStart, pageStart + PAGE_SIZE));

  // The selection acts only on listed points — a refresh may have dropped some.
  // It survives paging; the header checkbox covers the open page.
  const selectedPoints = $derived(restorePoints.filter((point) => selected.has(point.snapshotId)));
  const allSelected = $derived(pagePoints.every((point) => selected.has(point.snapshotId)));

  // A deletion can shrink the list under the open page; follow it down so a
  // later backup doesn't jump the view back.
  $effect(() => {
    if (page > pageCount) page = pageCount;
  });

  // Nothing left to select (e.g. everything was deleted) ends the mode.
  $effect(() => {
    if (restorePoints.length === 0) untrack(stopSelecting);
  });

  function stopSelecting() {
    selecting = false;
    selected.clear();
  }

  function toggleAll(select: boolean) {
    for (const point of pagePoints) {
      if (select) selected.add(point.snapshotId);
      else selected.delete(point.snapshotId);
    }
  }

  function askDelete(targets: RestorePoint[]) {
    pending = targets;
    // Honest "space freed": data no kept restore point still references.
    reclaim = snapshotsReclaimable(udid, targets.map((point) => point.snapshotId));
  }

  async function confirmDelete() {
    await deleteRestorePoints(udid, pending.map((point) => point.snapshotId));
    stopSelecting();
  }

  function damageText(point: RestorePoint): string {
    return point.damage === 'manifest_unreadable'
      ? "文件清单无法读取，此恢复点只能删除"
      : `${point.damagedFiles ?? 0} 个文件无法从磁盘读取，此恢复点只能删除`;
  }

  async function download(snapshotId: string): Promise<void> {
    downloading = snapshotId;
    downloadError = null;
    try {
      await downloadBackup(snapshotId);
    } catch (err) {
      downloadError = errMsg(err, 'download_failed');
    } finally {
      downloading = null;
    }
  }
</script>

<section class="flex flex-col gap-3">
  <div class="flex min-h-6 items-center justify-between gap-2">
    <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/50">恢复点</h2>
    {#if pointsLoaded && restorePoints.length > 0}
      <div class="flex items-center gap-2">
        {#if selecting}
          <button
            type="button"
            class="btn btn-error btn-xs"
            disabled={isRunning || selectedPoints.length === 0}
            onclick={() => askDelete(selectedPoints)}
            title={isRunning ? "这台手机正在执行其他操作" : "删除选中的恢复点"}
          >
            <Icon name="trash" size={13} />
            删除所选（{selectedPoints.length}）
          </button>
          <button type="button" class="btn btn-ghost btn-xs" onclick={stopSelecting}>取消</button>
        {:else}
          <button type="button" class="btn btn-ghost btn-xs" onclick={() => (selecting = true)}>
            选择
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <ErrorLine error={downloadError} size="xs" />
  {#if pointsError}
    <ErrorLine error={pointsError} variant="alert" />
  {:else if !pointsLoaded}
    <div class="flex items-center gap-3 rounded-box bg-base-100 p-4 text-sm text-base-content/60 shadow-sm">
      <span class="loading loading-spinner loading-sm"></span>
      正在加载恢复点……
    </div>
  {:else if restorePoints.length === 0}
    <EmptyState icon="clock" title="暂无恢复点" message="完成的备份将显示在这里" />
  {:else}
    <div class="card overflow-x-auto bg-base-100 shadow-sm">
      <table class="table table-sm">
        <thead>
          <tr class="text-xs">
            {#if selecting}
              <th class="w-0">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={allSelected}
                  aria-label="选择本页所有恢复点"
                  onchange={(event) => toggleAll(event.currentTarget.checked)}
                />
              </th>
            {/if}
            <th>创建时间</th>
            <th class="hidden sm:table-cell">耗时</th>
            <th>大小</th>
            <th class="w-0"></th>
          </tr>
        </thead>
        <tbody>
          {#each pagePoints as point (point.snapshotId)}
            <tr class="hover:bg-base-200/60">
              {#if selecting}
                <td>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    checked={selected.has(point.snapshotId)}
                    aria-label="选择恢复点"
                    onchange={() =>
                      selected.has(point.snapshotId)
                        ? selected.delete(point.snapshotId)
                        : selected.add(point.snapshotId)}
                  />
                </td>
              {/if}
              <td title={formatDateTime(point.created)}>
                {relativeTime(point.created, $now)}
                {#if point.damage}
                  <span class="tooltip tooltip-error ml-1" data-tip={damageText(point)}>
                    <Pill tone="red" dot>已损坏</Pill>
                  </span>
                {/if}
              </td>
              <td class="hidden text-base-content/60 sm:table-cell">{formatDuration(point.started, point.created)}</td>
              <td class="font-mono text-xs text-base-content/60">
                <div>{formatBytes(point.sizeBytes)}</div>
                {#if point.transferredBytes !== null}
                  <div class="text-[10px] text-base-content/40" title="本次备份从手机接收的数据量">
                    {formatBytes(point.transferredBytes)} 已传输
                  </div>
                {/if}
              </td>
              <td class="whitespace-nowrap text-right">
                {#if !selecting}
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    disabled={!!restoreBlocked || !!point.damage}
                    onclick={() => onrestore(point.snapshotId)}
                    title={point.damage
                      ? "无法恢复损坏的恢复点"
                      : (restoreBlocked ?? "将此恢复点恢复到手机")}
                    aria-label="恢复此恢复点"
                  >
                    <Icon name="backup" size={13} />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    disabled={downloading !== null || !!point.damage}
                    onclick={() => download(point.snapshotId)}
                    title={point.damage
                      ? "无法下载损坏的恢复点"
                      : `下载为 Finder 备份（约 ${formatBytes(point.sizeBytes)}）`}
                    aria-label="将此恢复点下载为 Finder 备份"
                  >
                    {#if downloading === point.snapshotId}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      <Icon name="download" size={13} />
                    {/if}
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-error"
                    disabled={isRunning}
                    onclick={() => askDelete([point])}
                    title={isRunning ? "这台手机正在执行其他操作" : "删除此恢复点"}
                    aria-label="删除恢复点"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if pageCount > 1}
      <nav class="flex items-center justify-end gap-2 text-xs text-base-content/60" aria-label="恢复点分页">
        <span class="tabular-nums">
          {pageStart + 1}–{pageStart + pagePoints.length} ，共 {restorePoints.length}
        </span>
        <div class="join">
          <button
            type="button"
            class="join-item btn btn-ghost btn-xs"
            disabled={page === 1}
            onclick={() => (page -= 1)}
            aria-label="上一页"
          >
            <Icon name="chevronLeft" size={13} />
          </button>
          <button
            type="button"
            class="join-item btn btn-ghost btn-xs"
            disabled={page === pageCount}
            onclick={() => (page += 1)}
            aria-label="下一页"
          >
            <Icon name="chevronRight" size={13} />
          </button>
        </div>
      </nav>
    {/if}
  {/if}
</section>

{#if pending.length > 0}
  <ConfirmDialog
    title={pending.length > 1 ? `删除 ${pending.length} 个恢复点？` : "删除这个恢复点？"}
    icon="trash"
    confirmLabel="删除"
    busyLabel="正在删除……"
    cancelLabel="保留"
    failureCode="snapshot_delete_failed"
    onconfirm={confirmDelete}
    onclose={() => (pending = [])}
  >
    <p class="py-3 text-sm text-base-content/70">
      {#if pending.length > 1}
        所选 {pending.length} 个恢复点将被删除，其他恢复点不受影响。
      {:else}
        创建于
        <span class="font-medium">
          {formatDateTime(pending[0].created)}
        </span>
        的备份将被删除，其他恢复点不受影响。
      {/if}
    </p>
    <p class="flex items-center gap-1.5 rounded-box bg-base-200 p-3 text-sm">
      <Icon name="info" size={14} />
      {#await reclaim}
        <span class="text-base-content/60">正在计算可释放空间……</span>
      {:then bytes}
        <span>预计释放磁盘空间 <span class="font-medium tabular-nums">{formatBytes(bytes)}</span> </span>
      {:catch}
        <span class="text-base-content/60">暂时无法计算可释放空间</span>
      {/await}
    </p>
  </ConfirmDialog>
{/if}
