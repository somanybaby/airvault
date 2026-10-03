<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  let {
    label,
    icon,
    on = false,
    offLabel,
  }: {
    label: string;
    icon: IconName;
    on?: boolean;
    offLabel?: string;
  } = $props();
</script>

<span
  title={on ? label : (offLabel ?? `${label}：已关闭`)}
  class={`badge badge-sm gap-1 ${on ? 'badge-soft badge-primary' : 'badge-ghost'}`}
>
  <Icon name={on ? icon : 'x'} size={12} stroke={2} />
  {on ? label : (offLabel ?? label)}
</span>
