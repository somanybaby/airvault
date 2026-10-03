<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // A phone leaves usbDevices the moment it pairs; devicesStore then owns its
  // state. The host mounts this only while open, so the pair-state fetch and SSE
  // reactions are scoped to the visible flow.
  import { push } from 'svelte-spa-router';
  import { pairStateStore, devicesStore } from '../stores.svelte';
  import { onPairTrust } from '../events.svelte';
  import { errorCode } from '../api/client';
  import { errorText } from '../error-text';
  import { startTrust as startTrustRequest } from '../api/pairing';
  import Icon from './Icon.svelte';
  import Pill from './Pill.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let dialog: HTMLDialogElement;

  function openDevicePage(udid: string) {
    dialog.close();
    push(`/device/${encodeURIComponent(udid)}`);
  }

  $effect(() => pairStateStore.start());
  $effect(() => devicesStore.start());

  const ps = $derived(pairStateStore.data);
  const usbDevices = $derived(ps?.usbDevices ?? []);
  const muxerOffline = $derived(pairStateStore.ready && ps?.muxerReady === false);
  const backendOffline = $derived(pairStateStore.offline && !pairStateStore.ready);
  const loadError = $derived(pairStateStore.loadError('pair_state_failed'));
  const loading = $derived(!pairStateStore.ready && pairStateStore.error === null);

  let step = $state(1);
  let selectedUdid = $state<string | null>(null);

  // Auto-select the lone USB device. An empty list keeps the selection — the
  // step-2 replug retry still needs its target after an unplug.
  $effect(() => {
    if (!selectedUdid && usbDevices.length === 1) selectedUdid = usbDevices[0].udid;
    if (selectedUdid && step === 1 && usbDevices.length > 0 && !usbDevices.some((d) => d.udid === selectedUdid)) {
      selectedUdid = usbDevices.length === 1 ? usbDevices[0].udid : null;
    }
  });

  const selectedUsb = $derived(usbDevices.find((d) => d.udid === selectedUdid) ?? null);
  // Name source once the phone pairs and leaves usbDevices.
  const registered = $derived(
    (devicesStore.data ?? []).find((d) => d.udid === selectedUdid) ?? null,
  );
  const selectedName = $derived(selectedUsb?.name ?? registered?.name ?? "你的 iPhone");

  // A plugged-in phone that's already paired never shows in the pick list; say
  // so instead of a misleading endless "waiting" spinner.
  const pairedOnUsb = $derived(
    (devicesStore.data ?? []).filter((d) => d.connection === 'usb' && d.paired),
  );

  // The trust flow runs SERVER-side: one POST starts it, and every status
  // transition arrives as a pair.trust SSE event (see events.svelte.ts).
  type TrustState =
    | { kind: 'starting' }
    | { kind: 'pending' } // dialog is up on the phone
    | { kind: 'locked' } // phone must be unlocked first
    | { kind: 'denied' } // user tapped "Don't Trust"
    | { kind: 'error'; code: string };
  let trust = $state<TrustState>({ kind: 'starting' });
  const trustError = $derived(trust.kind === 'error' ? errorText(trust.code, 'pairing_failed') : null);
  const wifiAuthorizationFailed = $derived(trust.kind === 'error' && trust.code === 'wifi_authorization_failed');

  async function startTrust(udid: string) {
    trust = { kind: 'starting' };
    try {
      await startTrustRequest(udid);
    } catch (err) {
      trust = { kind: 'error', code: errorCode(err, 'pairing_failed') };
    }
  }

  function goPair() {
    if (!selectedUdid) return;
    step = 2;
    void startTrust(selectedUdid);
  }

  $effect(() =>
    onPairTrust((event) => {
      if (step !== 2 || event.udid !== selectedUdid) return;
      switch (event.status) {
        case 'paired':
          step = 3;
          break;
        case 'trust_pending':
          trust = { kind: 'pending' };
          break;
        case 'locked':
          trust = { kind: 'locked' };
          break;
        case 'denied':
          trust = { kind: 'denied' };
          break;
        default:
          trust = { kind: 'error', code: event.errorCode ?? 'pairing_failed' };
      }
    }),
  );

  // After "Don't Trust", iOS won't show the dialog again on the same USB
  // session — watch presence and restart the flow when the cable is replugged.
  let unplugSeen = false; // non-reactive
  $effect(() => {
    const present = !!selectedUsb;
    if (step !== 2 || trust.kind !== 'denied' || !selectedUdid) {
      unplugSeen = false;
      return;
    }
    if (!present) {
      unplugSeen = true;
    } else if (unplugSeen) {
      unplugSeen = false;
      void startTrust(selectedUdid);
    }
  });

  const stepMeta = [
    { n: 1, label: "连接" },
    { n: 2, label: "配对" },
    { n: 3, label: "完成" },
  ];
</script>

<dialog class="modal" bind:this={dialog} {@attach (d) => d.showModal()} {onclose}>
  <div class="modal-box max-w-2xl">
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-bold">配对 iPhone</h3>
          <p class="mt-0.5 text-sm text-base-content/60">
            首次通过 USB 配对，之后可通过 Wi-Fi 连接手机
          </p>
        </div>
        <button type="button" class="btn btn-square btn-ghost btn-sm" aria-label="关闭" onclick={() => dialog.close()}>
          <Icon name="x" size={16} />
        </button>
      </div>

      {#if backendOffline}
        <div role="alert" class="alert alert-error alert-soft">
          <Icon name="offline" size={18} />
          <span>暂时无法连接 AirVault 服务，服务恢复后配对向导会自动继续。</span>
        </div>
      {:else if loadError}
        <div role="alert" class="alert alert-error alert-soft">
          <Icon name="alert" size={18} />
          <div class="flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => pairStateStore.refresh()}>重试</button>
          </div>
        </div>
      {:else if loading}
        <div class="flex items-center gap-3 rounded-box bg-base-200 p-4 text-sm text-base-content/60">
          <span class="loading loading-spinner loading-sm"></span>
          正在查找设备……
        </div>
      {:else if muxerOffline}
        <div role="alert" class="alert alert-warning alert-soft">
          <Icon name="alert" size={20} />
          <div>
            <h4 class="font-semibold">USB/Wi-Fi 不可用</h4>
            <div class="text-sm opacity-90">
              netmuxd 无响应，暂时无法检测 USB 设备。服务恢复后此页面会自动更新。
            </div>
          </div>
        </div>
      {:else}
        <ul class="steps w-full">
          {#each stepMeta as m (m.n)}
            <li class={`step ${m.n <= step ? 'step-primary' : ''}`} data-content={m.n < step ? '✓' : undefined}>
              <span class="text-xs">{m.label}</span>
            </li>
          {/each}
        </ul>

        <div class="min-h-52">
          {#if step === 1}
            <div class="flex flex-col gap-4">
              <div>
                <h4 class="text-lg font-semibold">将 iPhone 连接到这台服务器的 USB 接口</h4>
                <p class="mt-1 text-sm text-base-content/60">
                  iOS 要求首次配对使用数据线，完成后即可尝试无线连接
                </p>
              </div>

              {#if usbDevices.length === 0}
                <div class="flex items-center gap-3 rounded-box bg-base-200 p-4">
                  <span class="loading loading-spinner loading-sm text-primary"></span>
                  <p class="text-sm font-medium">正在等待 USB 设备……</p>
                </div>
                {#if pairedOnUsb.length > 0}
                  <div role="alert" class="alert alert-info alert-soft">
                    <Icon name="info" size={18} />
                    <p class="text-sm">
                      <span class="font-medium">{pairedOnUsb[0].name}</span>
                      {pairedOnUsb.length > 1 ? ` 及另外 ${pairedOnUsb.length - 1} 台设备` : ""} 已经配对，请在设备列表中管理。此处只显示尚未配对的手机。
                    </p>
                  </div>
                {/if}
                <ul class="ml-4 list-disc space-y-1.5 text-sm text-base-content/60 marker:text-base-content/50">
                  <li>请使用支持数据传输的数据线。</li>
                  <li>请解锁手机，锁定的手机可能无法检测到。</li>
                  <li>如果未检测到设备，请尝试其他 USB 接口。</li>
                </ul>
              {:else if usbDevices.length === 1}
                <div class="flex items-center gap-3 rounded-box bg-base-200 p-4">
                  <span class="flex h-9 w-9 items-center justify-center rounded-box bg-primary/10 text-primary"><Icon name="phone" size={18} /></span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold">{usbDevices[0].name}</p>
                    <p class="text-xs text-base-content/60">已通过 USB 连接</p>
                  </div>
                  <span class="ml-auto"><Pill tone="green" dot>已就绪</Pill></span>
                </div>
              {:else}
                <div>
                  <p class="mb-2 text-sm font-medium">检测到多个设备，请选择要配对的设备：</p>
                  <div class="flex flex-col gap-2">
                    {#each usbDevices as d (d.udid)}
                      <label
                        class={`flex cursor-pointer items-center gap-3 rounded-box border p-3 text-sm transition-colors ${
                          selectedUdid === d.udid ? 'border-primary bg-primary/5' : 'border-base-300 hover:bg-base-200'
                        }`}
                      >
                        <input type="radio" name="usb-device" value={d.udid} bind:group={selectedUdid} class="radio radio-primary radio-sm" />
                        <Icon name="phone" size={16} class="text-primary" />
                        <span class="min-w-0 truncate font-medium">{d.name}</span>
                      </label>
                    {/each}
                  </div>
                </div>
              {/if}

              <div>
                <button type="button" class="btn btn-primary" disabled={!selectedUsb} onclick={goPair}>
                  继续 <Icon name="arrowRight" size={15} />
                </button>
              </div>
            </div>

          {:else if step === 2}
            <div class="flex flex-col gap-4">
              <div>
                {#if wifiAuthorizationFailed}
                  <h4 class="text-lg font-semibold">USB 配对完成</h4>
                  <p class="mt-1 text-sm text-base-content/60">
                    iPhone 已信任 AirVault，无需再次确认信任
                  </p>
                {:else}
                  <h4 class="text-lg font-semibold">在 iPhone 上点击“信任”</h4>
                  <p class="mt-1 text-sm text-base-content/60">
                    手机上会显示“要信任此电脑吗？”提示，请点击
                    <span class="font-medium text-base-content">信任</span> 并输入手机解锁密码
                  </p>
                {/if}
              </div>

              {#if trust.kind === 'starting'}
                <div class="flex items-center gap-3 rounded-box bg-base-200 p-4">
                  <span class="loading loading-spinner loading-sm text-primary"></span>
                  <p class="text-sm font-medium">正在请求手机配对……</p>
                </div>
              {:else if trust.kind === 'pending'}
                <div class="flex items-center gap-3 rounded-box bg-base-200 p-4">
                  <span class="loading loading-spinner loading-sm text-primary"></span>
                  <p class="text-sm font-medium">正在等待你在手机上点击“信任”……</p>
                </div>
              {:else if trust.kind === 'locked'}
                <div role="alert" class="alert alert-warning alert-soft">
                  <Icon name="lock" size={18} />
                  <div>
                    <p class="font-medium">请解锁 iPhone</p>
                    <p class="mt-1 text-sm opacity-80">解锁后手机会显示信任提示，此页面将自动继续。</p>
                  </div>
                </div>
              {:else if trust.kind === 'denied'}
                <div role="alert" class="alert alert-warning alert-soft">
                  <Icon name="alert" size={18} />
                  <div>
                    <p class="font-medium">你在手机上点击了“不信任”</p>
                    <p class="mt-1 text-sm opacity-80">
                      iOS 不会在当前连接中再次询问。 <span class="font-medium">请拔下 USB 数据线，再重新连接</span> ，手机会重新显示信任提示，此处将自动继续配对。
                    </p>
                  </div>
                </div>
                <div>
                  <button type="button" class="btn btn-ghost btn-sm" onclick={() => selectedUdid && startTrust(selectedUdid)}>
                    <Icon name="refresh" size={14} /> 再次请求
                  </button>
                </div>
              {:else if trust.kind === 'error'}
                <div role="alert" class="alert alert-error alert-soft">
                  <Icon name="alert" size={18} />
                  <p class="font-medium">{trustError}</p>
                </div>
                <div>
                  <button type="button" class="btn btn-primary" onclick={() => selectedUdid && startTrust(selectedUdid)}>
                    <Icon name="refresh" size={15} />
                    {wifiAuthorizationFailed ? "重试 Wi-Fi 设置" : "重试"}
                  </button>
                </div>
              {/if}
            </div>

          {:else}
            <div class="flex flex-col items-center gap-4 py-4 text-center">
              <span class="flex h-14 w-14 items-center justify-center rounded-box bg-success/10 text-success">
                <Icon name="check" size={30} stroke={2.2} />
              </span>
              <div>
                <h4 class="text-lg font-semibold">配对成功！</h4>
                <p class="mx-auto mt-1 max-w-md text-sm text-base-content/60">
                  <span class="font-medium text-base-content">{selectedName}</span> 已连接到 AirVault，可以拔下数据线
                </p>
              </div>
              <div class="mt-1 flex flex-wrap justify-center gap-2">
                <button type="button" class="btn btn-primary" onclick={() => openDevicePage(selectedUdid!)}>
                  <Icon name="phone" size={15} /> 查看设备
                </button>
                <button type="button" class="btn btn-ghost" onclick={() => dialog.close()}>关闭</button>
              </div>
            </div>
          {/if}
        </div>

        {#if step === 2}
          <div class="flex items-center justify-between border-t border-base-300 pt-3">
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => (step -= 1)}>返回</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => dialog.close()}>取消</button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label="关闭">关闭</button>
  </form>
</dialog>
