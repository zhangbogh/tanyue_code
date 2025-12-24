# 游戏系统文档

## 项目概述
这是一个2D横版校园逃脱游戏，玩家可以控制角色在不同房间间移动，收集金币，并且会遇到知识问答挑战。游戏包含角色动画系统、问题弹窗系统和场景切换功能。

**游戏界面尺寸：1200*600像素**

## 文件结构

```
├── Girl_1/            # 角色1的图片资源
│   ├── Attack.png     # 攻击动画
│   ├── Book.png       # 书本相关动画
│   ├── Dialogue.png   # 对话动画
│   ├── Idle.png       # 待机动画
│   ├── Protection.png # 保护姿态动画
│   └── Walk.png       # 行走动画
├── Girl_2/            # 角色2的图片资源（与Girl_1结构相同）
│   ├── Attack.png
│   ├── Dialogue.png
│   ├── Idle.png
│   ├── Protection.png
│   └── Walk.png
├── animation.js       # 角色动画管理模块
├── characterConfig.json # 角色配置文件
├── game.js            # 游戏主逻辑文件
├── index.html         # 游戏入口HTML
├── popupquestion.json # 问题弹窗内容配置
├── questionPopup.js   # 问题弹窗管理模块
├── 地形.json          # 游戏地形配置
└── system_documentation.md # 系统文档（本文件）
```

## 核心功能模块

### 1. 动画管理模块 (animation.js)
**文件位置**: d:\逃离校园 - 副本\animation.js

**主要功能**:
- 管理角色动画状态和配置
- 加载角色动画图片资源
- 处理角色移动动画
- 绘制角色到Canvas
- 同步配置文件中的帧延迟设置

**关键组件**:
- `animationManager` 对象：核心动画管理对象
  - `config`: 存储动画帧配置（帧宽高、帧数、帧延迟）
  - `images`: 存储加载的动画图片
  - `initPlayerAnimation()`: 初始化玩家动画属性
  - `updateAnimation()`: 更新动画帧
  - `drawCharacter()`: 绘制角色到画布
  - `loadAnimationImages()`: 加载动画图片资源
  - `syncFrameDelayFromConfig()`: 从配置文件同步帧延迟

### 2. 问题弹窗模块 (questionPopup.js)
**文件位置**: d:\逃离校园 - 副本\questionPopup.js

**主要功能**:
- 加载问题数据
- 显示问题弹窗
- 处理用户答题交互
- 绘制弹窗界面

**关键组件**:
- `questionPopupManager` 对象：管理问题弹窗功能
  - `init()`: 初始化弹窗管理器
  - `loadQuestions()`: 加载问题数据
  - `showHelloPopup()`: 显示问题弹窗
  - `handlePopupClick()`: 处理弹窗点击事件
  - `drawPopup()`: 绘制弹窗界面
  - `updatePopup()`: 更新弹窗状态

### 3. 游戏主逻辑 (game.js)
**文件位置**: d:\逃离校园 - 副本\game.js

**主要功能**:
- 游戏初始化和主循环
- 角色控制和移动
- 场景管理和切换
- 加载和应用配置
- 碰撞检测

**关键功能点**:
- 加载角色配置
- 处理玩家输入
- 管理游戏状态
- 场景间切换逻辑
- 整合动画和弹窗系统

## 配置文件详解

### 1. 角色配置 (characterConfig.json)
**文件位置**: d:\逃离校园 - 副本\characterConfig.json

**配置项**:
- `character.collision`: 角色碰撞箱设置（宽高、位置）
- `character.movement`: 角色移动属性（速度、跳跃力、重力）
  - `horizontalSpeed`: 横向移动速度
  - `jumpForce`: 跳跃力
  - `gravity`: 重力值
- `character.animation`: 动画配置
  - `frameDelay`: 帧延迟设置（idle: 待机延迟, walk: 行走延迟）
- `character.sprite`: 精灵图偏移设置

### 2. 按钮配置 (内置在game.js中)
**位置**: d:\逃离校园 - 副本\game.js 中的 `window.buttonPositionsConfig` 对象

**说明**: 按钮配置已从外部JSON文件迁移到游戏代码中，以window.buttonPositionsConfig对象形式定义。

**配置项**:
- `popup`: 弹窗相关按钮配置
  - `closeButton`: 关闭按钮属性（尺寸、文本、颜色）
  - `layout`: 弹窗布局设置（中心对齐、垂直间距等）



### 3. 问题数据 (popupquestion.json)
**文件位置**: d:\逃离校园 - 副本\popupquestion.json

**数据结构**:
- `questions`: 问题数组，每个问题包含：
  - `title`: 问题标题
  - `content`: 问题内容
  - `options`: 选项数组
  - `correctAnswer`: 正确答案索引
  - `explanation`: 解释说明

### 4. 地形配置 (地形.json)
**文件位置**: d:\逃离校园 - 副本\地形.json

**配置项**:
- `doors`: 门配置（房间连接点）
- `groundY`: 地面Y坐标
- `rooms`: 房间信息
- `coins`: 金币位置配置
- `boxes`: 箱子位置配置

## 资源文件

### 1. 角色图片资源
**目录**: d:\逃离校园 - 副本\Girl_1/ 和 d:\逃离校园 - 副本\Girl_2/

**图片类型**:
- `Idle.png`: 待机状态动画
- `Walk.png`: 行走状态动画
- `Attack.png`: 攻击动画
- `Dialogue.png`: 对话动画
- `Protection.png`: 保护姿态动画
- `Book.png`: 书本相关动画（仅Girl_1有）

**加载优先级**:
游戏会优先尝试加载Girl_2目录的图片，如果加载失败则回退到Girl_1目录。

## 系统工作流程

### 1. 游戏启动流程
1. HTML页面加载，初始化Canvas
2. 加载game.js主逻辑
3. game.js初始化游戏环境
4. 加载characterConfig.json配置
5. 初始化animationManager
6. animationManager加载角色图片资源
7. 初始化questionPopupManager
8. 开始游戏主循环

### 2. 动画系统工作流程
1. animationManager加载角色图片
2. 游戏主循环调用updateAnimation更新动画帧
3. 根据角色状态（行走/静止）切换动画配置
4. 调用drawCharacter绘制角色到画布
5. 支持从配置文件动态同步帧延迟

### 3. 问题弹窗流程
1. questionPopupManager加载问题数据
2. 游戏触发显示弹窗条件
3. 显示HelloPopup方法随机选择问题
4. 绘制弹窗界面
5. 处理用户点击交互
6. 验证答案并显示结果
7. 正确答案时自动关闭弹窗

## 配置同步机制

1. **角色配置同步**:
   - game.js中的loadCharacterConfig函数负责加载配置
   - 将配置应用到游戏和动画系统

2. **帧延迟同步**:
   - animation.js中的syncFrameDelayFromConfig方法负责同步帧延迟
   - 在updateAnimation首次调用时执行同步
   - 确保配置文件中的动画速度设置生效

## 交互控制

1. **角色移动**:
   - 左右箭头键或A/D键控制角色移动
   - animationManager.handleKeyDown/handleKeyUp处理按键状态

2. **问题交互**:
   - 点击选项按钮选择答案
   - 点击关闭按钮关闭弹窗

2. **金币放置模式**:
    - 进入金币放置模式后，点击游戏区域可添加金币
    - 金币会自动吸附到最近的网格点
    - 按C键可清除当前场景中所有金币
    - 使用Ctrl+Z快捷键可撤销上一步添加的金币操作
    - 系统会自动保存金币状态历史，支持多次撤销

3. **框放置模式**:
    - 进入框放置模式后，使用鼠标拖拽操作创建框
    - 鼠标按下(mousedown)开始绘制，鼠标移动(mousemove)显示预览，鼠标松开(mouseup)完成绘制
    - 框的大小和位置根据拖拽范围确定
    - 按C键可清除当前场景中所有框
    - 使用Ctrl+Z快捷键可撤销上一步创建的框操作
    - 系统会自动保存框状态历史，支持多次撤销

## 场景管理

1. **房间系统**:
   - 游戏包含多个房间（左房间、中间房间、右房间）
   - 通过门（doors）配置实现房间间切换
   - 每个房间有独立的金币分布