<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // Mounted per open, so Find My is read fresh each time.
  import type { Device } from '../api/devices';
  import { now } from '../clock';
  import { formatDateTime, relativeTime } from '../format';
  import { erase, hardwareResources } from '../stores.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import FindMyAlert from './FindMyAlert.svelte';
  import Icon from './Icon.svelte';

  let { device, onclose }: { device: Device; onclose: () => void } = $props();

  // An erased phone with Find My on stays locked to its owner. An unknown state
  // never blocks: the server checks again.
  const hwRes = $derived(hardwareResources.for(device.udid));
  const findMyOn = $derived(hwRes.data?.findMyEnabled === true);
  // Erasing is confirmed by typing the phone's name, as it can't be undone.
  let typedName = $state('');

  $effect(() => {
    void hwRes.refresh();
    return hwRes.start();
  });
</script>

<ConfirmDialog
  title={`抹掉 ${device.name}?`}
  icon="alert"
  confirmLabel="抹掉 iPhone"
  busyLabel="正在抹掉……"
  confirmDisabled={findMyOn || typedName.trim() !== device.name}
  failureCode="erase_failed"
  onconfirm={() => erase(device.udid)}
  {onclose}
>
  <div class="flex flex-col gap-3 py-3 text-sm text-base-content/70">
    <p>
      此操作会抹掉所有内容和设置，相当于手机“设置 → 通用 → 传输或还原 iPhone → 抹掉所有内容和设置”，随后重启进入设置向导。手机可能先要求输入解锁密码。抹掉后该设备会离开 AirVault，再次使用需要通过 USB 重新配对。
    </p>
    {#if device.lastBackup}
      <p>
        备份仍保留在 AirVault 中，可用于恢复到其他兼容的手机。最近备份于
        <span class="font-medium text-base-content/80" title={formatDateTime(device.lastBackup)}>{relativeTime(device.lastBackup, $now)}</span>.
      </p>
    {:else}
      <div role="alert" class="alert alert-error alert-soft">
        <Icon name="alert" size={18} />
        <div>
          <p class="font-medium">这台手机尚无备份</p>
          <p class="mt-1 opacity-80">手机上的所有内容将丢失，请先备份。</p>
        </div>
      </div>
    {/if}
    {#if findMyOn}
      <FindMyAlert udid={device.udid} />
    {:else}
      <label class="flex flex-col gap-1.5">
        <span>请输入 <span class="font-medium text-base-content">{device.name}</span> 以确认</span>
        <input type="text" class="input input-sm w-full" autocomplete="off" bind:value={typedName} />
      </label>
    {/if}
  </div>
</ConfirmDialog>
