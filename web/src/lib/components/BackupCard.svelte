<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import { startBackup, startVerify } from '../api/backups';
  import { errMsg } from '../api/client';
  import type { Device } from '../api/devices';
  import { cancelRun } from '../api/runs';
  import { liveRun } from '../events.svelte';
  import { errorText, type ErrorTextKey } from '../error-text';
  import { restoreSourcesStore } from '../stores.svelte';
  import { formatBytes, formatDateTime, formatSpeed, relativeTime } from '../format';
  import { now } from '../clock';
  import { autoBackupStatus, blockedReason, lastBackupFailure, stageUi } from '../device-ui';
  import AutoBackupModal from './AutoBackupModal.svelte';
  import BackupPasswordModal, { type PasswordMode } from './BackupPasswordModal.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import ErrorLine from './ErrorLine.svelte';
  import Icon from './Icon.svelte';
  import Pill from './Pill.svelte';

  let {
    device,
    onrestore,
  }: {
    device: Device;
    /** Open the restore flow with the default snapshot. */
    onrestore: () => void;
  } = $props();

  const udid = $derived(device.udid);
  const reachable = $derived(device.connection !== 'offline');
  const live = $derived(liveRun(udid));
  const isRestore = $derived(live?.restore ?? false);
  const isVerify = $derived(live?.verify ?? false);
  const isCancelling = $derived(live?.cancelling ?? false);
  const isRunning = $derived(live !== null);
  const speed = $derived(formatSpeed(live?.speed));
  const lastFailure = $derived(lastBackupFailure(device, live));
  // ChangePassword and restores talk to the same backupd that is busy during a transfer.
  const blocked = $derived(blockedReason(device, live));

  // The run whose start request is in flight.
  let starting = $state<'backup' | 'verify' | null>(null);
  let cancelRequestedFor = $state<string | null>(null);
  // The confirm dialog belongs to one run: it closes the moment that run ends
  // or starts cancelling.
  let cancelAskedFor = $state<string | null>(null);
  const cancelOpen = $derived(live !== null && cancelAskedFor === live.runId && !isCancelling);
  const cancelPending = $derived(isCancelling || cancelRequestedFor === live?.runId);
  let actionError = $state<string | null>(null);
  // The server keeps each kind's last terminal error until its next run
  // replaces or clears it; a backup's shows as the "failed" pill instead.
  const runError = $derived.by(() => {
    const errors = device.lastRunErrors;
    if (isRunning || !errors) return null;
    if (errors.restore) return errorText(errors.restore, 'restore_failed');
    return errors.verify ? errorText(errors.verify, 'verify_failed') : null;
  });

  async function start(kind: 'backup' | 'verify', failureCode: ErrorTextKey) {
    starting = kind;
    actionError = null;
    try {
      await (kind === 'backup' ? startBackup(udid) : startVerify(udid));
    } catch (error) {
      actionError = errMsg(error, failureCode);
    } finally {
      starting = null;
    }
  }

  async function cancelCurrentRun(runId: string) {
    cancelRequestedFor = runId;
    try {
      await cancelRun(runId);
    } catch (error) {
      // A terminal/cancelling SSE can legitimately beat the HTTP response.
      if (isCancelling || live?.runId !== runId) return;
      cancelRequestedFor = null;
      throw error;
    }
  }

  let passwordMode = $state<PasswordMode | null>(null);
  let autoBackupOpen = $state(false);
  const autoStatus = $derived(autoBackupStatus(device.autoBackup, $now));

  $effect(() => restoreSourcesStore.start());
  const sources = $derived(restoreSourcesStore.data ?? []);
  const sourcesLoaded = $derived(restoreSourcesStore.ready);

  const stored = $derived(sources.find((source) => source.udid === udid) ?? null);
  const hasRestoreSource = $derived(sources.some((source) => !source.damage));
  // This phone's restore points, for the integrity summary.
  const ownPoints = $derived(sources.filter((source) => source.udid === udid));
  const damagedCount = $derived(ownPoints.filter((point) => point.damage).length);
  const damageNote = $derived(
    damagedCount === 0
      ? null
      : damagedCount === ownPoints.length
        ? "没有完整的恢复点，下次将执行全量备份；可删除损坏的恢复点以释放空间"
        : "损坏的恢复点无法恢复或下载，请删除它们或重新校验",
  );
  // ISO times in UTC sort as they happen.
  const lastVerified = $derived(
    ownPoints
      .map((point) => point.verifiedAt)
      .filter((at): at is string => at !== undefined)
      .sort()
      .at(-1),
  );
</script>

<div class="card bg-base-100 shadow-sm">
  <div class="card-body gap-5 p-5">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <h2 class="flex items-center gap-2 text-sm font-semibold">
          备份
          {#if damagedCount > 0}
            <Pill tone="red" dot>{damagedCount} 已损坏</Pill>
          {:else if lastVerified}
            <span class="tooltip" data-tip={`完整性校验时间： ${relativeTime(lastVerified, $now)}`}>
              <Pill tone="green" dot>已校验</Pill>
            </span>
          {/if}
        </h2>
        {#if isRunning}
          <p class="mt-0.5 text-xs text-base-content/60">
            {isRestore
              ? "正在恢复"
              : isVerify
                ? "正在校验备份完整性"
                : "正在备份"}
          </p>
        {:else if stored}
          <p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-base-content/60">
            <span title={formatDateTime(stored.created)} class="text-base-content/80">
              备份于 {relativeTime(stored.created, $now)}
            </span>
            {#if stored.sizeBytes}<span>· {formatBytes(stored.sizeBytes)}</span>{/if}
            {#if stored.encrypted}<span>· 已加密</span>{/if}
            {#if stored.iosVersion}<span>· iOS {stored.iosVersion}</span>{/if}
            {#if lastFailure}
              <span class="tooltip tooltip-error" data-tip={lastFailure}>
                <Pill tone="red" dot>上次操作失败</Pill>
              </span>
            {/if}
          </p>
          {#if damageNote}
            <p class="mt-1 text-xs text-error">{damageNote}</p>
          {/if}
        {:else if !sourcesLoaded}
          <p class="mt-0.5 text-xs text-base-content/40">正在检查已保存的备份……</p>
        {:else}
          <p class="mt-0.5 flex items-center gap-2 text-xs text-base-content/60">
            <span>尚未备份</span>
            {#if lastFailure}
              <span class="tooltip tooltip-error" data-tip={lastFailure}>
                <Pill tone="red" dot>失败</Pill>
              </span>
            {/if}
          </p>
        {/if}
        {#if !reachable && !isRunning && device.paired}
          <p class="mt-1 flex items-center gap-1.5 text-xs text-base-content/50">
            <Icon name="offline" size={12} />
            设备离线，现在启动备份后会等待手机重新连接
          </p>
        {/if}
      </div>
      {#if cancelPending}
        <button type="button" class="btn btn-ghost btn-sm" disabled>
          <span class="loading loading-spinner loading-xs"></span>
          正在取消……
        </button>
      {:else if live}
        <button
          type="button"
          class="btn btn-ghost btn-sm text-error"
          onclick={() => (cancelAskedFor = live.runId)}
          title={isRestore
            ? "停止恢复；手机随后会提示恢复失败并重启"
            : isVerify
              ? "停止完整性校验"
              : "停止本次备份并丢弃本次接收的数据"}
        >
          <Icon name="x" size={15} />
          取消……
        </button>
      {:else}
        <div class="flex flex-wrap gap-2">
          {#if ownPoints.length > 0}
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              disabled={starting !== null}
              onclick={() => start('verify', 'verify_start_failed')}
              title="读取所有备份文件，将无法正常读取的恢复点标记为损坏"
            >
              {#if starting === 'verify'}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <Icon name="shield" size={14} />
              {/if}
              校验
            </button>
          {/if}
          {#if hasRestoreSource}
            <button
              type="button"
              class="btn btn-outline btn-sm"
              disabled={starting !== null || !!blocked}
              onclick={onrestore}
              title={blocked ?? "将已保存的备份恢复到这台手机"}
            >
              <Icon name="backup" size={14} /> 恢复……
            </button>
          {/if}
          <button
            type="button"
            class="btn btn-primary btn-sm"
            disabled={starting !== null || !device.paired}
            onclick={() => start('backup', 'backup_start_failed')}
            title={!device.paired
              ? "请先通过 USB 配对手机"
              : !reachable
                ? "手机离线，重新连接后将开始备份"
                : "更新已保存的备份（增量备份）"}
          >
            {#if starting === 'backup'}
              <span class="loading loading-spinner loading-xs"></span> 正在启动……
            {:else}
              <Icon name="backup" size={15} /> 立即备份
            {/if}
          </button>
        </div>
      {/if}
    </div>

    {#if live}
      {@const percent = live.progress}
      <div class="flex flex-col gap-2 rounded-box bg-base-200 p-3">
        <div>
          <div class="mb-1 flex items-center justify-between gap-2 text-xs">
            <span class="truncate text-base-content/60">{stageUi(live.stage, isRestore)}</span>
            {#if percent > 0}
              <span class="shrink-0 font-mono tabular-nums">{percent}%</span>
            {/if}
          </div>
          {#if percent > 0}
            <progress class="progress progress-primary" value={percent} max="100"></progress>
          {:else}
            <progress class="progress progress-primary"></progress>
          {/if}
        </div>
        {#if live.transferred > 0 || speed}
          <div class="flex items-center justify-between gap-2 font-mono text-xs tabular-nums text-base-content/60">
            <span class="truncate">
              {#if live.transferred > 0}
                {formatBytes(live.transferred)} {isVerify ? "已校验" : "已传输"}
              {/if}
            </span>
            {#if speed}<span class="shrink-0">{speed}</span>{/if}
          </div>
        {/if}
        {#if live.stage === 'waiting_for_device' && !isRestore}
          <p class="flex items-center gap-1.5 text-xs text-base-content/60">
            <Icon name="info" size={13} />
            请唤醒手机或通过 USB 连接，检测到设备后将开始备份。
          </p>
        {:else if live.stage === 'preparing' && !isRestore}
          <p class="flex items-center gap-1.5 text-xs text-base-content/60">
            <Icon name="info" size={13} />
            {live.auto
              ? "自动备份已启动，请在一分钟内在 iPhone 上输入解锁密码"
              : "请在 iPhone 上输入解锁密码以继续"}
          </p>
        {/if}
      </div>
    {/if}

    <ErrorLine error={actionError ?? runError} size="xs" />

    <div class="flex flex-col gap-3 border-t border-base-300 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="flex items-center gap-2 text-sm font-semibold">
            备份加密
            {#if device.encrypted}<Pill tone="green" dot>已开启</Pill>{:else}<Pill tone="slate" dot>已关闭</Pill>{/if}
          </p>
          <p class="mt-0.5 text-xs text-base-content/60">
            {device.encrypted
              ? "备份受手机上设置的备份密码保护"
              : "只有加密备份才包含健康和钥匙串数据"}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          {#if device.encrypted}
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              disabled={!!blocked}
              title={blocked}
              onclick={() => (passwordMode = 'change')}
            >
              修改密码……
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm text-error"
              disabled={!!blocked}
              title={blocked}
              onclick={() => (passwordMode = 'disable')}
            >
              关闭加密……
            </button>
          {:else}
            <button
              type="button"
              class="btn btn-outline btn-sm"
              disabled={!!blocked}
              title={blocked}
              onclick={() => (passwordMode = 'enable')}
            >
              <Icon name="lock" size={14} /> 设置密码……
            </button>
          {/if}
        </div>
      </div>
      {#if !reachable}
        <p class="text-xs text-base-content/50">请通过 Wi-Fi 或 USB 连接设备以管理加密设置。</p>
      {/if}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-4">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-sm font-semibold">
          自动备份
          {#if autoStatus}<Pill tone="green" dot>已开启</Pill>{:else}<Pill tone="slate" dot>已关闭</Pill>{/if}
        </p>
        {#if autoStatus}
          <p class="mt-0.5 text-xs text-base-content/60">
            <span class="text-base-content/80">{autoStatus.schedule}</span> ·
            <span title={autoStatus.at && formatDateTime(autoStatus.at)}>{autoStatus.next}</span>
          </p>
        {:else}
          <p class="mt-0.5 text-xs text-base-content/60">
            iPhone 在家中解锁后启动备份；每次都需要按 iOS 提示输入解锁密码
          </p>
        {/if}
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        disabled={!device.paired}
        title={device.paired ? undefined : "请先通过 USB 配对手机"}
        onclick={() => (autoBackupOpen = true)}
      >
        <Icon name="clock" size={14} />
        {autoStatus ? "修改……" : "设置……"}
      </button>
    </div>
  </div>
</div>

{#if cancelOpen && live}
  {@const runId = live.runId}
  <ConfirmDialog
    title={`取消本次${isRestore ? '恢复' : isVerify ? '完整性校验' : '备份'}？`}
    icon="x"
    confirmLabel={isRestore ? "停止恢复" : isVerify ? "停止校验" : "放弃本次备份"}
    busyLabel="正在取消……"
    cancelLabel="继续运行"
    failureCode="backup_cancel_failed"
    onconfirm={() => cancelCurrentRun(runId)}
    onclose={() => (cancelAskedFor = null)}
  >
    <p class="py-3 text-sm text-base-content/70">
      {#if isRestore}
        手机会停留在“正在恢复”界面，直到 iOS 终止恢复，再提示恢复失败并重启。已保存的备份不会改变。
      {:else if isVerify}
        校验将停止，已发现的损坏标记会保留。
      {:else}
        本次未完成的备份及其接收的数据将被丢弃，已有的完整恢复点不会改变。
      {/if}
    </p>
  </ConfirmDialog>
{/if}

<!-- Mounted fresh per open: per-open form state resets by remount. -->
{#if passwordMode !== null}
  <BackupPasswordModal udid={device.udid} name={device.name} mode={passwordMode} onclose={() => (passwordMode = null)} />
{/if}
{#if autoBackupOpen}
  <AutoBackupModal
    udid={device.udid}
    name={device.name}
    current={device.autoBackup}
    onclose={() => (autoBackupOpen = false)}
  />
{/if}
