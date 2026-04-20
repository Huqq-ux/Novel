# Novel Frontend

React前端应用

## 环境要求
- Node.js 18+
- npm 或 yarn

## 安装依赖
```bash
npm install
```

## 运行开发服务器
```bash
npm run dev
```

## 构建生产版本
```bash
npm run build
```

## 技术栈
- React 18
- TypeScript
- Vite
- Ant Design Mobile
- React Router
- Axios
- Zustand

## 项目结构
```
src/
├── pages/          # 页面组件
│   ├── Home.tsx    # 首页
│   ├── Bookshelf.tsx # 书架
│   ├── Reader.tsx  # 阅读器
│   ├── Search.tsx  # 搜索
│   ├── Discover.tsx # 发现
│   ├── User.tsx    # 个人中心
│   └── BookDetail.tsx # 书籍详情
├── services/       # API服务
│   └── api.ts      # API封装
├── store/          # 状态管理
│   └── bookshelf.ts # 书架状态
├── types/          # TypeScript类型
│   └── index.ts    # 类型定义
├── App.tsx         # 应用主组件
├── main.tsx        # 入口文件
└── index.css       # 全局样式
```

## 开发说明

### 页面路由
- `/` - 首页
- `/bookshelf` - 书架
- `/discover` - 发现
- `/user` - 个人中心
- `/book/:id` - 书籍详情
- `/read/:bookId/:chapterId` - 阅读器
- `/search` - 搜索

### API调用
所有API调用通过 `src/services/api.ts` 统一管理

### 状态管理
使用Zustand进行状态管理，书架数据持久化到localStorage

## 待优化功能
- [ ] 用户登录注册
- [ ] 夜间模式
- [ ] 阅读设置
- [ ] 书签功能
- [ ] 离线阅读
- [ ] 性能优化
