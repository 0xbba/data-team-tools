---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '5c568bea-11d6-40c4-bd4a-66ecd16e8945'
  PropagateID: '5c568bea-11d6-40c4-bd4a-66ecd16e8945'
  ReservedCode1: '7000e53e-da17-4f6f-b0b7-e17bcc064cb4'
  ReservedCode2: '7000e53e-da17-4f6f-b0b7-e17bcc064cb4'
---

# 数据组常用工具

内部数据组日常办公工具集，支持字段翻译、INSERT SQL 生成、多账期 SQL 生成、数据需求台账管理等功能。

## 功能模块

| 模块 | 说明 |
|------|------|
| 字段翻译 | 粘贴/上传 SQL 字段，自动匹配翻译对照表，支持批量翻译 |
| 管理对照记录 | 翻译对照记录的增删改查、导入导出、操作日志 |
| 生成 INSERT | 上传 Excel 自动生成 INSERT 语句（Hive / PostgreSQL） |
| 多账期 SQL | 基于 SQL 模板批量生成多账期查询语句 |
| 解析录入 | 从 OA 流程页面解析台账信息并录入 |
| 管理台账 | 数据需求台账的增删改查、提取记录管理、操作日志 |
| 用户管理 / 角色管理 | 多用户权限体系（需管理员角色） |

## 技术栈

- **前端**：React 19 + TypeScript + Vite + Ant Design
- **后端**：Node.js (Express) + PostgreSQL
- **部署**：Docker (docker-compose)

## 本地开发

```bash
# 安装前端依赖
npm install

# 启动开发服务器（前端热更新）
npm run dev

# 启动后端（另开终端，需要 PostgreSQL）
cd server && npm install && node server.js
```

后端依赖环境变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PGHOST | PostgreSQL 主机 | localhost |
| PGPORT | PostgreSQL 端口 | 5432 |
| PGUSER | 数据库用户 | dtapp |
| PGPASSWORD | 数据库密码 | (无默认，必须设置) |
| PGDATABASE | 数据库名 | data_team_tools |
| PGSCHEMA | Schema | public |
| JWT_SECRET | JWT 签名密钥（见下方说明） | (无默认，生产环境必须设置) |
| PORT | 服务端口 | 3456 |

**JWT_SECRET 是什么？**

你登录系统后，服务器会发给你一个"通行证"（Token），证明你是已登录用户。JWT_SECRET 就是用来给这个通行证盖章的私钥——只有知道这个密钥的人才能生成合法的通行证。

- 如果不设置或用默认值，别人看到源码就能伪造通行证，以任何身份登录系统
- 设置一个随机的长字符串即可，比如 `my-s3cr3t-k3y-2024!@#`，不需要记，也不需要输入
- 本地开发不设也能跑，但部署到服务器上必须设

## 构建

```bash
npm run build
```

构建产物输出到 `server/public/`，包含：
- `index.html` — 主版本（需后端服务）
- `单机版.html` — 独立单文件版（离线可用，数据存 localStorage）

## Docker 部署

### 方式一：docker run（推荐）

无需 docker-compose，直接一条命令启动：

```bash
docker run -d \
  --name data-team-tools \
  -p 3456:3456 \
  -e PGHOST=你的数据库IP \
  -e PGPORT=5432 \
  -e PGUSER=你的数据库用户 \
  -e PGPASSWORD=你的数据库密码 \
  -e PGDATABASE=你的数据库名 \
  -e PGSCHEMA=你的schema \
  -e JWT_SECRET=你的JWT密钥 \
  0xbba/data-team-tools:latest
```

访问 `http://你的服务器IP:3456` 即可使用。

### 方式二：docker-compose

docker-compose 适合需要同时启动数据库和应用的场景。它会自动拉起一个 PostgreSQL 容器和应用容器。

1. 在 `docker-compose.yml` 同目录下创建 `.env` 文件配置密钥：

```env
JWT_SECRET=你的JWT密钥
PGPASSWORD=你的数据库密码
```

> 如果不创建 `.env`，会使用 `docker-compose.yml` 中的默认值（仅适用于内网测试）

2. 启动：

```bash
docker-compose up -d
```

3. 常用操作：

```bash
docker-compose logs -f          # 查看日志
docker-compose down             # 停止并删除容器
docker-compose pull && docker-compose up -d   # 更新镜像
```

> 注意：docker-compose 方式会启动独立的 PostgreSQL 容器，数据存在 Docker volume `dt_pgdata` 中。如果你已有外部数据库，用方式一更简单。

## 项目结构

```
├── src/                  # 前端源码
│   ├── api/              # API 调用
│   ├── components/       # 页面组件 / 布局 / 弹窗
│   ├── constants.ts      # 常量定义
│   ├── contexts/         # React Context
│   ├── hooks/            # 自定义 Hooks
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── server/               # 后端源码
│   ├── server.js         # 入口（薄层）
│   ├── db.js             # 数据库配置
│   ├── init.js           # 建表初始化
│   ├── middleware.js     # 认证 / 权限中间件
│   ├── routes/           # API 路由
│   └── utils/            # 服务端工具
├── Dockerfile
├── docker-compose.yml
└── vite.config.ts
```

> AI生成