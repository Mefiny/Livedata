# LiveData OS

**AI智能逻辑布分析平台**

LiveData OS 是一个基于节点流的可视化数据分析工具。通过拖拽节点、连接数据流，构建复杂的数据分析流程，无需编写代码即可完成数据清洗、分析和可视化。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)

---

##  核心功能

###  可视化节点编辑器
- 拖拽式节点操作，直观构建数据流
- 节点内数据预览，实时查看输出结果
- 右键快捷菜单（执行、复制、删除）
- 双击节点快速执行
- 自动执行上游依赖链
- 实时状态反馈（运行中/成功/错误）
- 循环检测和类型校验
- 工作流保存/加载（JSON格式）

###  数据源
- **内置数据集**：股票数据、销售数据
- **CSV上传**：支持自定义数据导入
- **实时预览**：表格化显示数据

###  数据处理节点
- **数据清洗**：处理空值（保留/删除/填充0）、去重
- **异常检测**：Z-Score方法、IQR方法
- **过滤器**：数据筛选（等于、包含、大于、小于）
- **分组聚合**：按字段分组并计算（求和、平均、计数、最大、最小）
- **排序**：按字段升序/降序排列
- **统计摘要**：计算总数、总和、平均值、中位数、最大最小值
- **转换**：通用数据转换

###  金融分析
- **收益率计算**：简单收益率、累计收益率
- **最大回撤**：风险评估指标
- **夏普比率**：风险调整收益

###  可视化
- **图表**：折线图、柱状图、饼图
- **数据表**：表格展示
- **智能字段选择**：自动识别上游数据列
- **实时预览**：配置面板即时显示结果

##  快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/livedata-os.git
cd livedata-os
```

2. **配置环境变量**
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入你的 Google API Key
```

3. **安装前端依赖**
```bash
cd frontend
npm install
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

##  测试说明 (Testing Instructions)

### 快速测试流程

**测试 1: 基础数据流**
1. 从左侧面板拖拽"数据源"节点到画布
2. 选择内置数据集（股票数据或销售数据）
3. 拖拽"数据表"节点到画布
4. 连接数据源节点到数据表节点（从输出点拖到输入点）
5. 双击数据表节点执行 - 应该看到数据预览

**测试 2: 数据处理管道**
1. 添加"数据源"节点 → 选择销售数据
2. 添加"数据清洗"节点 → 配置处理空值
3. 添加"过滤器"节点 → 设置条件（如 amount > 100）
4. 添加"分组聚合"节点 → 按 category 分组，计算总和
5. 添加"图表"节点 → 选择柱状图
6. 连接所有节点形成流水线
7. 双击最后的图表节点 - 系统会自动执行整个管道并显示结果

**测试 3: 金融分析**
1. 添加"数据源"节点 → 选择股票数据
2. 添加"收益率计算"节点 → 选择价格字段
3. 添加"最大回撤"节点
4. 添加"夏普比率"节点 → 设置无风险利率
5. 添加"图表"节点 → 折线图显示收益率
6. 连接节点并执行 - 查看金融指标计算结果

**测试 4: AI 功能**
1. 添加"数据源"节点
2. 添加"AI助手"节点
3. 在配置面板输入自然语言指令（如"找出异常值"）
4. 执行节点查看AI分析建议

**测试 5: 工作流保存/加载**
1. 构建任意数据流
2. 点击顶部"保存"按钮导出 JSON 文件
3. 刷新页面
4. 点击"加载"按钮选择刚才的 JSON 文件
5. 验证工作流完整恢复

**测试 6: 错误处理**
1. 尝试创建循环连接 - 应该被阻止
2. 不连接输入直接执行节点 - 应该显示错误提示
3. 配置错误的字段名 - 应该在配置面板显示错误

### 预期结果
- ✅ 所有节点执行后显示绿色成功状态
- ✅ 节点内实时显示数据预览
- ✅ 图表正确渲染
- ✅ 错误情况有清晰的提示信息
- ✅ 工作流可以保存和恢复

### 常见问题排查
- 如果节点执行失败，检查右侧配置面板的错误信息
- 如果连接无法建立，确保没有创建循环依赖
- 如果数据不显示，确保上游节点已成功执行

##  使用指南

### 基础操作

**添加节点**
- 从左侧节点面板拖拽节点到画布
- 节点按类别分组：数据源、数据处理、金融分析、可视化、AI

**连接节点**
- 从节点底部的输出点拖拽到另一个节点顶部的输入点
- 系统会自动检测循环连接并阻止

**执行节点**
- 双击节点快速执行
- 右键点击节点 → 选择"执行节点"
- 系统会自动执行所有上游依赖节点

**快捷操作**
- 右键节点：显示快捷菜单（执行、复制、删除）
- Delete/Backspace：删除选中的节点或连线
- 保存工作流：点击顶部"保存"按钮导出JSON
- 加载工作流：点击顶部"加载"按钮导入JSON

**智能配置**
- 选择节点后，右侧配置面板自动显示
- 字段选择器会自动显示上游数据的可用列
- 错误信息会在配置面板和节点上显示

### 示例工作流

**股票分析流程**
```
数据源(股票) → 收益率计算 → 图表(折线图)
              ↓
           最大回撤 → 夏普比率
```

**销售数据分析**
```
数据源(CSV) → 数据清洗 → 分组聚合 → 图表(柱状图)
              ↓
           异常检测 → 过滤器 → 统计摘要
```

## 技术栈

- **React 18** + TypeScript
- **React Flow** - 节点编辑器
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式
- **Lucide React** - 图标库
- **Vite** - 构建工具

## 项目结构

```
LiveData OS/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NodePanel.tsx          # 节点面板（分类展示）
│   │   │   ├── FlowCanvas.tsx         # 画布区域（右键菜单）
│   │   │   ├── ConfigPanel.tsx        # 配置面板（智能字段选择）
│   │   │   ├── ContextMenu.tsx        # 右键菜单组件
│   │   │   ├── SimpleChart.tsx        # 图表渲染
│   │   │   ├── WorkspaceView.tsx      # 主工作区
│   │   │   └── nodes/
│   │   │       └── BaseNode.tsx       # 基础节点（数据预览）
│   │   ├── plugins/
│   │   │   ├── registry.ts            # 插件注册表
│   │   │   ├── dataSource.ts          # 数据源
│   │   │   ├── filter.ts              # 过滤器
│   │   │   ├── dataCleaning.ts        # 数据清洗
│   │   │   ├── outlierDetection.ts    # 异常检测
│   │   │   ├── groupBy.ts             # 分组聚合
│   │   │   ├── sort.ts                # 排序
│   │   │   ├── stats.ts               # 统计摘要
│   │   │   ├── returnCalculator.ts    # 收益率
│   │   │   ├── maxDrawdown.ts         # 最大回撤
│   │   │   ├── sharpeRatio.ts         # 夏普比率
│   │   │   ├── chart.ts               # 图表
│   │   │   ├── table.ts               # 数据表
│   │   │   ├── aiProcessor.ts         # AI助手
│   │   │   └── index.ts               # 插件初始化
│   │   ├── stores/
│   │   │   ├── appStore.ts            # 应用状态
│   │   │   └── flowStore.ts           # 节点流状态（保存/加载）
│   │   └── types/
│   │       └── flow.ts                # 类型定义
│   └── package.json
├── backend/
│   ├── .env.example                   # 环境变量模板
│   └── app/
├── .gitignore
└── README.md
```

## 插件系统

每个分析节点都是一个插件，实现 `IAnalysisPlugin` 接口：

```typescript
interface IAnalysisPlugin {
  id: string;
  name: string;
  type: string;
  execute: (input: any, config: any) => Promise<any>;
  configSchema: Record<string, ConfigField>;
}
```

添加新插件只需：
1. 创建插件文件实现接口
2. 在 `plugins/index.ts` 中注册
3. 在 `NodePanel.tsx` 中添加节点模板

##  贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

##  许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件



