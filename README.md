# Workers AI2API v2

把 **Cloudflare Workers AI** 变成 OpenAI 兼容 API 的独立网关。自带管理面板、动态模型目录，并把 Cloudflare 每天 **10,000 neurons 的免费额度**当成硬上限来记账。

> 这是 v2 的完全重写版，不再同步上游 fork。旧的 `_worker.js` 被拆成 `src/` 模块，行为、目录结构和安全模型都已重新设计。

---

## 特性

- **OpenAI 兼容**：`/v1/chat/completions`、`/v1/completions`、`/v1/embeddings`、`/v1/responses`（GPT-OSS）、`/v1/images/generations`、`/v1/audio/transcriptions`、`/v1/audio/speech`、`/v1/rerank`，以及通用 `/v1/run`。
- **Anthropic 兼容**：`/v1/messages` 与 `/v1/messages/count_tokens`，支持流式与工具调用。
- **动态模型目录**：运行时调用 Cloudflare 的模型搜索 API，并抓取官方定价文档。**没有写死的模型列表**；请求失败时才回退到内置快照。
- **只暴露免费模型**：自动识别 “需要 Workers Paid / AI Gateway 预付额度” 的模型；`/v1/models` 默认隐藏，代理层直接返回 `403 model_requires_paid_plan`。
- **免费额度硬保护**：Durable Object 按 `账号 × UTC 日期` 原子预留神经元，请求结束后按真实 usage 结算；额度不足时在调用上游之前就拒绝。
- **多账号故障转移**：每个 Cloudflare 账号独立计算额度，遇到 3036（额度耗尽）、3040（容量不足）或 5xx 自动换下一个账号。
- **价格、能力、性能排序**：每个模型都返回实时价格（USD 与 neurons）、上下文、能力标签和透明的启发式性能评分，可按 `sort=performance|price|context|name|updated` 排序。
- **管理面板**：账号、API Key、模型浏览、用量、AI Gateway、别名和性能覆盖值。
- **API Key 只存哈希**：SHA-256 存储，明文只在创建时显示一次。

---

## Workers AI 与 AI Gateway 的关系

两者是不同层，不能互相替代：

| | Workers AI | AI Gateway |
|---|---|---|
| 作用 | 真正运行模型（Cloudflare GPU / 合作模型） | 位于模型前面的代理与控制面 |
| 计费 | Neurons；每天 10,000 免费，之后 $0.011 / 1,000 neurons | 标准功能免费；可选用预付额度做统一计费 |
| 免费额度 | 10,000 neurons / 账号 / 天，00:00 UTC 重置 | **不会增加免费推理额度** |
| 主要能力 | 模型目录、推理、OpenAI 兼容接口、函数调用、批处理 | 日志、分析、缓存、限流、重试/回退、护栏、动态路由 |

本项目默认**直接调用 Workers AI**。在管理面板填入 Gateway ID 后，会在同一个上游请求上附加 `cf-aig-gateway-id` 头，从而获得 AI Gateway 的日志、缓存和分析能力；**这不会绕过 neuron 配额**，本地额度保护仍然生效。

更完整的对比见部署后的 `/docs/workers-ai-vs-ai-gateway`。

---

## 部署（推荐：Workers + Durable Object）

### 1. 准备

- 一个 Cloudflare 账号（免费计划即可）
- Node.js 20+ 与 npm
- 一个 API Token：Cloudflare Dashboard → My Profile → API Tokens → **Workers AI** 模板。  
  如果希望用量页能对账云端数据，再附加 **Account Analytics Read** 权限。

### 2. 创建 KV 并填写 ID

```bash
npm install
npx wrangler kv namespace create KV
```

把输出的 namespace id 填进 `wrangler.jsonc` 的 `kv_namespaces[0].id`（当前是占位符 `00000000000000000000000000000000`）。

### 3. 设置管理员密码

```bash
npx wrangler secret put ADMIN_PASSWORD
```

`ADMIN_PASSWORD` 未设置时，`/admin` 无法登录，`/v1` 也不会放行匿名请求。

### 4. 部署

```bash
npm run deploy
```

`wrangler.jsonc` 已声明 `QuotaGuard` Durable Object，首次部署会自动创建。打开 `https://<worker>.workers.dev/admin`：

1. 用 `ADMIN_PASSWORD` 登录；
2. 在 **Accounts** 添加 Cloudflare Account ID 和 API Token；
3. 在 **API keys** 创建 `sk-wa-…` 密钥（只显示一次）；
4. 客户端 Base URL 填 `https://<worker>.workers.dev/v1`。

### Pages 部署（可选）

```bash
npm run build
```

把生成的 `_worker.js` 上传到 Pages，并绑定 KV 变量 `KV`。  
Pages 的拖拽部署通常无法绑定 Durable Object，此时额度记账会自动回退到 KV：仍会限制额度，但并发下不是严格原子。**要获得严格保证，请使用 Workers 部署。**

---

## 绑定与环境变量

| 名称 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `KV` | KV namespace | 是 | 配置、密钥哈希、目录缓存、价格缓存、用量缓存 |
| `QUOTA` | Durable Object (`QuotaGuard`) | 强烈建议 | 原子额度预留/结算；缺失时回退 KV |
| `ADMIN_PASSWORD` | Secret | 是 | 管理面板密码 |
| `FREE_DAILY_NEURONS` | Var | 否 | 默认 `10000`，用于兜底 |
| `MAX_DAILY_NEURONS` | Var | 否 | 管理面板可设置的上限，默认 `10000`；免费计划不要调高 |

> 只有在确认自己使用付费计划时才提高 `MAX_DAILY_NEURONS`。免费计划超过 10,000 neurons 会收到 Cloudflare 错误 `3036`。

---

## 快速调用

```bash
curl https://<worker>.workers.dev/v1/models \
  -H "Authorization: Bearer $KEY"
```

```bash
curl https://<worker>.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/openai/gpt-oss-20b",
    "messages": [{"role": "user", "content": "用一句话解释 neuron 计费。"}],
    "stream": true
  }'
```

模型名支持三种写法：

1. 完整 ID：`@cf/openai/gpt-oss-20b`；
2. 唯一短名：`gpt-oss-20b`；
3. 管理面板里配置的别名，例如 `{"fast": "@cf/openai/gpt-oss-20b"}`。

响应头会带上 `x-workers-ai-model`、`x-workers-ai-account`、`x-quota-remaining`、`x-quota-limit`。

### Anthropic 客户端

Base URL 填 `https://<worker>.workers.dev`，模型名同上，使用 `x-api-key` 或 Bearer 均可：

```bash
curl https://<worker>.workers.dev/v1/messages \
  -H "x-api-key: $KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/openai/gpt-oss-20b",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## 模型目录与性能评分

目录按以下顺序构建：

1. `GET /accounts/{id}/ai/models/search?format=openrouter`（实时模型 + 实时价格）；
2. 官方定价文档 `developers.cloudflare.com/workers-ai/platform/pricing/index.md`（价格与“仅付费”列表）；
3. 仓库内的 `src/data/catalog-snapshot.js`（离线兜底与字段补全）。

可用 `npm run sync:catalog` 从官方文档重新生成快照（不需要 Cloudflare 凭据）。

性能评分是**公开的启发式估计**，由参数量、能力（reasoning / tools / vision / structured output）、上下文长度、发布时间和价格档位加权得到，分为 S/A/B/C/D 五档。它不是第三方 benchmark。你可以在管理面板的 **Performance overrides** 中用自己的评测分数覆盖（模型 ID → 0–100），覆盖值会占 45% 权重。

`/v1/models` 只返回免费模型；管理员在面板中可以看到付费模型及其 `requires_paid` 标记。`?include_paid=1` 仅对已登录管理员生效。

---

## 免费额度是怎么守住的

1. **估算**：按约 3.6 字符/token、每张图片 850 token 保守估算 prompt，再结合 `max_tokens`（或默认输出上限）和模型实时 neuron 单价计算预留量。原生 `/v1/run` 任务按输入大小预留，最低 1,000 neurons；图片、语音、转录按步数/字符数/时长估算。
2. **预留**：`QuotaGuard` 在调用上游之前原子检查 `used + reserved + estimate ≤ limit`。失败则换账号；全部账号失败返回 `429 insufficient_quota`。
3. **调用**：上游返回 3036 时立即把该账号当天额度标记为耗尽；其他可重试错误自动切换账号。
4. **结算**：按响应中的 `usage` 计算真实 neurons，释放多余预留。流式响应在流结束时结算。
5. **对账**：用量页可通过 Cloudflare GraphQL `aiInferenceAdaptiveGroups` 读取云端真实用量，并取本地与云端的较大值。

如果 Worker 在“预留”和“结算”之间崩溃，预留会保留到 UTC 跨天，属于安全方向（宁可少花，不会超花）。估算本身偏保守，因此偶尔会比实际更早触发额度保护。

---

## 错误码

| HTTP | `error.code` | 含义 |
|---|---|---|
| 401 | `invalid_api_key` | 缺少/错误密钥，或没有任何密钥且未开启公开访问 |
| 403 | `model_requires_paid_plan` | 模型需要 Workers Paid 或 AI Gateway 预付额度 |
| 404 | `model_not_found` | 模型不在当前免费目录中 |
| 429 | `insufficient_quota` | 所有账号当天额度耗尽，或单次请求估算超过日额度 |
| 429 | `capacity_exceeded` | Workers AI 临时容量不足（3040） |
| 502 | `upstream_error` | Cloudflare 返回异常错误 |

---

## 安全说明

- API Key 以 SHA-256 哈希存储，明文只在创建时返回；`lastUsedAt` 最多每 10 分钟更新一次。
- 管理会话是 `ADMIN_PASSWORD` 的 SHA-256 令牌，写入 `HttpOnly; SameSite=Strict` Cookie；HTTPS 下自动加 `Secure`。
- 默认 `allowPublic=false`：没有 API Key 时拒绝匿名访问。公开部署前请务必创建密钥。
- 所有密钥都应通过 `wrangler secret put` 或面板配置，不要写进 `wrangler.jsonc` 或提交到 Git。
- 响应带 CSP、`X-Content-Type-Options: nosniff`、`Referrer-Policy`；CORS 仅回显请求的 Origin。

---

## 开发

```bash
npm install
npm run dev        # 本地 wrangler dev
npm test           # 65 个单元 + 集成测试（Workers 运行时）
npm run check      # 测试 + 构建
npm run build      # 生成单文件 _worker.js（Pages 用）
```

目录结构：

```
src/
  index.js          路由、鉴权、错误映射
  config.js         KV 配置、旧版迁移
  auth.js           API Key / 管理员会话
  quota.js          预留、结算、对账、估算
  quota-do.js       QuotaGuard Durable Object
  usage.js          云端 GraphQL 用量与本地汇总
  catalog/          实时目录、定价解析、归一化、排序
  proxy/            推理、chat、responses、embeddings、媒体、音频、Anthropic
  ui/               首页、管理面板、文档页
  data/             生成的模型快照
test/               Vitest Workers 集成测试
scripts/            构建与目录同步
```

测试使用 `@cloudflare/vitest-plugin`，在真实的 Workers 运行时（Miniflare）中执行，并覆盖鉴权、目录过滤、流式结算、3036 耗尽、管理接口与 Durable Object 并发语义。

---

## 项目来源与许可

本项目是 [WorkersAI2API](https://github.com/tiengming/WorkersAI2API) 的独立 v2 重写，不再跟踪或自动同步上游。原项目及其贡献者的 MIT 署名保留在 `LICENSE` 中。

Workers AI 模型、价格、额度与错误码均属于 Cloudflare，并可能随时变化；本项目不隶属于 Cloudflare。
