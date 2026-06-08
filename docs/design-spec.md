# Typing Pro 设计规范文档

## 一、核心气质

遵循 **Notion 风格** 的极简克制美学：

- 超级留白，呼吸感强
- 无花哨装饰，无渐变，无发光
- 圆角卡片，纤细分割线
- 低饱和柔和色
- 字重纤细、清晰克制
- 无阴影或极轻阴影
- 居中大区域布局，内容松散不拥挤

## 二、颜色规范

所有色值均对齐 Notion 官方设计系统（Light Mode）。

| 用途 | 色值 | Notion 对应 | 说明 |
|------|------|-------------|------|
| 背景色 | `#FFFFFF` | Background | 页面主背景 |
| 卡片底色 | `#F6F5F4` | Light Surface | 卡片、区块背景 |
| 卡片 hover | `#F0EFED` | Muted Surface | 卡片悬停态 |
| 文字主色 | `#373530` | Default Text | 标题、正文 |
| 次要文字 | `#787774` | Gray Text | 辅助说明、标签 |
| 占位文字 | `#A39E98` | Subtle Text | placeholder、禁用态 |
| 强调蓝 | `#097FE8` | Primary Blue | 主按钮、链接、高亮 |
| 强调蓝深色 | `#005BAB` | Primary Press | 主按钮 hover/active |
| 分割线 | `#DFDCD9` | Border | 1px 纤细分割线 |
| 链接蓝 | `#0075DE` | Link Blue | 内联文本链接 |
| 正确绿 | `#448361` | Notion Green | 打字正确字符 |
| 错误红 | `#D44C47` | Notion Red | 打字错误字符 |
| 错误红深色 | `#B54540` | — | 删除按钮 hover |

### 色值来源

| 旧值 | 新值 | 变更原因 |
|------|------|----------|
| `#2563EB` | `#097FE8` | Notion 主蓝色，低饱和度 |
| `#1D4ED8` | `#005BAB` | Notion 按钮按下态 |
| `#8B8B8B` | `#787774` | Notion Gray 次要文字 |
| `#B4B4B4` | `#A39E98` | Notion Subtle 占位文字 |
| `#EAEAEA` | `#DFDCD9` | Notion Border 分割线 |
| `#F7F6F3` | `#F6F5F4` | Notion Light Surface |
| `#EFEEEB` | `#F0EFED` | Notion Muted Surface |
| `#EEEDEA` | `#E8E6E3` | 输入框 focus 底色 |
| `#37352F` | `#373530` | Notion Default 文字主色 |
| `#10B981` | `#448361` | Notion Green 正确色 |
| `#EF4444` | `#D44C47` | Notion Red 错误色 |
| `#DC2626` | `#B54540` | 错误色 hover |

## 三、字体规范

- **字体族**：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **标题**：`font-weight: 500 ~ 600`
- **正文**：`font-weight: 400`
- **小号文字**：`font-weight: 300 ~ 400`
- 所有文字不描边、不加粗过度

### 字号层级

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| H1 | 24px | 600 | 页面主标题 |
| H2 | 18px | 500 | 区域标题 |
| Body | 15px | 400 | 正文内容 |
| Small | 13px | 400 | 辅助文字 |
| Caption | 12px | 400 | 标签、日期 |
| Stat Large | 40px | 300 | 大号统计数字 |
| Stat Medium | 22px | 400 | 中号统计数字 |

## 四、布局规范

- **内容居中**：`max-width: 640px; margin: 0 auto;`
- **页面边距**：`padding: 0 20px;`
- **卡片圆角**：`10px`
- **按钮圆角**：`6px`
- **间距体系**：`12px` / `16px` / `20px` / `24px` / `32px` / `48px`
- **分割线**：`1px solid #DFDCD9`

## 五、组件规范

### 5.1 卡片

```css
background: #F6F5F4;
border-radius: 10px;
padding: 20px;
/* 无边框，无阴影 */
```

### 5.2 按钮

- **主按钮**：背景 `#097FE8`，文字 `#FFFFFF`，hover → `#005BAB`
- **次要按钮**：背景 `#F6F5F4`，文字 `#373530`，hover → `#F0EFED`
- **文字按钮**：纯文字，无背景，hover → 轻微变色
- **hover**：轻微变深，无渐变发光

### 5.3 输入框

```css
background: #F6F5F4;
border: none;
border-radius: 8px;
padding: 12px 16px;
/* 光标纤细，focus → #E8E6E3 */
```

### 5.4 统计数字

- 大号纤细数字（font-weight: 300）
- 强调蓝色 `#097FE8`
- 居中布局

### 5.5 打字区域

- 大留白（padding: 24px）
- 文字宽松行高（line-height: 2.2）
- 正确字符：`#448361`（Notion Green）
- 错误字符：`#D44C47`（Notion Red）
- 当前光标：底部下划线 `#097FE8`

## 六、动效规范

- **所有动画时长**：`0.2s`
- **卡片 hover**：轻微上浮 `translateY(-1px)` + 轻微变色
- **按钮 hover**：轻微背景色变化
- **禁止使用**：旋转、弹跳、强光、闪烁、缩放动画

## 七、适配规范

- 目标移动端尺寸：**375px**（iPhone SE 标准）
- 最大内容宽度：**640px**
- `viewport: width=device-width, initialScale=1, maximumScale=1`
