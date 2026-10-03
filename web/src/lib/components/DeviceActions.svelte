<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import type { Device } from '../api/devices';
  import { deleteAllBackups, unpair } from '../stores.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import EraseDialog from './EraseDialog.svelte';
  import Icon from './Icon.svelte';

  let { device }: { device: Device } = $props();

  type Action = 'unpair' | 'deleteBackups' | 'erase';
  // Opening the dialog moves focus into it, which also closes the dropdown.
  let action = $state<Action | null>(null);
  let alsoDelete = $state(false);

  function open(next: Action) {
    action = next;
    alsoDelete = false;
  }
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn btn-square btn-ghost" aria-label="设备操作">
    <Icon name="more" size={18} />
  </div>
  <ul class="dropdown-content menu z-10 w-60 gap-0.5 rounded-box bg-base-100 p-2 shadow-lg">
    <li>
      <button type="button" onclick={() => open('deleteBackups')}>
        <Icon name="trash" size={15} />
        删除备份……
      </button>
    </li>
    <li>
      <button type="button" class="text-error" onclick={() => open('unpair')}>
        <Icon name="offline" size={15} />
        取消设备配对……
      </button>
    </li>
    {#if device.paired}
      <li class={device.connection === 'offline' ? 'disabled' : ''}>
        <button
          type="button"
          class="text-error"
          disabled={device.connection === 'offline'}
          title={device.connection === 'offline' ? "请通过 Wi-Fi 或 USB 连接手机后再抹掉设备" : undefined}
          onclick={() => open('erase')}
        >
          <Icon name="alert" size={15} />
          抹掉 iPhone……
        </button>
      </li>
    {/if}
  </ul>
</div>

{#if action === 'unpair'}
  <ConfirmDialog
    title={`取消配对 ${device.name}?`}
    icon="offline"
    confirmLabel="取消配对"
    busyLabel="正在处理……"
    failureCode="device_action_failed"
    onconfirm={() => unpair(device.udid, alsoDelete)}
    onclose={() => (action = null)}
  >
    <p class="py-3 text-sm text-base-content/70">
      AirVault 会请求 iPhone 忘记此主机，并从设备列表中移除该设备。如果手机当前无法连接，之后请在手机“设置 → 通用 → 传输或还原 iPhone → 还原 → 还原位置与隐私”中清除信任。再次备份前需要通过 USB 重新配对。
    </p>
    <label class="label cursor-pointer gap-3 rounded-box bg-base-200 p-3">
      <input type="checkbox" class="checkbox checkbox-sm checkbox-error" bind:checked={alsoDelete} />
      <span class="min-w-0 flex-1 whitespace-normal text-sm">
        同时删除该设备已保存的备份
        <span class="text-base-content/60">（无法撤销）</span>
      </span>
    </label>
  </ConfirmDialog>
{:else if action === 'erase'}
  <EraseDialog {device} onclose={() => (action = null)} />
{:else if action === 'deleteBackups'}
  <ConfirmDialog
    title={`删除备份： ${device.name}?`}
    icon="trash"
    confirmLabel="删除备份"
    busyLabel="正在处理……"
    failureCode="device_action_failed"
    onconfirm={() => deleteAllBackups(device)}
    onclose={() => (action = null)}
  >
    <p class="py-3 text-sm text-base-content/70">
      将删除该设备的所有恢复点。设备仍保留在 AirVault 中，可再次手动备份。此操作无法撤销。
    </p>
  </ConfirmDialog>
{/if}
