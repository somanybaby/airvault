<!-- Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later. -->
<script lang="ts">
  // enable = new password, change = old + new, disable = old only. The request
  // stays in the modal so device verdicts can be corrected and retried in place.
  import { errorCode, isAbortError } from '../api/client';
  import { changeBackupPassword } from '../api/devices';
  import { errorText, type ErrorTextKey } from '../error-text';
  import ErrorLine from './ErrorLine.svelte';
  import Icon from './Icon.svelte';
  import PasswordField from './PasswordField.svelte';

  export type PasswordMode = 'enable' | 'change' | 'disable';

  let { udid, name, mode, onclose }: {
    udid: string;
    name: string;
    mode: PasswordMode;
    onclose: () => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let oldPw = $state('');
  let newPw = $state('');
  let confirmPw = $state('');
  let busy = $state(false);
  let failureCode = $state<string | null>(null);
  const failure = $derived(failureCode && errorText(failureCode, 'backup_password_change_failed'));
  let requestController: AbortController | null = null;

  const title = $derived(
    mode === 'enable'
      ? `加密备份： ${name}`
      : mode === 'change'
        ? `修改备份密码： ${name}`
        : `关闭备份加密： ${name}`,
  );

  const needsOld = $derived(mode === 'change' || mode === 'disable');
  const needsNew = $derived(mode === 'enable' || mode === 'change');

  const validationError = $derived.by<ErrorTextKey | null>(() => {
    if (needsOld && !oldPw) return 'current_backup_password_required';
    if (needsNew && !newPw) return 'new_backup_password_required';
    if (needsNew && newPw !== confirmPw) return 'backup_passwords_do_not_match';
    return null;
  });

  // Device verdicts are stable service codes; UI copy is never parsed.
  const deviceLocked = $derived(failureCode === 'device_locked' && !validationError);
  const wrongPassword = $derived(
    needsOld && failureCode === 'invalid_backup_password' && !validationError,
  );

  function close() {
    requestController?.abort();
    onclose();
  }

  async function submit() {
    if (validationError) {
      failureCode = validationError;
      return;
    }
    busy = true;
    failureCode = null;
    const controller = new AbortController();
    requestController = controller;
    try {
      await changeBackupPassword(
        udid,
        needsOld ? oldPw : '',
        needsNew ? newPw : '',
        controller.signal,
      );
      dialog.close();
    } catch (err) {
      if (isAbortError(err)) return;
      failureCode = errorCode(err, 'backup_password_change_failed');
    } finally {
      if (requestController === controller) requestController = null;
      busy = false;
    }
  }
</script>

<dialog class="modal" bind:this={dialog} {@attach (d) => d.showModal()} onclose={close}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">{title}</h3>

    {#if mode === 'enable'}
      <p class="py-3 text-sm text-base-content/70">
        加密备份包含健康和钥匙串数据。备份密码保存在手机上，用于保护之后的每次备份。
      </p>
      <div role="alert" class="alert alert-warning alert-soft">
        <Icon name="alert" size={18} />
        <p class="text-sm">
          <span class="font-medium">备份密码无法找回。</span> 忘记密码后将无法恢复加密备份。
        </p>
      </div>
    {:else if mode === 'disable'}
      <p class="py-3 text-sm text-base-content/70">
        关闭加密后，今后的备份不再包含健康和钥匙串数据。关闭加密需要输入当前备份密码。
      </p>
    {:else}
      <p class="py-3 text-sm text-base-content/70">
        请先输入当前备份密码，再输入新密码。新密码将用于今后的备份。
      </p>
    {/if}

    <div class="mt-3 flex flex-col gap-3">
      {#if needsOld}
        <PasswordField
          label="当前备份密码"
          bind:value={oldPw}
          autocomplete="current-password"
          disabled={busy}
          error={wrongPassword ? "该密码与手机上的备份密码不符" : null}
          focus={wrongPassword}
        />
      {/if}
      {#if needsNew}
        <PasswordField label="新备份密码" bind:value={newPw} autocomplete="new-password" disabled={busy} />
        <PasswordField label="确认新密码" bind:value={confirmPw} autocomplete="new-password" disabled={busy} />
      {/if}
    </div>

    {#if busy}
      <div class="mt-4 flex items-start gap-3 rounded-box bg-base-200 p-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-box bg-primary/10 text-primary">
          <Icon name="phone" size={20} />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold">请查看 iPhone</p>
          <p class="mt-0.5 text-sm text-base-content/70">
            如果手机要求确认，请输入设备解锁密码。确认后，备份密码通常会在几秒内更新。
          </p>
        </div>
        <span class="loading loading-spinner loading-sm ml-auto shrink-0 self-center"></span>
      </div>
    {:else if deviceLocked}
      <div role="alert" class="alert alert-warning alert-soft mt-3">
        <Icon name="lock" size={18} />
        <div class="text-sm">
          <p class="font-medium">iPhone 已锁定</p>
          <p class="mt-1 opacity-80">请解锁手机并保持解锁状态，然后重试。</p>
        </div>
      </div>
    {:else if !wrongPassword}
      <ErrorLine error={failure} className="mt-3" />
    {/if}

    <div class="modal-action">
      <button type="button" class="btn btn-ghost" onclick={() => dialog.close()}>取消</button>
      <button
        type="button"
        class={`btn ${mode === 'disable' ? 'btn-error' : 'btn-primary'}`}
        disabled={busy}
        onclick={submit}
      >
        {#if busy}
          <span class="loading loading-spinner loading-xs"></span>
          正在应用……
        {:else if mode === 'enable'}
          <Icon name="lock" size={15} /> 启用加密
        {:else if mode === 'change'}
          <Icon name="lock" size={15} /> 修改密码
        {:else}
          <Icon name="lock" size={15} /> 关闭加密
        {/if}
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label="关闭">关闭</button>
  </form>
</dialog>
