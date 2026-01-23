# AI助手应用

基于Vue3 + Vite构建的AI助手前端应用。

## 技术栈

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios

## 项目结构

```
ai-assistant/
├── src/
│   ├── api/          # API接口
│   ├── router/       # 路由配置
│   ├── views/        # 页面组件
│   ├── components/   # 通用组件
│   ├── stores/       # Pinia状态管理
│   ├── App.vue       # 根组件
│   ├── main.js       # 入口文件
│   └── style.css     # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 功能特性

- 🏠 首页：欢迎页面，可以开始新对话或查看历史记录
- 💬 对话界面：实时对话，支持消息发送和接收
- 📋 对话记录：查看和管理历史对话

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 后端接口配置

后端API地址在 `vite.config.js` 中配置，默认指向 `http://localhost:8080`。

需要实现的API接口：

- `POST /api/chat/create` - 创建新对话
- `POST /api/chat/message` - 发送消息
- `GET /api/chat/history/:id` - 获取对话历史
- `GET /api/chat/list` - 获取对话列表
- `DELETE /api/chat/:id` - 删除对话
- `PUT /api/chat/:id/title` - 更新对话标题

## 注意事项

1. 请根据实际后端API响应格式调整 `src/api/request.js` 中的响应拦截器
2. 背景图片和Logo需要替换到对应的组件中
3. 根据实际需求调整样式和交互



