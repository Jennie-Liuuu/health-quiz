# 健康测评系统 - API 文档

> 完整的 RESTful API 文档，包含所有接口的请求/响应格式、状态码和错误处理。

## 📍 基础信息

| 项目 | 内容 |
|------|------|
| **Base URL (生产)** | `https://health-quiz-production.up.railway.app` |
| **Base URL (本地)** | `http://localhost:3001` |
| **认证方式** | 请求头 `x-session-id`（前端自动管理） |
| **请求格式** | `application/json` |
| **响应格式** | `application/json` |

### 认证说明

所有接口通过 `x-session-id` 请求头识别用户身份。

- 首次调用 `/api/step/gender` 时，后端会返回一个 `sessionId`
- 前端需在后续所有请求中携带此 ID（通过请求头 `x-session-id`）
- 前端 API 客户端已自动处理此逻辑

### 通用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误（验证失败） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 接口列表

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/step/gender` | 保存性别和目标 | 否 |
| POST | `/api/step/body` | 保存身体数据 | 否 |
| POST | `/api/step/frequency` | 保存运动频率 | 否 |
| GET | `/api/progress` | 获取已填进度 | 否 |
| GET | `/api/result` | 获取测评结果 | 是 |
| POST | `/api/pay` | 模拟支付 | 否 |
| GET | `/health` | 健康检查 | 否 |

---

## 详细接口说明

### 1. POST /api/step/gender

保存用户性别和目标。

#### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `gender` | string | ✅ | `female` \| `male` \| `other` |
| `goal` | string | ✅ | `lose_weight` \| `build_muscle` \| `keep_fit` |
| `sessionId` | string | ❌ | 可选，用于恢复已有会话 |

#### 请求示例

```bash
curl -X POST https://health-quiz-production.up.railway.app/api/step/gender \
  -H "Content-Type: application/json" \
  -d '{"gender":"female","goal":"lose_weight"}'

响应示例
成功 (200)：
{
  "sessionId": "abc-123-def",
  "message": "Step 1 saved"
}
失败 (400)：
{
  "error": "无效的性别"
}
错误码
状态码	错误信息	说明
400	无效的性别	gender 不在允许值范围内
400	无效的目标	goal 不在允许值范围内
500	服务器错误	数据库或其他服务器错误

### 2. POST /api/step/body
保存用户身体数据。
#### 请求体
字段	类型	必填	说明
sessionId	string	✅	用户会话标识
age	number	✅	10-120
height	number	✅	50-300 (cm)
weight	number	✅	20-500 (kg)
targetWeight	number	✅	20-500 (kg)

#### 请求示例
curl -X POST https://health-quiz-production.up.railway.app/api/step/body \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc-123-def","age":28,"height":165,"weight":65,"targetWeight":55}'

#### 响应示例:
成功 (200)：
{
  "message": "Step 2 saved"
}
失败 (400)：
{
  "error": "年龄必须在10-120之间"
}
错误码
状态码	错误信息	说明
400	缺少 sessionId	未提供 sessionId
400	年龄必须在10-120之间	age 超出范围
400	身高必须在50-300cm之间	height 超出范围
400	体重必须在20-500kg之间	weight 超出范围
400	目标体重必须在20-500kg之间	targetWeight 超出范围
500	服务器错误	数据库或其他服务器错误

### 3、POST /api/step/frequency
保存用户运动频率。
### 请求体
字段	类型	必填	说明
sessionId	string	✅	用户会话标识
frequency	string	✅	1-2 | 3-4 | 5+

### 请求示例
curl -X POST https://health-quiz-production.up.railway.app/api/step/frequency \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc-123-def","frequency":"3-4"}'

#### 响应示例
成功 (200)：
{
  "message": "Step 3 saved"
}
失败 (400)：
{
  "error": "无效的运动频率"
}
#### 错误码
状态码	错误信息	说明
400	缺少 sessionId	未提供 sessionId
400	无效的运动频率	frequency 不在允许值范围内
500	服务器错误	数据库或其他服务器错误

#### 4. GET /api/progress
获取用户已填写的进度数据。用于页面刷新后恢复进度。
#### 请求头
字段	类型	必填	说明
x-session-id	string	✅	用户会话标识

#### 请求示例
curl -X GET https://health-quiz-production.up.railway.app/api/progress \
  -H "x-session-id: abc-123-def"
#### 响应示例
用户存在 (200)：
{
  "exists": true,
  "step1_completed": true,
  "step2_completed": true,
  "step3_completed": false,
  "data": {
    "gender": "female",
    "goal": "lose_weight",
    "age": 28,
    "height": 165,
    "weight": 65,
    "targetWeight": 55,
    "frequency": null
  }
}
用户不存在 (200)：
{
  "exists": false
}
#### 错误码
状态码	错误信息	说明
400	缺少 sessionId	未提供 x-session-id
500	服务器错误	数据库或其他服务器错误

#### 5. GET /api/result
获取测评结果。此接口包含鉴权逻辑，会员和非会员返回不同内容。
#### 请求头
字段	类型	必填	说明
x-session-id	string	✅	用户会话标识
#### 请求示例
curl -X GET https://health-quiz-production.up.railway.app/api/result \
  -H "x-session-id: abc-123-def"

#### 响应示例
非会员响应 (200)：
{
  "isSubscribed": false,
  "data": {
    "bmi": 23.9,
    "message": "订阅解锁完整数据，包括目标日期和个性化计划"
  },
  "upgradePrompt": "升级到会员查看完整结果"
}
会员响应 (200)：
{
  "isSubscribed": true,
  "data": {
    "bmi": 23.9,
    "dailyCalories": 1380,
    "targetDate": "2026-09-20T00:00:00.000Z",
    "weight": 65,
    "targetWeight": 55,
    "weeklyPlan": "个性化运动计划（会员专属）"
  }
}
#### 字段说明
字段	非会员	会员	说明
bmi	✅	✅	身体质量指数
message	✅	❌	升级提示信息
upgradePrompt	✅	❌	升级引导文案
dailyCalories	❌	✅	每日建议摄入量 (kcal)
targetDate	❌	✅	目标达成预测日期
weight	❌	✅	当前体重
targetWeight	❌	✅	目标体重
weeklyPlan	❌	✅	个性化运动计划
#### 错误码
状态码	错误信息	说明
400	缺少 sessionId	未提供 x-session-id
404	用户不存在	sessionId 无效
400	数据不完整，请完成所有步骤	用户未完成全部步骤
500	服务器错误	数据库或其他服务器错误

#### 6. POST /api/pay
模拟支付回调，将会员状态更新为 active。
#### 请求体
字段	类型	必填	说明
sessionId	string	✅	用户会话标识
#### 请求示例
curl -X POST https://health-quiz-production.up.railway.app/api/pay \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc-123-def"}'
#### 响应示例
成功 (200)：
{
  "success": true,
  "message": "支付成功，已开通会员",
  "subscriptionStatus": "active"
}
失败 (400)：
{
  "error": "缺少 sessionId"
}
#### 错误码
状态码	错误信息	说明
400	缺少 sessionId	未提供 sessionId
500	服务器错误	数据库或其他服务器错误


#### 7. GET /health
健康检查接口，用于验证后端服务是否正常运行。
#### 请求示例
curl https://health-quiz-production.up.railway.app/health
#### 响应示例
成功 (200)：
{
  "status": "ok",
  "timestamp": "2026-08-30T12:00:00.000Z"
}