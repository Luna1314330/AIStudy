# 学习小助手（React 版）

基于 **React 19 + React Router + Zustand + Vite** 的教育类 Web 应用。写作引导模块通过 **Coze Web SDK CDN** 接入扣子编程部署的智能体。

## 写作模块接入方式

使用官方 CDN + `cozeWebSDK.init()`：

```html
<script src="https://lf-cdn.coze.cn/obj/unpkg/latest/coze/web-sdk/dist/js-umd/index.min.js"></script>
```

配置见 `.env.local`：

```env
VITE_COZE_PROJECT_ID=7660377377884651539
VITE_COZE_API_TOKEN=pat_你的Token
```

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 19 |
| 路由 | React Router 7 |
| 状态 | Zustand |
| 构建 | Vite 6 |
| HTTP | Axios + fetch (SSE) |

## 快速开始

```bash
cd learning-assistant-react
cp .env.example .env.local   # 填写 Coze 配置
npm install
npm run dev                  # http://localhost:5173
```

## 目录结构

```
src/
├── components/     Layout, ChatMessageBox, VoiceInput
├── pages/          各科目页面
├── store/          Zustand chatStore
├── utils/          api.js, voiceRecognition.js
├── router/         路由与扩展配置
└── styles/         全局样式
```

## Coze 配置（Web SDK）

```env
VITE_COZE_PROJECT_ID=你的project_id
VITE_COZE_API_TOKEN=你的API_Token
```

Token 在部署页 **管理 API Token → 创建 API Token** 获取。

## 与 Vue 版对比

| Vue 版 (`learning-assistant/`) | React 版 (`learning-assistant-react/`) |
|--------------------------------|----------------------------------------|
| Pinia | Zustand |
| Vue Router | React Router |
| `.vue` 单文件组件 | `.jsx` + CSS |

功能与 UI 保持一致，API 对接逻辑相同。
