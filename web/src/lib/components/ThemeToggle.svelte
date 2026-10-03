<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // The inline script in index.html applies the saved theme before first paint;
  // this toggle must persist under the same key and theme names.
  import Icon from './Icon.svelte';

  const root = document.documentElement;
  let dark = $state(root.dataset.theme !== 'airvault');

  function toggle(): void {
    dark = !dark;
    root.dataset.theme = dark ? 'airvaultdark' : 'airvault';
    try {
      localStorage.setItem('airvault-theme', dark ? 'dark' : 'light');
    } catch {
      /* private mode / storage disabled — ignore */
    }
  }
</script>

<label
  class="btn btn-ghost btn-circle swap swap-rotate"
  title={dark ? "切换到浅色主题" : "切换到深色主题"}
>
  <input type="checkbox" checked={dark} onchange={toggle} aria-label="切换主题" />
  <Icon name="sun" size={18} class="swap-on" />
  <Icon name="moon" size={18} class="swap-off" />
</label>
