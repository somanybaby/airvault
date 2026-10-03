# 来源、修改与许可证声明 / Provenance and modification notice

Original project: AirVault, by wizier and its upstream contributors.

- Upstream repository: https://github.com/wizier/airvault
- Base commit: `a2e6f113b92fa66ea91431a5790c152e4e6e5fe4`
- Community fork: https://github.com/somanybaby/airvault
- Modified by: somanybaby
- Modification date: 2026-10-03
- License: GNU General Public License version 3 or, at your option, any later version (`GPL-3.0-or-later`). See the unchanged `LICENSE` for the full terms.

本仓库是原项目的中文社区修改版，并非原作者发布、认证或担保的官方中文版。原作者及其他贡献者的权利、原有许可证与版权声明继续保留。

Changes made on 2026-10-03:

- Translate user-facing interface text, error messages, accessibility labels and dynamic status labels into Simplified Chinese.
- Use Chinese date, relative-time and duration labels, and set the HTML language to `zh-CN`.
- Add Chinese documentation and identify the community edition with source/license links in the interface.
- Configure Compose to build this fork locally, update Docker source/license metadata, and include this notice in the image.
- Run the existing CI on the `zh-CN` branch. The backup/restore backend and API protocol are unchanged.

The program is free software: recipients may copy, modify and redistribute it under GPLv3 or later, subject to its terms. It is distributed WITHOUT ANY WARRANTY, including the implied warranties of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See sections 15 and 16 of `LICENSE`.

修改日期及摘要也标注在修改过的源码文件中。后续分发二进制或容器镜像时，分发者须按 GPL 第 6 条提供相应版本的完整对应源码；本仓库提供的构建文件与公开历史用于追溯对应版本。

Third-party components retain their own licenses. In particular, the upstream Dockerfile fetches netmuxd v0.4.3 from https://github.com/jkcoxson/netmuxd (LGPL-2.1); its source and license remain with that project. Go and npm dependencies are recorded in `go.mod`, `go.sum`, `web/package.json` and `web/package-lock.json`. This notice does not replace or relicense third-party components.
