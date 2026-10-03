<!-- Modified by somanybaby on 2026-10-03: Chinese community documentation. See NOTICE.md; GPL-3.0-or-later. -->
# AirVault 中文社区版

将 iPhone 无线备份到自己的 NAS。此仓库是 [wizier/airvault](https://github.com/wizier/airvault) 的简体中文社区分支，由 [somanybaby](https://github.com/somanybaby) 维护汉化，并非原作者发布的官方中文版。

[上游英文说明](README.en.md) · [修改与来源声明](NOTICE.md) · [GPLv3 许可证全文](LICENSE)

## 汉化范围

管理页面默认使用简体中文，覆盖登录、USB 配对、设备列表、备份与完整性校验、恢复点管理、恢复向导、备份加密、自动备份、文件和媒体浏览、应用管理、设备操作、硬件信息及错误提示。时间和日期使用中文格式。日志原文、设备名称、文件路径、产品名称和协议标识保持原样。

备份、恢复和存储的后端实现沿用上游。本次汉化不代表已经验证实机恢复可靠性。自动备份每次仍需在手机上输入解锁密码；请区分手机解锁密码与备份加密密码。

## 快速开始

当前提供源码构建方式，尚未发布本分支的预构建镜像。原作者的 `ghcr.io/wizier/airvault` 镜像不包含这里的汉化。

在支持 Docker Compose 的 Linux / NAS 上执行：

```bash
git clone --branch zh-CN https://github.com/somanybaby/airvault.git
cd airvault
docker compose up -d --build
docker compose logs airvault
```

打开 `http://NAS地址:8080`，使用日志中显示的管理页面访问令牌登录。首次构建需要联网下载依赖，耗时取决于网络和 NAS 性能；当前 Dockerfile 面向 `linux/amd64`。

首次配对时，用支持数据传输的 USB 数据线将 iPhone 连接到运行 AirVault 的 NAS，解锁手机并确认“信任”。无线发现依赖同一局域网内的 mDNS，本项目保留上游的主机网络模式和 USB 挂载设置。群晖、飞牛等系统的 USB 访问权限仍需在各自环境中验证。

## 数据目录

| 容器路径 | 内容 | 建议位置 |
|---|---|---|
| `/config` | 设置、数据库和设备配对记录 | 持久化应用数据目录 |
| `/backups` | 备份数据 | 有足够可用空间的持久化目录 |

默认映射为项目目录下的 `./config` 和 `./backups`。请同时保留这两个目录，更新程序时不要删除。首次部署前可修改 Compose 中的左侧路径，将数据放到 NAS 的指定共享文件夹。

## 配置

可在项目目录创建 `.env`，例如：

```dotenv
TZ=Asia/Shanghai
AIRVAULT_PORT=8080
```

| 环境变量 | 默认值 | 用途 |
|---|---|---|
| `AIRVAULT_PORT` | `8080` | 管理页面端口 |
| `AIRVAULT_AUTH_TOKEN` | 自动生成 | 管理页面访问令牌，未设置时从日志读取已保存的值 |
| `AIRVAULT_LOG_LEVEL` | `info` | 程序日志级别：`debug` / `info` / `warn` / `error` |
| `AIRVAULT_MUX_LOG_LEVEL` | `warn` | netmuxd 日志级别 |
| `TZ` | `Etc/UTC` | 日志、下载备份文件名和自动备份时段使用的时区 |
| `PUID` / `PGID` | 未设置，以 root 运行 | 写入备份和设置文件的用户与组 ID |
| `UMASK` | 未设置 | 新文件的权限掩码 |

设置 `PUID`、`PGID` 或 `UMASK` 时，在 Compose 的 `environment` 中添加相应变量。它们应使用 NAS 上实际存在的用户与组；已有数据需要先处理对应目录的所有权，详见上游说明。不要把访问令牌、配对记录或备份数据提交到 GitHub。

## 备份与恢复

点击“立即备份”后，按手机提示输入解锁密码。建议启用“备份加密”并妥善保管备份密码，只有加密备份才包含健康和钥匙串数据。

恢复可从管理页面选择来源设备和恢复点；也可以将恢复点下载为 Finder 兼容的备份归档后，使用苹果官方工具恢复。新手机在设置向导中选择“从 Mac 或 PC 恢复”后连接 USB。目标系统版本不能低于备份版本，恢复前需关闭“查找我的 iPhone”。

“校验”检查已保存数据的可读性和完整性，不能替代真实恢复测试。在用它承担重要备份前，请先用备用设备验证一次完整恢复。

## 构建和检查

前端需要 Node.js 24：

```bash
cd web
npm ci
npm run check
npm run build
```

完整程序需要 Go（版本见 `go.mod`）、Node.js 和 Make；完整静态检查还需要 `golangci-lint`：

```bash
make build
make test
make lint
make check
make docker-build IMAGE=airvault-zh VERSION=zh-CN
```

`zh-CN` 分支保留上游历史，`main` 保留上游基础版本。后续同步上游时，需要复查新界面文字和冲突处的翻译。

## 开源协议与来源

原项目及本修改版继续采用 **GNU General Public License v3.0 or later（GPLv3 或后续版本）**，许可证全文保持不变。保留原作者及贡献者的权利和声明，汉化修改的日期和范围记录在 [NOTICE.md](NOTICE.md) 与修改过的文件中。

本软件不提供担保，详细免责和责任限制见 `LICENSE` 第 15、16 条。重新分发修改版须继续遵守 GPL，包括保留声明、标明修改，并在分发二进制时按协议提供对应源码。第三方依赖仍受各自许可证约束。
