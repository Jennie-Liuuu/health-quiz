
## 🚀 本地启动

### 环境要求

- Node.js >= 18
- PostgreSQL (本地或云端)

### 第1步：克隆代码

```bash
git clone https://github.com/Jennie-Liuwu/health-quiz.git
cd health-quiz

### 第2步：启动后端

cd backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写DATABASE_URL

# 创建数据库表
npx prisma db push

# 启动开发服务器
npm run dev

### 第3步：启动前端
cd frontend
npm install
npm run dev

### 第4步：访问
浏览器打开 http://localhost:5173 开始使用

### 运行所有测试
cd backend
npm test

### 测试代码覆盖范围
1. 健康评估算法单元测试 (algorithm.test.ts) — 15 个测试
测试场景	测试内容	覆盖情况
正常场景	女性减重：BMI、每日摄入量、目标日期计算	✅
男性增肌：BMI、每日摄入量计算	✅
边界场景	身高恰好 50cm	✅
身高恰好 300cm	✅
年龄恰好 10 岁	✅
年龄恰好 120 岁	✅
非法输入	身高为 0	✅
身高为负数	✅
体重为 0	✅
目标体重为负数	✅
年龄小于 10 岁	✅
年龄大于 120 岁	✅
极端情况	极度偏瘦（BMI < 15）	✅
极度超重（BMI > 35）	✅
大幅减重目标（30kg）	✅

2. 分步保存 + 进度恢复集成测试 (step.test.ts) — 11 个测试
测试场景	测试内容	覆盖情况
正常流程	完整走完三步并保存所有数据	✅
进度恢复	中途离开后恢复已保存进度	✅
乱序提交	缺少 sessionId 被拒绝	✅
无效性别被拒绝	✅
无效目标被拒绝	✅
无效运动频率被拒绝	✅
重复提交	幂等性（同一用户重复提交）	✅
并发更新	多个请求同时更新同一用户	✅
边界值	年龄 10 岁（最小有效值）	✅
年龄小于 10 岁被拒绝	✅
身高小于 50cm 被拒绝	✅

3. 鉴权差异化返回测试 (result.test.ts) — 8 个测试
测试场景	测试内容	覆盖情况
非会员脱敏	不返回 targetDate、weeklyPlan	✅
看到升级提示	✅
会员完整数据	支付后返回完整数据	✅
状态持久化	支付状态在数据库中持久化	✅
错误处理	缺少 sessionId 被拒绝	✅
不存在的 sessionId 被拒绝	✅
数据不完整的用户被拒绝	✅
安全验证	非会员无法获取被保护字段	✅

4. 支付回调 + 端到端验证 (pay.test.ts) — 6 个测试
测试场景	测试内容	覆盖情况
正常支付	支付成功，会员状态更新为 active	✅
端到端验证	支付后结果从"脱敏"变为"完整"	✅
错误处理	缺少 sessionId 被拒绝	✅
不存在的 sessionId 被拒绝	✅
重复支付	重复支付状态保持 active	✅
数据完整性	支付后所有字段完整	✅

### 运行结果为：
Test Files  4 passed (4)
Tests       40 passed (40)

## /pay接口的curl：
curl -X POST https://health-quiz-production.up.railway.app/api/pay \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"efd0a36c-5d14-4dc3-bc33-179aa109fff8"}'

Postman Collection：
{
  "info": {
    "name": "健康测评系统 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Step 1 - 保存性别和目标",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"gender\":\"female\",\"goal\":\"lose_weight\"}"
        },
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/step/gender",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "step", "gender"]
        }
      }
    },
    {
      "name": "Step 2 - 保存身体数据",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"sessionId\":\"abc-123-def\",\"age\":28,\"height\":165,\"weight\":65,\"targetWeight\":55}"
        },
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/step/body",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "step", "body"]
        }
      }
    },
    {
      "name": "Step 3 - 保存运动频率",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"sessionId\":\"abc-123-def\",\"frequency\":\"3-4\"}"
        },
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/step/frequency",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "step", "frequency"]
        }
      }
    },
    {
      "name": "GET - 获取进度",
      "request": {
        "method": "GET",
        "header": [
          {"key": "x-session-id", "value": "abc-123-def"}
        ],
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/progress",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "progress"]
        }
      }
    },
    {
      "name": "GET - 获取结果（非会员）",
      "request": {
        "method": "GET",
        "header": [
          {"key": "x-session-id", "value": "abc-123-def"}
        ],
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/result",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "result"]
        }
      }
    },
    {
      "name": "POST - 模拟支付",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"sessionId\":\"abc-123-def\"}"
        },
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/pay",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "pay"]
        }
      }
    },
    {
      "name": "GET - 获取结果（会员）",
      "request": {
        "method": "GET",
        "header": [
          {"key": "x-session-id", "value": "abc-123-def"}
        ],
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/api/result",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["api", "result"]
        }
      }
    },
    {
      "name": "GET - 健康检查",
      "request": {
        "method": "GET",
        "url": {
          "raw": "https://health-quiz-production.up.railway.app/health",
          "protocol": "https",
          "host": ["health-quiz-production", "up", "railway", "app"],
          "path": ["health"]
        }
      }
    }
  ]
}