# hajimi-proxy-server

## Zeabur 部署说明

这不是纯前端静态站点，**不要选择 Vite Application Preset**。

本项目是「Express API + Vite 前端构建」的 Node.js 服务：
- 前端只在构建阶段使用 Vite（`pnpm build`）。
- 运行阶段必须启动 Node 进程（`pnpm start` -> `node server.js`）。

### 推荐配置

Zeabur 使用 Node.js 服务（或读取仓库中的 `zbpack.json`）：

- Build Command: `pnpm build`
- Start Command: `pnpm start`
- Node Version: `24.x`

仓库内已提供 `zbpack.json`：

```json
{
  "app_dir": "/",
  "build_command": "pnpm build",
  "start_command": "pnpm start"
}
```

如果误选 Vite Preset，平台通常会把应用当成纯前端/预览服务处理，可能导致后端 API 或启动行为异常。

## 运营问答使用方式

问答区默认使用“按思路执行”模式。每轮消息分成两个输入：

- **我的处理思路**：填写本轮必须采用的立场、流程、语气，以及明确不能出现的内容。它的优先级高于旧对话、云端人设和通用话术。
- **会员问题 / 原始素材**：填写会员原话、注单信息、截图内容或需要改写的初稿。

可选择“只给可发送回复”“分析 + 可发送回复”或“只做内部分析”。系统会先生成本轮执行计划，再检索业务资料和相关运营纠正规则，生成答案后检查是否遵循处理思路；发现偏离会自动改写。每条受约束的答案下方都能展开查看已锁定的目标、必须执行项、禁止项和校验结果。

“运营规则修正”采用追加方式保存单条规则，不会再让 AI 重写整套人设。提交纠正时应写清楚以后遇到什么情况，以及必须如何处理；被否定的旧答案不会进入检索上下文。
