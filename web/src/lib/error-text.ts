// Modified by somanybaby on 2026-10-03: Simplified Chinese localization. See NOTICE.md; GPL-3.0-or-later.
// Layers exchange stable codes only; keeping copy here makes another locale a
// catalogue swap instead of an API change.
const simplifiedChinese = {
  unknown_error: "操作出错",
  network_error: "无法连接 AirVault 服务",
  invalid_response: "服务返回了无效响应",

  devices_load_failed: "无法加载设备列表",
  device_load_failed: "无法加载设备",
  sign_in_failed: "登录失败",
  current_backup_password_required: "请输入当前备份密码",
  new_backup_password_required: "请输入新备份密码",
  backup_passwords_do_not_match: "两次输入的密码不一致",

  bad_request: "请求无效",
  authentication_required: "管理页面访问令牌无效",
  forbidden: "你没有执行此操作的权限",
  not_found: "未找到请求的内容",
  method_not_allowed: "不支持此操作",
  payload_too_large: "上传的文件过大",
  unsupported_media_type: "不支持此文件类型",
  invalid_udid: "设备标识符无效",
  invalid_power_action: "请选择重启、关机或锁屏",
  bundle_id_required: "请提供应用标识符",
  invalid_bundle_id: "应用标识符无效",
  paths_required: "请至少选择一个文件",
  invalid_path: "文件路径无效",
  too_many_paths: "一次请求的文件过多",
  invalid_gallery_page: "请求的媒体分页无效",
  file_required: "请选择文件",
  invalid_thumbnail_path: "缩略图路径无效",
  ipa_required: "请选择要安装的 .ipa 文件",
  invalid_ipa: "所选文件必须是 .ipa 文件",
  backup_password_change_empty: "请输入旧备份密码和／或新备份密码",
  snapshot_required: "请选择恢复点",
  snapshot_not_found: "所选恢复点已不存在",
  backup_not_restorable: "尚未确认所选备份可用于恢复",
  backup_password_required: "此备份已加密，请输入备份密码",
  backup_ios_too_new: "此备份需要较新的 iOS，请先更新手机系统",
  upstream_error: "所需服务无响应",
  service_unavailable: "服务暂时不可用",
  internal_error: "AirVault 无法完成请求",

  device_offline: "设备离线",
  device_never_came_online:
    "手机始终未连接，请唤醒手机或通过 USB 连接后重新备份",
  device_locked: "请解锁 iPhone 后重试",
  backup_not_confirmed:
    "iPhone 未确认备份，请按手机提示输入解锁密码（提示约一分钟后关闭）",
  find_my_enabled: "请在手机上关闭“查找我的 iPhone”后重试",
  activation_lock: "激活锁已开启，请在此手机上退出关联的 Apple 账户后重试恢复",
  activation_failed: "无法通过 Apple 激活手机，请检查服务器的互联网连接后重试",
  device_timeout: "iPhone 响应超时",
  device_storage_full: "iPhone 存储空间不足，请释放空间后重试",
  device_connection_interrupted: "与 iPhone 的连接中断，请重新连接后重试",
  device_action_failed: "设备操作失败",
  erase_failed: "无法抹掉手机",
  power_request_failed: "电源操作请求失败",
  sleep_request_failed: "锁屏请求失败",
  pairing_required: "请重新配对手机后继续",
  pairing_cleanup_failed: "无法移除本地配对数据，请检查配对记录目录的权限",
  resource_busy: "其他操作正在独占此设备或备份",
  operation_cancelled: "操作已取消",
  operation_state_conflict: "操作状态已发生变化",

  pair_state_failed: "无法读取配对状态",
  pairing_failed: "配对失败",
  wifi_authorization_failed:
    "AirVault 无法完成 Wi-Fi 设置，请保持数据线连接后重试",
  pairing_registration_failed: "手机已信任 AirVault，但设备注册失败",
  pairing_timeout: "配对超时，请在手机准备就绪后重试",
  hardware_query_failed: "无法读取硬件信息",
  battery_query_failed: "无法读取电池状态",
  app_list_failed: "无法读取应用列表",
  app_install_failed: "无法安装应用",
  app_uninstall_failed: "无法卸载应用",
  app_files_failed: "无法读取应用文件",
  app_file_delete_failed: "无法删除文件",
  file_list_failed: "无法读取文件",
  file_delete_failed: "删除失败",
  media_list_failed: "无法读取手机文件",
  gallery_failed: "无法读取媒体列表",
  gallery_revision_changed: "媒体列表已变化，请从第一页重新加载",
  stat_failed: "无法读取文件信息",
  thumb_failed: "无法读取媒体缩略图",
  download_failed: "无法下载文件",
  console_stream_failed: "设备实时日志已中断",
  backup_password_change_failed: "无法修改备份密码",
  auto_backup_save_failed: "无法保存自动备份设置",
  invalid_auto_backup_interval: "请选择备份频率",
  invalid_auto_backup_window: "备份时段的开始和结束时间不能相同",

  backup_start_failed: "无法启动备份",
  backup_cancel_failed: "无法取消操作",
  backup_history_failed: "无法加载恢复点",
  snapshot_delete_failed: "无法删除恢复点",
  backup_failed: "备份失败",
  restore_start_failed: "无法启动恢复",
  restore_failed: "恢复失败",
  invalid_backup_password: "备份密码错误",
  operation_outcome_unknown: "iPhone 可能已修改备份密码，但无法确认最终状态",
  storage_full: "备份磁盘已满，请释放空间后重试",
  backup_integrity_failed: "部分备份数据无法读取，相关恢复点已标记为损坏，请检查磁盘健康状态",
  backup_damaged: "此恢复点已损坏，请执行完整性校验或将其删除",
  verify_start_failed: "无法启动完整性校验",
  verify_failed: "完整性校验失败，请检查磁盘健康状态和 AirVault 日志",
} as const satisfies Record<string, string>;

/** Keys owned by the UI. API codes remain strings because a newer backend can
 * legitimately send a code that an older SPA does not know yet. */
export type ErrorTextKey = keyof typeof simplifiedChinese;

const reportedUnknownCodes = new Set<string>();

function isErrorTextKey(code: string): code is ErrorTextKey {
  return Object.prototype.hasOwnProperty.call(simplifiedChinese, code);
}

function reportUnknownCode(code: string): void {
  if (reportedUnknownCodes.has(code)) return;
  reportedUnknownCodes.add(code);
  console.warn(`Unknown error code from API: ${code}`);
}

export function errorText(code: string, fallbackCode: ErrorTextKey = 'unknown_error'): string {
  if (isErrorTextKey(code)) return simplifiedChinese[code];
  reportUnknownCode(code);
  return simplifiedChinese[fallbackCode];
}
