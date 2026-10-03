<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // Shown while the phone reports Find My on; the action it guards stays blocked.
  import { hardwareResources } from '../stores.svelte';
  import Icon from './Icon.svelte';

  let { udid }: { udid: string } = $props();

  const hardware = $derived(hardwareResources.for(udid));
</script>

<div role="alert" class="alert alert-warning alert-soft mt-3">
  <Icon name="alert" size={18} />
  <div class="text-sm">
    <p class="font-medium">“查找我的 iPhone”已开启</p>
    <p class="mt-1 opacity-80">请在手机上关闭此功能，然后重新检查</p>
    <p class="mt-1 opacity-80">设置 → [你的姓名] → 查找 → 查找我的 iPhone</p>
  </div>
  <button type="button" class="btn btn-ghost btn-xs" disabled={hardware.loading} onclick={() => hardware.refresh()}>
    {#if hardware.loading}<span class="loading loading-spinner loading-xs"></span>{/if}
    重新检查
  </button>
</div>
