<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import { errMsg } from '../api/client';
  import { hardwareResources } from '../stores.svelte';
  import { formatBytes } from '../format';
  import Icon from './Icon.svelte';

  let { udid, reachable }: { udid: string; reachable: boolean } = $props();

  const res = $derived(hardwareResources.for(udid));
  $effect(() => {
    if (reachable) return res.start();
  });
  const hw = $derived(res.data);
  const loading = $derived(res.loading);
  const error = $derived(res.error ? errMsg(res.error, 'hardware_query_failed') : null);

  const diskUsed = $derived(
    hw?.diskDataCapacity && hw.diskDataAvailable !== undefined
      ? hw.diskDataCapacity - hw.diskDataAvailable
      : null,
  );
  const diskPct = $derived(
    diskUsed !== null && hw?.diskDataCapacity ? Math.round((diskUsed / hw.diskDataCapacity) * 100) : null,
  );
  const healthPct = $derived(hw?.batteryHealthPct || null);
  const tempC = $derived(
    hw?.batteryTemperature ? (hw.batteryTemperature / 100).toFixed(1) : null,
  );
  // Charge/discharge power in watts (P = V·I) — more meaningful than raw mA.
  // Positive = charging into the cell, negative = discharging.
  const watts = $derived(
    hw?.batteryAmperageMa && hw.batteryVoltageMv
      ? (hw.batteryVoltageMv / 1000) * (hw.batteryAmperageMa / 1000)
      : null,
  );

  const idRows = $derived.by(() => {
    if (!hw) return [] as { label: string; value: string; mono?: boolean; secret?: boolean }[];
    const rows: { label: string; value: string; mono?: boolean; secret?: boolean }[] = [];
    const push = (label: string, value: string | undefined, mono = false, secret = false) => {
      if (value) rows.push({ label, value, mono, secret });
    };
    push("型号标识", hw.productType, true);
    push("型号", hw.modelNumber, true);
    push("主板", hw.hardwareModel, true);
    push("地区", hw.region, true);
    push("系统构建版本", hw.buildVersion, true);
    push("序列号", hw.serial, true, true);
    push("电话号码", hw.phoneNumber, true, true);
    push("时区", hw.timeZone);
    push("Wi-Fi MAC 地址", hw.wifiMac, true, true);
    push("蓝牙 MAC 地址", hw.bluetoothMac, true, true);
    // A single SIM flows into the same identity grid so Carrier/IMEI line up
    // with the columns above; two+ SIMs render as titled sub-blocks instead.
    if ((hw.sims?.length ?? 0) === 1) {
      push("运营商", hw.sims![0].carrier);
      push('IMEI', hw.sims![0].imei, true, true);
    }
    return rows;
  });

  const sims = $derived(hw?.sims ?? []);

  // Masked until revealed so shoulder-surfing or screenshots don't leak the
  // IMEI or phone number.
  let revealed = $state(false);
</script>

<div class="card bg-base-100 shadow-sm">
  <div class="card-body gap-4 p-5">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold">硬件与存储</h2>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        disabled={!reachable || loading}
        onclick={() => res.refresh()}
        title={!reachable ? "设备离线" : "重新读取设备信息"}
      >
        {#if loading}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <Icon name="refresh" size={13} />
        {/if}
        刷新
      </button>
    </div>

    {#if error}
      <div class="flex items-center justify-between gap-3">
        <span class="flex items-center gap-2 text-sm text-error"><Icon name="alert" size={15} /> {error}</span>
        <button type="button" class="btn btn-ghost btn-sm" disabled={!reachable} onclick={() => res.refresh()}>重试</button>
      </div>
    {:else if !hw}
      <p class="text-sm text-base-content/50">
        {reachable ? "正在读取设备信息……" : "请通过 Wi-Fi 或 USB 连接设备以读取硬件信息。"}
      </p>
    {:else}
      {#if diskUsed !== null && diskPct !== null}
        <div class="flex flex-col gap-1.5">
          <div class="flex items-baseline justify-between text-sm">
            <span class="font-medium">存储空间</span>
            <span class="text-xs text-base-content/60">
              已用 {formatBytes(diskUsed)} / {formatBytes(hw.diskDataCapacity)} · 可用 {formatBytes(hw.diskDataAvailable)}
            </span>
          </div>
          <progress
            class={`progress ${diskPct >= 90 ? 'progress-error' : diskPct >= 75 ? 'progress-warning' : 'progress-primary'}`}
            value={diskPct}
            max="100"
          ></progress>
          {#if hw.diskPhotos || hw.diskMedia}
            <div class="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-base-content/50">
              {#if hw.diskPhotos}<span>照片 {formatBytes(hw.diskPhotos)}</span>{/if}
              {#if hw.diskMedia}<span>媒体 {formatBytes(hw.diskMedia)}</span>{/if}
            </div>
          {/if}
        </div>
      {/if}

      {#if healthPct !== null || hw.batteryCycles || hw.batteryMaxCapacity || hw.batteryVoltageMv || tempC || hw.batterySerial}
        <div class="flex flex-col gap-1.5 border-t border-base-300 pt-3">
          <span class="text-sm font-medium">电池</span>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {#if healthPct !== null}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">健康度</span>
                <span class={`font-medium tabular-nums ${healthPct <= 79 ? 'text-warning' : ''}`}>{healthPct}%</span>
              </div>
            {/if}
            {#if hw.batteryCycles}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">循环次数</span>
                <span class="tabular-nums">{hw.batteryCycles}</span>
              </div>
            {/if}
            {#if hw.batteryMaxCapacity}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">容量</span>
                <span class="tabular-nums">{hw.batteryMaxCapacity} mAh</span>
              </div>
            {/if}
            {#if tempC}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">温度</span>
                <span class="tabular-nums">{tempC} °C</span>
              </div>
            {/if}
            {#if hw.batteryVoltageMv}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">电压</span>
                <span class="tabular-nums">{(hw.batteryVoltageMv / 1000).toFixed(2)} V</span>
              </div>
            {/if}
            {#if watts !== null && Math.abs(watts) >= 0.05}
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">{watts > 0 ? "充电功率" : "放电功率"}</span>
                <span class={`tabular-nums ${watts > 0 ? 'text-success' : ''}`}>
                  {watts > 0 ? '+' : '−'}{Math.abs(watts).toFixed(1)} W
                </span>
              </div>
            {/if}
          </div>
          {#if hw.batterySerial}
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="text-base-content/60">序列号</span>
              {#if revealed}
                <span class="select-all break-all font-mono text-xs">{hw.batterySerial}</span>
              {:else}
                <span class="font-mono text-xs text-base-content/40">••••••</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      {#snippet idRow(label: string, value: string, mono: boolean, secret: boolean)}
        <div class="flex items-center justify-between gap-2">
          <span class="text-base-content/60">{label}</span>
          {#if secret && !revealed}
            <span class="font-mono text-xs text-base-content/40">••••••</span>
          {:else}
            <span class={`${mono ? 'font-mono text-xs' : ''} ${secret ? 'select-all' : ''} truncate`}>{value}</span>
          {/if}
        </div>
      {/snippet}

      {#if idRows.length > 0 || sims.length > 0}
        <div class="flex flex-col gap-1.5 border-t border-base-300 pt-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">设备标识</span>
            <button type="button" class="btn btn-ghost btn-xs" onclick={() => (revealed = !revealed)}>
              {revealed ? "隐藏标识" : "显示标识"}
            </button>
          </div>
          {#if idRows.length > 0}
            <div class="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {#each idRows as row (row.label)}
                {@render idRow(row.label, row.value, row.mono ?? false, row.secret ?? false)}
              {/each}
            </div>
          {/if}

          {#if sims.length > 1}
            <div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {#each sims as sim, i (i)}
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-medium text-base-content/50">
                    SIM 卡 {i + 1}{sim.slot ? ` · ${sim.slot}` : ''}
                  </span>
                  <div class="flex flex-col gap-y-1 border-l border-base-300 pl-3 text-sm">
                    {#if sim.carrier}{@render idRow("运营商", sim.carrier, false, false)}{/if}
                    {#if sim.imei}{@render idRow('IMEI', sim.imei, true, true)}{/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
