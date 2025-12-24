// 将在HTML中通过script标签引入animation.js

// 按钮位置配置对象（内置，不再需要外部JSON文件）
window.buttonPositionsConfig = {
  "popup": {
    "closeButton": {
      "width": 120,
      "height": 40,
      "text": "关闭",
      "color": "#4CAF50",
      "textColor": "#FFF",
      "fontSize": 20
    },
    "layout": {
      "centerX": true,
      "centerY": true,
      "verticalSpacing": 50,
      "titleYOffset": -80,
      "optionsStartYOffset": 80,
      "closeButtonYOffset": 20
    }
  },
  "modeButtons": {
    "coinPlacement": {
      "id": "coinPlacementModeToggle",
      "defaultText": "金币放置模式",
      "activeText": "退出金币放置模式"
    },
    "boxMode": {
      "id": "boxModeToggle",
      "defaultText": "框放置模式",
      "activeText": "退出框放置模式"
    },
    "downloadLevel": {
      "id": "downloadLevelJson",
      "text": "下载地形.json",
      "color": "#4CAF50",
      "textColor": "#FFF"
    },
    "layout": {
      "position": "top-left",
      "marginBottom": 15
    }
  }
};

// 角色配置对象（设置为全局变量，便于animation.js访问）
window.characterConfig = {
    character: {
        collision: {
            width: 20,
            height: 25,
            x: 170,
            y: 490
        },
        movement: {
            speed: 5,
            horizontalSpeed: 4,
            jumpForce: 15,
            gravity: 0.8
        },
        animation: {
            frameDelay: {
                idle: 2,
                walk: 2
            }
          }
      }
  };

// 从JSON文件加载角色配置
function loadCharacterConfig(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'characterConfig.json', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const loadedConfig = JSON.parse(xhr.responseText);
                window.characterConfig = loadedConfig;
                
                // 更新游戏中的角色属性
                game.player.x = window.characterConfig.character.collision.x;
                game.player.y = window.characterConfig.character.collision.y;
                game.player.width = window.characterConfig.character.collision.width;
                game.player.height = window.characterConfig.character.collision.height;
                game.player.speed = window.characterConfig.character.movement.speed;
                game.player.horizontalSpeed = window.characterConfig.character.movement.horizontalSpeed || window.characterConfig.character.movement.speed;
                game.player.jumpForce = window.characterConfig.character.movement.jumpForce;
                game.player.gravity = window.characterConfig.character.movement.gravity || 0.8;
                
                // 加载sprite.offsetY属性（如果存在）
                if (window.characterConfig.character.sprite && window.characterConfig.character.sprite.offsetY !== undefined) {
                    game.player.spriteOffsetY = window.characterConfig.character.sprite.offsetY;
                    console.log('已设置精灵Y偏移量为:', game.player.spriteOffsetY);
                }
                
                // 更新动画配置
                try {
                    console.log('尝试更新动画配置...');
                    
                    // 简化条件判断，确保animationManager存在
                    if (window.animationManager) {
                        console.log('找到animationManager');
                        
                        // 确保config对象存在
                        if (!window.animationManager.config) {
                            window.animationManager.config = {};
                            console.log('创建animationManager.config对象');
                        }
                        
                        // 确保idle和walk配置存在
                        if (!window.animationManager.config.idle) {
                            window.animationManager.config.idle = { frameDelay: 10 };
                            console.log('创建animationManager.config.idle对象');
                        }
                        if (!window.animationManager.config.walk) {
                            window.animationManager.config.walk = { frameDelay: 5 };
                            console.log('创建animationManager.config.walk对象');
                        }
                        
                        // 应用配置文件中的frameDelay值
                        if (window.characterConfig.character.animation && 
                            window.characterConfig.character.animation.frameDelay) {
                            
                            const configFrameDelay = window.characterConfig.character.animation.frameDelay;
                            console.log('从配置文件获取的frameDelay:', configFrameDelay);
                            
                            // 应用idle帧延迟
                            if (configFrameDelay.idle !== undefined) {
                                window.animationManager.config.idle.frameDelay = configFrameDelay.idle;
                                console.log('已设置idle帧延迟为:', configFrameDelay.idle);
                            }
                            
                            // 应用walk帧延迟
                            if (configFrameDelay.walk !== undefined) {
                                window.animationManager.config.walk.frameDelay = configFrameDelay.walk;
                                console.log('已设置walk帧延迟为:', configFrameDelay.walk);
                            }
                        }
                    } else {
                        console.log('animationManager尚未加载，稍后再更新动画配置');
                    }
                } catch (e) {
                    console.error('更新动画配置时出错:', e);
                }
                
                console.log('角色配置已成功加载');
                // console.log('角色碰撞箱尺寸:', game.player.width, 'x', game.player.height);
            } catch (e) {
                console.error('解析配置文件失败:', e);
            }
        } else {
            console.warn('无法加载配置文件，使用默认配置');
        }
        
        // 无论配置是否成功加载，都调用回调函数继续初始化
        if (callback) callback();
    };
    xhr.onerror = function() {
        console.warn('加载配置文件出错，使用默认配置');
        // 出错时也调用回调函数继续初始化
        if (callback) callback();
    };
    xhr.send();
}

// 加载关卡数据（门和地形）
function loadLevelData(callback) {
    const xhr = new XMLHttpRequest();
    // 添加时间戳参数，确保每次都加载最新的文件，绕过浏览器缓存
    const timestamp = new Date().getTime();
    xhr.open('GET', `地形.json?t=${timestamp}`, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const levelData = JSON.parse(xhr.responseText);
                window.levelData = levelData;
                console.log('地形.json加载成功，完整数据:', levelData);
                
                // 加载门配置
                if (levelData.doors) {
                    // 解析门配置中的模板字符串
                game.doors = levelData.doors.map(door => {
                    // 解析y坐标模板字符串
                    if (typeof door.y === 'string' && door.y.includes('{{') && door.y.includes('}}')) {
                        try {
                            // 提取表达式内容
                            const match = door.y.match(/{{(.*?)}}/);
                            if (match && match[1]) {
                                const expression = match[1].trim();
                                // 获取变量值
                                const groundY = Number(levelData.groundY || game.groundY);
                                const height = door.height || 100;
                                
                                // 简单表达式解析（不使用eval）
                                if (expression.includes('groundY') && expression.includes('-')) {
                                    // 处理常见的表达式格式: groundY - height
                                    const parts = expression.split('-').map(part => part.trim());
                                    if (parts.length === 2 && parts[0] === 'groundY' && parts[1] === 'height') {
                                        door.y = groundY - height;
                                    } else {
                                        // 备用计算
                                        door.y = groundY - height;
                                    }
                                } else {
                                    // 默认计算
                                    door.y = groundY - height;
                                }
                                console.log(`解析门${door.id}的y坐标: ${expression} = ${door.y}`);
                            } else {
                                throw new Error('表达式格式错误');
                            }
                        } catch (e) {
                            console.error(`解析门${door.id}的y坐标失败:`, e);
                            door.y = Number(levelData.groundY || game.groundY) - (door.height || 100);
                        }
                    }
                    
                    // 解析targetX坐标模板字符串
                    if (typeof door.targetX === 'string' && door.targetX.includes('{{') && door.targetX.includes('}}')) {
                        try {
                            // 提取表达式内容
                            const match = door.targetX.match(/{{(.*?)}}/);
                            if (match && match[1]) {
                                const expression = match[1].trim();
                                
                                // 简单表达式解析（不使用eval）
                                // 尝试将表达式直接解析为数字
                                const targetX = parseInt(expression);
                                if (!isNaN(targetX)) {
                                    door.targetX = targetX;
                                } else {
                                    // 默认值
                                    door.targetX = 170;
                                }
                                console.log(`解析门${door.id}的targetX坐标: ${expression} = ${door.targetX}`);
                            } else {
                                throw new Error('表达式格式错误');
                            }
                        } catch (e) {
                            console.error(`解析门${door.id}的targetX坐标失败:`, e);
                            door.targetX = 170; // 默认值
                        }
                    } else if (typeof door.targetX === 'string') {
                        // 如果是普通字符串，尝试转换为数字
                        door.targetX = parseInt(door.targetX) || 170;
                    }
                    
                    // 解析targetY坐标模板字符串
                    if (typeof door.targetY === 'string' && door.targetY.includes('{{') && door.targetY.includes('}}')) {
                        try {
                            // 提取表达式内容
                            const match = door.targetY.match(/{{(.*?)}}/);
                            if (match && match[1]) {
                                const expression = match[1].trim();
                                // 获取变量值
                                const groundY = Number(levelData.groundY || game.groundY);
                                
                                // 简单表达式解析（不使用eval）
                                if (expression.includes('groundY') && expression.includes('-')) {
                                    // 处理常见的表达式格式: groundY - 30
                                    const parts = expression.split('-').map(part => part.trim());
                                    if (parts.length === 2 && parts[0] === 'groundY') {
                                        const offset = parseInt(parts[1]);
                                        if (!isNaN(offset)) {
                                            door.targetY = groundY - offset;
                                        } else {
                                            door.targetY = groundY - 30;
                                        }
                                    } else {
                                        // 备用计算
                                        door.targetY = groundY - 30;
                                    }
                                } else {
                                    // 默认计算
                                    door.targetY = groundY - 30;
                                }
                                console.log(`解析门${door.id}的targetY坐标: ${expression} = ${door.targetY}`);
                            } else {
                                throw new Error('表达式格式错误');
                            }
                        } catch (e) {
                            console.error(`解析门${door.id}的targetY坐标失败:`, e);
                            door.targetY = Number(levelData.groundY || game.groundY) - 30;
                        }
                    }
                        
                        return door;
                    });
                    console.log('门配置已成功从地形.json加载并解析，共', game.doors.length, '个门');
                }
                
                // 加载地形配置
                if (levelData.groundY !== undefined) {
                    console.log('找到groundY值:', levelData.groundY, '，类型:', typeof levelData.groundY);
                    game.groundY = Number(levelData.groundY); // 确保转换为数字类型
                    console.log('地面Y坐标已设置为:', game.groundY, '，类型:', typeof game.groundY);
                } else {
                    console.warn('地形.json中未找到groundY值，使用默认值:', game.groundY);
                }
                
                // 地面碰撞箱高度属性已移除，现在直接使用groundY作为地面位置
                
                // 加载房间配置
                if (levelData.rooms) {
                    window.rooms = levelData.rooms;
                    // console.log('房间配置已成功加载，共', levelData.rooms.length, '个房间');
                    
                    // 加载当前房间的背景图片
                const currentRoom = levelData.rooms.find(room => room.id === game.currentRoomId);
                if (currentRoom && currentRoom.backgroundImage) {
                    // console.log(`加载当前房间(ID:${game.currentRoomId})的背景图片: ${currentRoom.backgroundImage}`);
                    // 更新背景图片
                    if (game.backgroundImage) {
                        game.backgroundImage.onload = function() {
                            // console.log(`背景图片${currentRoom.backgroundImage}加载成功`);
                        };
                        game.backgroundImage.onerror = function() {
                            // console.error(`背景图片${currentRoom.backgroundImage}加载失败`);
                        };
                        game.backgroundImage.src = currentRoom.backgroundImage;
                    } else {
                        game.backgroundImage = new Image();
                        game.backgroundImage.onload = function() {
                            // console.log(`背景图片${currentRoom.backgroundImage}加载成功`);
                        };
                        game.backgroundImage.onerror = function() {
                            // console.error(`背景图片${currentRoom.backgroundImage}加载失败`);
                        };
                        game.backgroundImage.src = currentRoom.backgroundImage;
                    }
                } else {
                    // console.warn(`房间ID:${game.currentRoomId}没有设置背景图片`);
                }
                }
                
                // 加载金币配置
                if (levelData.coins) {
                    console.log('金币配置已成功从地形.json加载，共', levelData.coins.length, '个金币对象');
                    // 尝试两种格式：1. 直接是包含roomId的金币对象数组 2. 按房间分组的数据结构
                    let currentRoomCoins = [];
                    
                    // 检查是否是按房间分组的格式
                    if (levelData.coins.length > 0 && levelData.coins[0].roomId && levelData.coins[0].items) {
                        // 按房间分组格式
                        const roomData = levelData.coins.find(room => room.roomId === game.currentRoomId);
                        if (roomData && roomData.items) {
                            currentRoomCoins = roomData.items;
                        }
                    } else {
                        // 直接的金币对象数组格式，每个金币都有自己的roomId
                        currentRoomCoins = levelData.coins.filter(coin => coin.roomId === game.currentRoomId);
                    }
                    
                    if (currentRoomCoins.length > 0) {
                        // 加载金币时对坐标应用格点吸附，确保中心点对齐到格点
                        game.coins = currentRoomCoins.map(coin => {
                            // 将保存的x/y坐标视为中心点，应用格点吸附
                            const snappedCenter = snapToGrid(coin.x, coin.y);
                            // 计算左上角坐标（中心点 - 宽高/2）
                            const coinWidth = 20; // 金币宽度
                            const coinHeight = 20; // 金币高度
                            return {
                                ...coin,
                                x: snappedCenter.x - coinWidth / 2,  // 左上角x坐标
                                y: snappedCenter.y - coinHeight / 2,  // 左上角y坐标
                                collected: false
                            };
                        });
                        console.log('已加载当前房间的金币并应用格点吸附，数量:', game.coins.length);
                    }
                }
                
                // 加载框配置
                // 优先从rooms.items加载框数据（这是地形复现的关键）
                if (levelData.rooms && Array.isArray(levelData.rooms)) {
                    const currentRoom = levelData.rooms.find(room => room.id === game.currentRoomId);
                    if (currentRoom && currentRoom.items && currentRoom.items.length > 0) {
                        console.log('从rooms.items加载当前房间的框配置，数量:', currentRoom.items.length);
                        game.boxes = currentRoom.items.map(box => {
                            // 直接将保存的x/y坐标视为左上角坐标，应用格点吸附
                            const snapped = snapToGrid(box.x, box.y);
                            return {
                                ...box,
                                x: snapped.x,
                                y: snapped.y,
                                roomId: game.currentRoomId // 确保框有roomId属性
                            };
                        });
                        console.log('已从rooms.items加载当前房间的框并应用格点吸附，数量:', game.boxes.length);
                    }
                }
                
                // 同时也支持从boxes数组加载（兼容旧格式）
                if (levelData.boxes && game.boxes.length === 0) { // 只有在rooms.items没有加载到框时才尝试从boxes加载
                    console.log('尝试从boxes数组加载框配置，共', levelData.boxes.length, '个对象');
                    // 尝试两种格式：1. 直接是包含roomId的框对象数组 2. 按房间分组的数据结构
                    let currentRoomBoxes = [];
                    
                    // 检查是否是按房间分组的格式
                    if (levelData.boxes.length > 0 && levelData.boxes[0].roomId && levelData.boxes[0].items) {
                        // 按房间分组格式
                        const roomData = levelData.boxes.find(room => room.roomId === game.currentRoomId);
                        if (roomData && roomData.items) {
                            currentRoomBoxes = roomData.items;
                        }
                    } else {
                        // 直接的框对象数组格式，每个框都有自己的roomId
                        currentRoomBoxes = levelData.boxes.filter(box => box.roomId === game.currentRoomId);
                    }
                    
                    if (currentRoomBoxes.length > 0) {
                        // 加载框时对坐标应用格点吸附，确保左上角对齐到格点
                        game.boxes = currentRoomBoxes.map(box => {
                            // 直接将保存的x/y坐标视为左上角坐标，应用格点吸附
                            const snapped = snapToGrid(box.x, box.y);
                            return {
                                ...box,
                                x: snapped.x,
                                y: snapped.y,
                                roomId: game.currentRoomId // 确保框有roomId属性
                            };
                        });
                        console.log('已从boxes数组加载当前房间的框并应用格点吸附，数量:', game.boxes.length);
                    }
                }
                
                console.log('地形配置已成功从地形.json加载');
            } catch (e) {
                console.error('解析地形.json文件失败:', e);
            }
        } else {
            console.warn('无法加载地形.json文件，使用默认配置');
        }
        
        // 无论配置是否成功加载，都调用回调函数继续初始化
        if (callback) callback();
    };
    xhr.onerror = function() {
        console.warn('加载地形.json文件出错，使用默认配置');
        // 出错时也调用回调函数继续初始化
        if (callback) callback();
    };
    xhr.send();
}

// 加载按钮位置配置（使用内置配置，不再从外部文件加载）
function loadButtonPositions(callback) {
    try {
        // 使用内置配置
        window.buttonPositions = window.buttonPositionsConfig;
        console.log('按钮位置配置已从内置变量加载');
                
        // 应用关闭按钮配置
        if (window.buttonPositions.popup && window.buttonPositions.popup.closeButton) {
            const closeBtnConfig = window.buttonPositions.popup.closeButton;
            game.closeButton.width = closeBtnConfig.width;
            game.closeButton.height = closeBtnConfig.height;
            game.closeButton.text = closeBtnConfig.text;
            game.closeButton.color = closeBtnConfig.color || '#4CAF50';
            game.closeButton.textColor = closeBtnConfig.textColor || '#FFF';
            game.closeButton.fontSize = closeBtnConfig.fontSize || 20;
        }
        
        // 应用选项按钮配置
        if (window.buttonPositions.popup && window.buttonPositions.popup.optionButtons) {
            const optionsConfig = window.buttonPositions.popup.optionButtons;
            game.optionButtons.forEach((button, index) => {
                if (optionsConfig[index]) {
                    button.width = optionsConfig[index].width;
                    button.height = optionsConfig[index].height;
                    button.index = optionsConfig[index].index;
                    button.color = optionsConfig[index].color || '#2196F3';
                    button.textColor = optionsConfig[index].textColor || '#FFF';
                    button.fontSize = optionsConfig[index].fontSize || 20;
                }
            });
        }
    } catch (e) {
        console.error('加载按钮位置配置时出错:', e);
        window.buttonPositions = {};
    }
    
    // 无论配置是否成功加载，都调用回调函数继续初始化
    if (callback) callback();
}

// 游戏对象
const game = {
    canvas: null,
    ctx: null,
    player: {
        x: window.characterConfig.character.collision.x, // 左右各缩进20px，x坐标增加20
        y: window.characterConfig.character.collision.y, // 顶部缩进40px，y坐标增加40
        width: window.characterConfig.character.collision.width, // 保持宽度，现在位于角色中心
        height: window.characterConfig.character.collision.height, // 整体高度减小，从顶部缩进40px
        speed: window.characterConfig.character.movement.speed,
        horizontalSpeed: window.characterConfig.character.movement.horizontalSpeed, // 添加水平速度属性
        jumpForce: window.characterConfig.character.movement.jumpForce,
        velocityY: 0,
        isJumping: false,
        direction: 'right',
        spriteOffsetY: -27 // 默认精灵Y偏移量，与characterConfig.json中保持一致
    },
    // 动画图片
    idleImage: null,
    walkImage: null,
    coinImage: null, // 金币图片
    backgroundImage: null, // 背景图片
    // 音频文件
    coinSound: null, // 金币收集音效

    groundY: 540,

    gravity: 0.8,
    keys: {
        right: false,
        left: false,
        up: false
    },
    // 平台功能已完全删除
    coins: [], // 初始金币已删除
    coinsCollected: 0,
    showHelloPopup: false,
    popupTimer: 0,
    questions: null,
    filteredQuestions: [],
    currentQuestionIndex: 0,
    askedQuestions: [], // 已经问过的问题索引列表
    isLoading: true,
    isReadyToRender: false, // 控制是否开始渲染游戏画面
    // 弹窗按钮属性
    closeButton: {
        x: 0,
        y: 0,
        width: 120,
        height: 40,
        text: '关闭'
    },
    // 选项按钮属性
    optionButtons: [
        { x: 0, y: 0, width: 300, height: 40, text: '', index: 0 },
        { x: 0, y: 0, width: 300, height: 40, text: '', index: 1 },
        { x: 0, y: 0, width: 300, height: 40, text: '', index: 2 },
        { x: 0, y: 0, width: 300, height: 40, text: '', index: 3 }
    ],
    selectedOption: null,
    showResult: false,
    isCorrect: false,
    autoCloseTimer: null,
    attemptCount: 0,
    currentSubject: '历史', // 当前科目，初始化为历史（对应房间1）
    doors: [], // 门数组
    platforms: [], // 地形平台数组
    startTime: null, // 游戏开始时间
    currentRoomId: 1, // 当前房间ID
    coinHistory: [],
    coinHistoryIndex: 0,
    boxHistory: [],
    boxHistoryIndex: 0,
    victory: false, // 是否胜利
    snapToGrid: false, // 是否启用格点吸附
    gridSize: 32 // 网格大小
};

// 加载问题JSON文件
async function loadQuestions() {
    try {
        const response = await fetch('popupquestion.json');
        if (!response.ok) {
            throw new Error('无法加载问题文件');
        }
        const data = await response.json();
        game.questions = data.questions;
        game.isLoading = false;
    } catch (error) {
        console.error('加载问题失败:', error);
        // 如果加载失败，使用默认问题
        game.questions = [
            { title: "问题挑战！", content: "你最喜欢马里奥的哪个角色？" },
            { title: "趣味问答！", content: "马里奥最初叫什么名字？" },
            { title: "小测试！", content: "马里奥游戏中，蘑菇有什么作用？" }
        ];
        game.isLoading = false;
    }
}

// 撤销平台更改（已删除）


// 撤销金币更改
// undoCoinChange 函数已删除



// 撤销框更改
// undoBoxChange 函数已删除


//     
//     // 清除所有金币
//     game.coins = [];
//     
//     // 保存初始状态

// 保存游戏状态到本地存储
function saveGameStateToLocalStorage() {
    try {
        // 保存金币和框的历史记录
        localStorage.setItem('coinHistory', JSON.stringify(game.coinHistory));
        localStorage.setItem('coinHistoryIndex', game.coinHistoryIndex);
        localStorage.setItem('boxHistory', JSON.stringify(game.boxHistory));
        localStorage.setItem('boxHistoryIndex', game.boxHistoryIndex);
        // 保存已收集的金币数量
        localStorage.setItem('coinsCollected', game.coinsCollected);
    } catch (error) {
        console.warn('无法保存游戏状态到本地存储:', error);
    }
}

// 保存金币和框数据到地形.json格式
// saveToLevelJson 函数已删除

// 将模式切换函数暴露到window对象，确保HTML按钮可以调用
// 创建下载地形.json文件的函数
// downloadLevelJson 函数已删除

// 从本地存储加载游戏状态
function loadGameStateFromLocalStorage() {
    try {
        // 加载金币和框的历史记录
        const savedCoinHistory = localStorage.getItem('coinHistory');
        const savedCoinHistoryIndex = localStorage.getItem('coinHistoryIndex');
        const savedBoxHistory = localStorage.getItem('boxHistory');
        const savedBoxHistoryIndex = localStorage.getItem('boxHistoryIndex');
        const savedCoinsCollected = localStorage.getItem('coinsCollected');
        
        if (savedCoinHistory) {
            game.coinHistory = JSON.parse(savedCoinHistory);
        }
        if (savedCoinHistoryIndex !== null) {
            game.coinHistoryIndex = parseInt(savedCoinHistoryIndex);
        }
        if (savedBoxHistory) {
            game.boxHistory = JSON.parse(savedBoxHistory);
        }
        if (savedBoxHistoryIndex !== null) {
            game.boxHistoryIndex = parseInt(savedBoxHistoryIndex);
        }
        // 加载已收集的金币数量
        if (savedCoinsCollected !== null) {
            game.coinsCollected = parseInt(savedCoinsCollected);
        }
    } catch (error) {
        console.warn('无法从本地存储加载游戏状态:', error);
    }
}



// 保存金币状态到历史记录
// saveCoinState 函数已删除



// 保存框状态到历史记录
// saveBoxState 函数已删除

// 初始化场景布局 - 重新设计门的分布
function initSceneLayout() {
    // 从地形.json加载金币数据
    if (window.levelData && window.levelData.coins) {
        // 遍历每个房间的金币配置，找到当前房间的数据
        const currentRoomCoins = window.levelData.coins.find(roomData => roomData.roomId === game.currentRoomId);
        
        if (currentRoomCoins && currentRoomCoins.items) {
            // 转换金币数据格式，添加collected属性
            game.coins = currentRoomCoins.items.map(coin => ({
                ...coin,
                collected: false
            }));
            console.log(`房间${game.currentRoomId}的金币数据已从地形.json加载，共${game.coins.length}个金币`);
        } else {
            game.coins = [];
        }
    } else {
        // 如果没有加载到金币数据，使用默认配置
        console.warn('未能从地形.json加载金币数据，使用默认配置');
        game.coins = [
            { x: 250, y: 410, width: 20, height: 20, collected: false },
            { x: 700, y: 310, width: 20, height: 20, collected: false },
            { x: 950, y: 210, width: 20, height: 20, collected: false },
            { x: 850, y: 360, width: 20, height: 20, collected: false },
            { x: 1050, y: 260, width: 20, height: 20, collected: false }
        ];
    }
    
    // 从地形.json加载框数据
    if (window.levelData && window.levelData.boxes) {
        // 遍历每个房间的框配置，找到当前房间的数据
        const currentRoomBoxes = window.levelData.boxes.find(roomData => roomData.roomId === game.currentRoomId);
        
        if (currentRoomBoxes && currentRoomBoxes.items) {
            game.boxes = [...currentRoomBoxes.items];
            console.log(`房间${game.currentRoomId}的框数据已从地形.json加载，共${game.boxes.length}个框`);
        } else {
            game.boxes = [];
        }
    } else {
        game.boxes = [];
    }
}







// 初始化游戏

// 测试门解锁条件功能
function testDoorUnlockCondition() {
    console.log('===== 开始测试门解锁条件功能 =====');
    
    // 模拟一些金币数据进行测试
    const testCoins = [
        { roomId: 1, collected: true, isCorrect: true, id: 'test1' },
        { roomId: 1, collected: true, isCorrect: true, id: 'test2' },
        { roomId: 2, collected: true, isCorrect: false, id: 'test3' }
    ];
    
    // 保存原始金币数据
    const originalCoins = game.coins;
    const originalRoomId = game.currentRoomId;
    
    try {
        // 测试场景1：房间1有两个金币，都已收集且回答正确
        game.coins = testCoins;
        game.currentRoomId = 1;
        const result1 = checkAllCoinsAnsweredCorrectly();
        console.log('测试场景1 (所有金币都回答正确):', result1);
        
        // 测试场景2：房间2有一个金币，已收集但回答错误
        game.currentRoomId = 2;
        const result2 = checkAllCoinsAnsweredCorrectly();
        console.log('测试场景2 (有金币回答错误):', result2);
        
        // 测试场景3：房间3没有金币
        game.currentRoomId = 3;
        const result3 = checkAllCoinsAnsweredCorrectly();
        console.log('测试场景3 (没有金币):', result3);
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    } finally {
        // 恢复原始数据
        game.coins = originalCoins;
        game.currentRoomId = originalRoomId;
    }
    
    console.log('===== 测试完成 =====');
}

// 初始化游戏
async function initGame() {
    // 初始化音效管理器
    if (window.soundManager) {
        await window.soundManager.init();
        console.log('游戏音效系统初始化完成');
    } else {
        console.warn('音效管理器未找到，将使用备用音效播放方式');
        // 定义备用的音效播放函数，以防soundManager加载失败
        if (!window.playCorrectSound) {
            window.playCorrectSound = function() {
                try {
                    const audio = new Audio('c:\\逃离校园 - 副本\\飞书20251201-160841.mp3');
                    audio.play().catch(e => console.error('播放正确音效失败:', e));
                } catch (e) {
                    console.error('创建正确音效对象失败:', e);
                }
            };
        }
        if (!window.playIncorrectSound) {
            window.playIncorrectSound = function() {
                try {
                    const audio = new Audio('c:\\逃离校园 - 副本\\飞书20251202-230857.mp3');
                    audio.play().catch(e => console.error('播放错误音效失败:', e));
                } catch (e) {
                    console.error('创建错误音效对象失败:', e);
                }
            };
        }
    }
    try {
        console.log('开始游戏初始化...');
        
        // 运行门解锁条件功能测试
        testDoorUnlockCondition();
        
        // 确保game对象已正确初始化
        if (typeof game !== 'object') {
            console.error('game对象未正确初始化！');
            return;
        }
        
        // 初始化背景图片对象（具体的图片路径将在loadLevelData中根据当前房间设置）
        game.backgroundImage = new Image();
        game.backgroundImage.onload = function() {
            console.log('背景图片加载成功');
        };
        game.backgroundImage.onerror = function() {
            console.error('背景图片加载失败');
        };
        
        // 获取Canvas元素和上下文 - 添加错误处理
        try {
            game.canvas = document.getElementById('gameCanvas');
            if (!game.canvas) {
                console.error('未找到gameCanvas元素！');
                // 创建临时canvas作为后备
                const tempCanvas = document.createElement('canvas');
                tempCanvas.id = 'gameCanvas';
                tempCanvas.width = 1200;
                tempCanvas.height = 600;
                document.body.appendChild(tempCanvas);
                game.canvas = tempCanvas;
                console.log('已创建后备canvas元素');
            }
            
            game.ctx = game.canvas.getContext('2d');
            if (!game.ctx) {
                console.error('无法获取canvas上下文！');
                return;
            }
            
            // 设置画布尺寸
            game.canvas.width = 1200;
            game.canvas.height = 600;
            console.log('画布尺寸设置为:', game.canvas.width, 'x', game.canvas.height);
        } catch (err) {
            console.error('Canvas初始化错误:', err);
            return;
        }
        
        // 初始化地面位置（确保有合理的默认值）
        game.groundY = Math.min(540, game.canvas.height - 50);
        console.log('初始化地面Y坐标:', game.groundY);
        
        // 初始化地面碰撞箱高度（如果还未初始化）
        if (game.groundCollisionHeight === undefined) {
            game.groundCollisionHeight = 10; // 默认值
        }
        
        // 记录游戏开始时间
        game.startTime = Date.now();
        
        // 加载金币图片
        game.coinImage = new Image();
        game.coinImage.src = '金币.png';
        game.coinImage.onload = function() {
            console.log('金币图片加载成功');
        };
        game.coinImage.onerror = function() {
            console.error('金币图片加载失败');
        };
        
        // 加载金币收集音效
        try {
            game.coinSound = new Audio('lv_0_20251201152822.mp3');
            game.coinSound.preload = 'auto';
            // 预加载音频以减少第一次播放的延迟
            game.coinSound.load();
            console.log('金币音效文件加载完成');
        } catch (audioError) {
            console.error('金币音效文件加载失败:', audioError);
        }
        
        // 直接添加测试金币，确保有内容可渲染
        if (game.coins && Array.isArray(game.coins) && game.coins.length === 0) {
            console.log('添加测试金币');
            game.coins.push({
                x: 200,
                y: 450,
                width: 20,
                height: 20,
                collected: false
            });
            game.coins.push({
                x: 300,
                y: 400,
                width: 20,
                height: 20,
                collected: false
            });
        }
        
        // 直接添加测试门
        if (game.doors && Array.isArray(game.doors) && game.doors.length === 0) {
            console.log('添加测试门');
            game.doors.push({
                x: game.canvas.width - 80,
                y: game.groundY - 100,
                width: 60,
                height: 100,
                roomId: 1,
                targetRoomId: 2
            });
        }
        
        // 基本事件监听器 - 先添加必要的事件监听
        try {
            // 键盘事件监听
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            
            // 添加全局键盘事件测试
            document.addEventListener('keydown', function(e) {
                if (e.key.toLowerCase() === 't') {
                    console.log('全局T键事件触发');
                    // 添加调试信息
                    // console.log('当前角色碰撞箱尺寸:', game.player ? game.player.width : '未定义', 'x', game.player ? game.player.height : '未定义');
                    console.log('当前金币列表:', game.coins ? game.coins.length : '未定义', game.coins);
                    console.log('当前金币放置模式状态:', game.coinPlacementMode);
                }
            });
            
            // 移除document上的click事件，避免事件冲突
            console.log('已移除document上的click事件监听，将只使用canvas上的click事件');
            
            // 鼠标事件监听
            game.canvas.addEventListener('mousemove', function(e) {
                try {
                    const rect = game.canvas.getBoundingClientRect();
                    let x = e.clientX - rect.left;
                    let y = e.clientY - rect.top;
                    
                    // 吸附到格点
                    if (typeof snapToGrid === 'function') {
                        const snapped = snapToGrid(x, y);
                        if (window.gameMousePos) {
                            window.gameMousePos.x = snapped.x;
                            window.gameMousePos.y = snapped.y;
                        }
                    }
                } catch (err) {
                    console.error('鼠标移动事件错误:', err);
                }
            });
            
            game.canvas.addEventListener('mouseleave', function() {
                window.gameMousePos = null;
            });
        } catch (err) {
            console.error('事件监听器初始化错误:', err);
        }
        
        // 尝试加载配置，但不阻塞游戏启动
        try {
            // 初始化问题弹窗管理器
            if (window.questionPopupManager && typeof window.questionPopupManager.init === 'function') {
                window.questionPopupManager.init(game);
                console.log('问题弹窗管理器初始化完成');
                
                // 加载问题数据
                if (typeof window.questionPopupManager.loadQuestions === 'function') {
                    window.questionPopupManager.loadQuestions();
                    console.log('问题数据加载开始');
                }
            } else {
                console.error('问题弹窗管理器不存在或未正确初始化');
            }
            
            // 加载角色配置
            if (typeof loadCharacterConfig === 'function') {
                loadCharacterConfig(function() {
                    console.log('角色配置加载完成');
                });
            }
            
            // 加载关卡数据 - 设置超时保护
            const levelDataTimeout = setTimeout(() => {
                console.warn('关卡数据加载超时，使用默认值');
                // 确保groundY有值
                game.groundY = Math.min(540, game.canvas.height - 50);
            }, 1000);
            
            if (typeof loadLevelData === 'function') {
                loadLevelData(async function() {
                    clearTimeout(levelDataTimeout);
                    console.log('关卡数据加载完成');
                    // 验证groundY值是否有效
                    if (game.groundY === undefined || typeof game.groundY !== 'number' || game.groundY < 0 || game.groundY > game.canvas.height) {
                        game.groundY = Math.min(540, game.canvas.height - 50);
                        console.warn('验证并重置groundY值为:', game.groundY);
                    }
                });
            } else {
                clearTimeout(levelDataTimeout);
            }
            
            // 初始化角色动画属性和加载动画图片
            if (window.animationManager && typeof window.animationManager === 'object') {
                try {
                    console.log('尝试初始化角色动画...');
                    // 确保player对象有必要的动画属性
                    if (!game.player.isWalking) game.player.isWalking = false;
                    if (!game.player.currentFrame) game.player.currentFrame = 0;
                    if (!game.player.frameCount) game.player.frameCount = 0;
                    
                    // 初始化动画
                    if (typeof window.animationManager.initPlayerAnimation === 'function') {
                        window.animationManager.initPlayerAnimation(game.player);
                        console.log('角色动画初始化成功');
                    } else if (typeof window.animationManager.initAnimation === 'function') {
                        // 备用初始化方法
                        window.animationManager.initAnimation(game.player);
                        console.log('使用备用方法初始化角色动画');
                    }
                    
                    // 加载动画图片（图片会存储在animationManager内部）
                    if (typeof window.animationManager.loadAnimationImages === 'function') {
                        console.log('开始加载动画图片...');
                        window.animationManager.loadAnimationImages(function(success) {
                            console.log('动画图片加载完成，成功状态:', success);
                            console.log('当前使用的角色目录:', window.animationManager.currentCharacterDir);
                            console.log('是否已加载正式资源:', window.animationManager.hasFormalResources);
                            
                            // 延迟设置游戏为可渲染状态，确保正式资源完全就绪
                            setTimeout(function() {
                                if (window.animationManager.hasFormalResources) {
                                    console.log('✓ 正式资源已就绪，开始渲染游戏');
                                } else {
                                    console.log('⚠ 仅使用备用资源，开始渲染游戏');
                                }
                                game.isReadyToRender = true;
                                game.isLoading = false;
                            }, 500); // 500ms延迟，确保资源完全就绪
                        });
                    }
                    
                    // 更新动画配置的帧延迟
                    try {
                        if (window.characterConfig && window.characterConfig.character && 
                            window.characterConfig.character.animation && 
                            window.characterConfig.character.animation.frameDelay && 
                            window.animationManager && window.animationManager.config) {
                            const frameDelay = window.characterConfig.character.animation.frameDelay;
                            if (frameDelay.idle !== undefined) {
                                window.animationManager.config.idle.frameDelay = frameDelay.idle;
                            }
                            if (frameDelay.walk !== undefined) {
                                window.animationManager.config.walk.frameDelay = frameDelay.walk;
                            }
                            console.log('动画配置已更新:', window.animationManager.config);
                            console.log('动画帧延迟配置更新成功');
                        } else {
                            console.warn('无法更新动画配置：缺少必要的配置对象');
                        }
                    } catch (configError) {
                        console.warn('更新动画配置时出错:', configError);
                    }
                } catch (err) {
                    console.error('角色动画初始化错误:', err);
                    console.log('将使用内置的简单动画逻辑');
                }
            } else {
                console.warn('animationManager未定义，将使用内置简单动画逻辑');
                // 直接设置基本动画属性
                game.player.isWalking = false;
                game.player.currentFrame = 0;
                game.player.frameCount = 0;
            }
        } catch (err) {
            console.error('配置加载错误:', err);
        }
        
        // 注意：isLoading状态将在动画图片加载完成后设置为false
        
        // 初始化历史记录，确保有初始状态
        if (game.coinHistory.length === 0) {
            game.coinHistory = [JSON.parse(JSON.stringify(game.coins || []))];
            game.coinHistoryIndex = 0;
        }
        
        if (game.boxHistory.length === 0) {
            game.boxHistory = [JSON.parse(JSON.stringify(game.boxes || []))];
            game.boxHistoryIndex = 0;
        }
        
        console.log('基础游戏状态初始化完成');
        // 播放背景音乐
        if (window.playGameBackgroundMusic) {
            window.playGameBackgroundMusic();
        }
        
        // 确保游戏开始渲染
        game.isLoading = false;
        game.isReadyToRender = true;
        console.log('游戏开始渲染');
        
        // 启动游戏循环 - 立即启动，不依赖其他加载
        console.log('准备启动游戏循环');
        requestAnimationFrame(gameLoop);
        
        // 设置3秒后再次确认游戏循环运行
        setTimeout(() => {
            if (game && !game.loopRunning) {
                console.warn('再次尝试启动游戏循环');
                requestAnimationFrame(gameLoop);
            }
        }, 3000);
        
        // 只添加必要的鼠标点击事件，删除了框放置模式和金币放置模式相关的鼠标事件
        game.canvas.addEventListener('click', handleClick);
        console.log('已添加必要的鼠标事件监听器');
        
    } catch (err) {
        console.error('游戏初始化严重错误:', err);
        // 记录错误并尝试继续正常的游戏启动流程，不使用任何备用页面或备用机制
        if (game && game.ctx) {
            game.isLoading = false;
            requestAnimationFrame(gameLoop);
        }
    }
}

// 处理键盘按下事件
function handleKeyDown(e) {
    // 只有当弹窗不显示时才处理按键输入
    if (game.showHelloPopup) {
        console.log('弹窗显示中，不处理按键');
        return;
    }
    
    switch(e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
            game.keys.right = true;
            if (window.animationManager && typeof window.animationManager.handleKeyDown === 'function') {
                try {
                    window.animationManager.handleKeyDown(game.player, game.keys, e.key);
                } catch (error) {
                    console.error('处理按键按下动画时出错:', error);
                }
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            game.keys.left = true;
            if (window.animationManager && typeof window.animationManager.handleKeyDown === 'function') {
                try {
                    window.animationManager.handleKeyDown(game.player, game.keys, e.key);
                } catch (error) {
                    console.error('处理按键按下动画时出错:', error);
                }
            }
            break;
        case 'ArrowUp':
            game.keys.up = true;
            break;
        case ' ': // 空格键也可以跳跃
            e.preventDefault(); // 防止空格滚动页面
            if (!game.player.isJumping) {
                jump();
            }
            break;
    }
}

// 处理键盘松开事件
function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
            game.keys.right = false;
            if (window.animationManager && typeof window.animationManager.handleKeyUp === 'function') {
                try {
                    window.animationManager.handleKeyUp(game.player, game.keys, e.key);
                } catch (error) {
                    console.error('处理按键释放动画时出错:', error);
                }
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            game.keys.left = false;
            if (window.animationManager && typeof window.animationManager.handleKeyUp === 'function') {
                try {
                    window.animationManager.handleKeyUp(game.player, game.keys, e.key);
                } catch (error) {
                    console.error('处理按键释放动画时出错:', error);
                }
            }
            break;
        case 'ArrowUp':
            game.keys.up = false;
            break;
    }
}

// 检查点是否在矩形内
function isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

// 检查点是否在选项按钮内
function isPointInOptionButton(x, y) {
    for (let i = 0; i < game.optionButtons.length; i++) {
        const button = game.optionButtons[i];
        if (button && isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
            return i;
        }
    }
    return -1;
}

// 保存当前场景状态
// 场景导航相关函数已移除





// 吸附到格点
// 格点吸附函数，用于将坐标对齐到指定的网格大小
function snapToGrid(x, y) {
    // 如果snapToGrid为false，则直接返回原始坐标
    if (!game.snapToGrid) {
        return { x, y };
    }
    // 默认网格大小为32
    const gridSize = game.gridSize || 32;
    // 计算吸附后的坐标
    return {
        x: Math.floor(x / gridSize) * gridSize,
        y: Math.floor(y / gridSize) * gridSize
    };
}

// 处理鼠标按下事件（用于框放置模式）
// 鼠标事件处理函数已移除

// 处理点击事件
function handleClick(e) {
    console.log('handleClick函数被调用');
    
    if (game.isLoading) {
        console.log('游戏正在加载，跳过点击处理');
        return;
    }
    
    // 获取鼠标在画布上的位置
    const rect = game.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('点击位置:', {clientX: e.clientX, clientY: e.clientY, canvasX: x, canvasY: y});
    

    
    // 如果弹窗显示中
    if (game.showHelloPopup) {
        console.log('弹窗显示中，处理点击事件');
        // 优先使用questionPopupManager处理弹窗点击事件
        let handled = false;
        if (window.questionPopupManager && typeof window.questionPopupManager.handlePopupClick === 'function') {
            try {
                handled = window.questionPopupManager.handlePopupClick(x, y);
                console.log('questionPopupManager处理弹窗点击结果:', handled);
            } catch (popupError) {
                console.error('处理弹窗点击时出错:', popupError);
            }
        } 
        
        // 如果questionPopupManager不可用或未处理点击，使用本地备选方案
        if (!handled) {
            console.log('使用本地备选方案处理弹窗点击');
            // 检查点击是否在选项按钮上
            const clickedOption = isPointInOptionButton(x, y);
            if (clickedOption !== -1) {
                console.log('点击了选项按钮:', clickedOption);
                // 处理选项点击
                game.selectedOption = clickedOption;
                game.showResult = true;
                // 检查答案是否正确
                if (game.questions && game.questions[game.currentQuestionIndex]) {
                    const question = game.questions[game.currentQuestionIndex];
                    const correctIndex = question.correctAnswer; // 使用correctAnswer属性，与数据文件保持一致
                    const selectedOptionText = game.optionButtons[clickedOption]?.text || '';
                    
                    // 简化的答案验证逻辑，只使用索引比较，确保只有正确的选项被认为是正确答案
                    let isCorrectResult = false;
                    
                    // 只进行索引比较
                    if (clickedOption === correctIndex) {
                        isCorrectResult = true;
                        console.log('答案验证 - 索引匹配成功:', clickedOption, '=', correctIndex);
                    } else {
                        console.log('答案验证 - 索引不匹配:', clickedOption, '≠', correctIndex);
                    }
                    
                    game.isCorrect = isCorrectResult;
                    console.log('最终答案检查结果:', game.isCorrect);
                    
                    // 将回答结果保存到最近收集的金币对象中
                    if (game.lastCollectedCoin) {
                        game.lastCollectedCoin.isCorrect = isCorrectResult;
                        console.log('金币回答结果已保存:', {result: game.lastCollectedCoin.isCorrect, coinId: game.lastCollectedCoin.id});
                        
                        // 同时记录到game对象，方便调试
                        game.lastAnswerResult = isCorrectResult;
                        console.log('游戏状态更新: lastAnswerResult =', game.lastAnswerResult);
                    } else {
                        console.warn('未找到最近收集的金币，无法保存回答结果');
                        
                        // 尝试修复：如果没有lastCollectedCoin，但有已收集的金币，找到最后一个未设置isCorrect的金币
                        const collectedButNoResultCoins = game.coins.filter(
                            coin => coin && coin.collected && 'isCorrect' in coin === false
                        );
                        
                        if (collectedButNoResultCoins.length > 0) {
                            const lastCoinWithoutResult = collectedButNoResultCoins[collectedButNoResultCoins.length - 1];
                            lastCoinWithoutResult.isCorrect = isCorrectResult;
                            console.log('已修复：找到并更新了一个未设置isCorrect的已收集金币');
                            game.lastCollectedCoin = lastCoinWithoutResult; // 同时更新lastCollectedCoin引用
                        }
                    }
                    
                    // 当回答正确时播放音效
                    if (isCorrectResult) {
                        playCorrectSound();
                    } else {
                        playIncorrectSound();
                    }
                }
                // 设置自动关闭定时器
                clearTimeout(game.autoCloseTimer);
                game.autoCloseTimer = setTimeout(() => {
                    game.showHelloPopup = false;
                    game.showResult = false;
                    game.selectedOption = null;
                    console.log('弹窗自动关闭');
                }, 2000);
                handled = true;
            }
            
            // 检查点击是否在关闭按钮上
            if (!handled && game.closeButton) {
                const { x: btnX, y: btnY, width: btnW, height: btnH } = game.closeButton;
                if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
                    console.log('点击了关闭按钮');
                    game.showHelloPopup = false;
                    game.showResult = false;
                    game.selectedOption = null;
                    clearTimeout(game.autoCloseTimer);
                    handled = true;
                }
            }
        }
    }
    // 移除自动弹窗逻辑，确保只有收集金币时才显示问题
}

// 显示问题弹窗
function showHelloPopup() {
    game.showHelloPopup = true;
    game.selectedOption = null;
    game.showResult = false;
    game.isCorrect = false;
    game.attemptCount = 0;
    // 移除自动关闭计时器，改为手动关闭
    
    // 停止全局背景音乐
    if (window.stopGameBackgroundMusic) {
        window.stopGameBackgroundMusic();
    }
    
    // 播放答题背景音乐
    if (window.playQuestionBackgroundMusic) {
        window.playQuestionBackgroundMusic();
    }
    
    // 获取布局配置，如果没有则使用默认值
    const layoutConfig = window.buttonPositions?.popup?.layout || {};
    const verticalSpacing = layoutConfig.verticalSpacing || 50;
    const optionsStartYOffset = layoutConfig.optionsStartYOffset || 80;
    const closeButtonYOffset = layoutConfig.closeButtonYOffset || 20;
    const centerX = layoutConfig.centerX !== undefined ? layoutConfig.centerX : true;
    const centerY = layoutConfig.centerY !== undefined ? layoutConfig.centerY : true;
    
    // 根据当前房间ID筛选对应科目的问题
    if (game.questions && game.questions.length > 0) {
        // 确定当前房间对应的科目
        let currentSubject = game.currentSubject;
        
        // 如果currentSubject未设置（比如首次加载），根据currentRoomId设置
        if (!currentSubject) {
            switch(game.currentRoomId) {
                case 1:
                    currentSubject = "历史";
                    break;
                case 2:
                    currentSubject = "数学";
                    break;
                case 3:
                    currentSubject = "英语";
                    break;
                default:
                    // 默认使用所有科目
                    currentSubject = null;
            }
        }
        
        console.log("当前房间ID:", game.currentRoomId, "当前科目:", currentSubject);
        
        // 筛选对应科目的问题
        let filteredQuestions = game.questions;
        if (currentSubject) {
            // 显示所有问题的科目信息（调试用）
            console.log("所有问题的科目列表:", game.questions.map(q => q.subject));
            
            // 使用更健壮的筛选条件，确保科目匹配
            filteredQuestions = game.questions.filter(question => {
                // 去除可能的空格并进行严格比较
                const questionSubject = question.subject ? question.subject.trim() : '';
                const targetSubject = currentSubject.trim();
                return questionSubject === targetSubject;
            });
        }
        
        console.log("当前科目:", currentSubject, "筛选后问题数量:", filteredQuestions.length);
        
        // 如果筛选后没有问题，回退到使用所有问题
        if (filteredQuestions.length === 0) {
            console.warn("当前科目没有找到匹配的问题，将使用所有问题");
            filteredQuestions = game.questions;
        }
        
        // 将筛选后的问题数组存储在game对象中
        game.filteredQuestions = filteredQuestions;
        console.log("筛选后的问题科目列表:", filteredQuestions.map(q => q.subject));
        
        // 实现不重复抽取问题的逻辑
        // 从筛选后的问题中排除已经问过的问题
        const availableQuestions = filteredQuestions.filter((question, index) => {
            return !game.askedQuestions.includes(index);
        });
        
        let selectedIndex;
        if (availableQuestions.length > 0) {
            // 如果还有未问过的问题，从剩余问题中随机选择
            const randomAvailableIndex = Math.floor(Math.random() * availableQuestions.length);
            // 找到这个问题在filteredQuestions中的原始索引
            selectedIndex = filteredQuestions.indexOf(availableQuestions[randomAvailableIndex]);
        } else {
            // 如果所有问题都问过了，清空askedQuestions列表重新开始
            console.log("所有问题都已问过，重置问题列表");
            game.askedQuestions = [];
            // 从所有筛选后的问题中随机选择一个
            selectedIndex = Math.floor(Math.random() * filteredQuestions.length);
        }
        
        // 设置当前问题索引
        game.currentQuestionIndex = selectedIndex;
        // 将当前问题索引添加到已问问题列表中
        game.askedQuestions.push(selectedIndex);
        
        console.log("选择的问题索引:", game.currentQuestionIndex);
        console.log("问题科目:", filteredQuestions[game.currentQuestionIndex].subject);
        console.log("已问问题列表:", game.askedQuestions);
        
        // 设置选项按钮位置和文本，确保所有按钮都被重置
        game.optionButtons.forEach((button, index) => {
        // 重置所有按钮文本
        button.text = '';
        
        // 使用布局配置设置按钮位置
        if (centerX) {
            button.x = game.canvas.width/2 - button.width/2;
        }
        if (centerY) {
            button.y = game.canvas.height/2 + optionsStartYOffset + (index * verticalSpacing);
        }
        
        // 只在有选项时设置文本
        if (filteredQuestions[game.currentQuestionIndex].options && filteredQuestions[game.currentQuestionIndex].options[index]) {
            button.text = filteredQuestions[game.currentQuestionIndex].options[index];
        }
    });
    }
    // 设置关闭按钮位置
    if (centerX) {
        game.closeButton.x = game.canvas.width/2 - game.closeButton.width/2;
    }
    if (centerY) {
        game.closeButton.y = game.canvas.height/2 + optionsStartYOffset + (game.optionButtons.length * verticalSpacing) + closeButtonYOffset;
    }
}



// 跳跃功能
function jump() {
    game.player.velocityY = -game.player.jumpForce;
    game.player.isJumping = true;
    
    // 播放跳跃音效
    try {
        if (game.coinSound) {
            // 重置音频并播放
            game.coinSound.currentTime = 0;
            game.coinSound.play().catch(error => {
                console.error('播放跳跃音效失败:', error);
            });
        }
    } catch (audioError) {
        console.error('处理跳跃音效时出错:', audioError);
    }
}

// drawGrid 函数已删除

// 更新游戏状态
// 备用动画逻辑函数 - 提取为独立函数以提高可维护性和Edge兼容性
function useFallbackAnimation(player) {
    try {
        // 确保player对象存在所有必要属性
        if (!player.frameCount) player.frameCount = 0;
        if (player.currentFrame === undefined) player.currentFrame = 0;
        if (player.isWalking === undefined) player.isWalking = false;
        
        player.frameCount++;
        // 简化的帧切换逻辑，减少Edge浏览器中的计算复杂度
        if (player.isWalking) {
            // 使用更简单的帧动画逻辑
            if (player.frameCount % 6 === 0) { // 增加间隔减少计算
                player.currentFrame = (player.currentFrame + 1) % 6; // 减少帧数
            }
        } else {
            player.currentFrame = 0; // 重置为站立帧
        }
    } catch (e) {
        console.error('备用动画逻辑出错:', e);
    }
}

function update() {
    try {
        // 如果游戏正在加载，不进行更新
        if (game.isLoading) return;
        
        // 确保questionPopupManager存在且updatePopup方法可用
        if (window.questionPopupManager && typeof window.questionPopupManager.updatePopup === 'function') {
            try {
                window.questionPopupManager.updatePopup();
            } catch (popupError) {
                console.error('更新弹窗状态时出错:', popupError);
            }
        }
        
        // 初始化player对象中的动画相关属性（如果不存在）
        if (!game.player.isWalking) game.player.isWalking = false;
        if (!game.player.currentFrame) game.player.currentFrame = 0;
        if (!game.player.frameCount) game.player.frameCount = 0;
        
        // 更新角色移动状态 - 在空中时不播放走路动画但保持方向控制
        game.player.isWalking = (game.keys.right || game.keys.left) && !game.player.isJumping;
        
        // 只有当弹窗不显示时才能移动
        if (!game.showHelloPopup) {
            // 处理水平移动
            if (game.keys.right) {
                game.player.x += game.player.horizontalSpeed || 4; // 添加默认值以防属性不存在
                game.player.direction = 'right';
            }
            if (game.keys.left) {
                game.player.x -= game.player.horizontalSpeed || 4; // 添加默认值以防属性不存在
                game.player.direction = 'left';
            }
            
            // 处理跳跃
            if (game.keys.up && !game.player.isJumping) {
                jump();
            }
        }
        
        // 安全地更新动画，增强Edge兼容性
        try {
            // 使用更安全的动画更新方式
            if (window.animationManager && typeof window.animationManager.updateAnimation === 'function') {
                try {
                    window.animationManager.updateAnimation(game.player);
                } catch (animationError) {
                    console.error('动画更新失败:', animationError);
                    // 强制使用备用动画逻辑
                    useFallbackAnimation(game.player);
                }
            } else {
                // 备用动画逻辑
                useFallbackAnimation(game.player);
            }
        } catch (e) {
            console.error('动画处理出错:', e);
            // 即使出错也要确保游戏继续运行
            // 即使出错也要确保游戏继续运行
        }
        
        // 无论弹窗是否显示，都应用重力和碰撞检测（保持物理效果）
        // 应用重力
        game.player.velocityY += game.gravity;
        game.player.y += game.player.velocityY;
        
        // 平台碰撞检测 - 使用从levelData.json加载的平台数据
        let onGround = false;
        
        // 遍历所有平台进行碰撞检测
        try {
            // 确保game.platforms存在且是数组
            if (game.platforms && Array.isArray(game.platforms)) {
                // 使用for循环代替forEach，提高Edge浏览器兼容性
                for (let i = 0; i < game.platforms.length; i++) {
                    const platform = game.platforms[i];
                    // 确保平台对象具有必要的属性
                    if (!platform || typeof platform.x !== 'number' || typeof platform.y !== 'number' ||
                        typeof platform.width !== 'number' || typeof platform.height !== 'number') {
                        continue;
                    }
                    // 只有在向下移动时才检测平台碰撞
                    if (game.player.velocityY > 0 &&
                        game.player.y + game.player.height <= platform.y + 10 && // 接近平台顶部
                        game.player.y + game.player.height + game.player.velocityY >= platform.y && // 下帧会碰到平台
                        game.player.x + game.player.width > platform.x &&
                        game.player.x < platform.x + platform.width) {
                        
                        // 放置玩家在平台顶部
                        game.player.y = platform.y - game.player.height;
                        game.player.velocityY = 0;
                        game.player.isJumping = false;
                        onGround = true;
                    }
                }
            }
        } catch (e) {
            // console.error('平台碰撞检测出错:', e);
            // 静默忽略错误，确保游戏继续运行
        }
        
        // 框碰撞检测 - 使玩家可以站在框上
        try {
            // 确保game.boxes存在且是数组
            if (game.boxes && Array.isArray(game.boxes)) {
                // 使用for循环代替forEach，提高Edge浏览器兼容性
                for (let i = 0; i < game.boxes.length; i++) {
                    const box = game.boxes[i];
                    // 确保框对象具有必要的属性
                    if (!box || typeof box.x !== 'number' || typeof box.y !== 'number' ||
                        typeof box.width !== 'number' || typeof box.height !== 'number') {
                        continue;
                    }
                    // 只有在向下移动时才检测框碰撞，与平台碰撞逻辑相同
                    if (game.player.velocityY > 0 &&
                        game.player.y + game.player.height <= box.y + 10 && // 接近框顶部
                        game.player.y + game.player.height + game.player.velocityY >= box.y && // 下帧会碰到框
                        game.player.x + game.player.width > box.x &&
                        game.player.x < box.x + box.width) {
                        
                        // 放置玩家在框顶部
                        game.player.y = box.y - game.player.height;
                        game.player.velocityY = 0;
                        game.player.isJumping = false;
                        onGround = true;
                    }
                }
            }
        } catch (e) {
            // console.error('框碰撞检测出错:', e);
            // 静默忽略错误，确保游戏继续运行
        }
        
        // 底部固定地板碰撞检测 - 直接使用groundY作为地面位置
        if (!onGround && game.player.y + game.player.height >= game.groundY && game.player.velocityY > 0) {
            game.player.y = game.groundY - game.player.height;
            game.player.velocityY = 0;
            game.player.isJumping = false;
            onGround = true;
        }
        
        // 边界检测
        if (game.player.x < 0) game.player.x = 0;
        if (game.canvas && game.player.x + game.player.width > game.canvas.width) {
            // 胜利条件检测：所有金币吃完后，在房间3碰到右侧墙壁获胜
            if (game.currentRoomId === 3) {
                // 检查是否所有金币都已收集
                const allCoinsCollected = Array.isArray(game.coins) && game.coins.every(coin => coin.collected);
                if (allCoinsCollected) {
                    // 玩家碰到右侧墙壁，触发胜利
                    game.victory = true;
                } else {
                    // 不是胜利条件，只是普通边界
                    game.player.x = game.canvas.width - game.player.width;
                }
            } else {
                // 不是房间3，只是普通边界
                game.player.x = game.canvas.width - game.player.width;
            }
        }
        
        // 只有当弹窗不显示时才能收集硬币
        if (!game.showHelloPopup && Array.isArray(game.coins)) {
            // 硬币收集检测
            game.coins.forEach(coin => {
                if (!coin) return;
                if (!coin.collected &&
                    game.player.x + game.player.width > coin.x &&
                    game.player.x < coin.x + coin.width &&
                    game.player.y + game.player.height > coin.y &&
                    game.player.y < coin.y + coin.height) {
                    // 确保金币有唯一ID
                    if (!coin.id) {
                        coin.id = 'coin_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    }
                    
                    // 确保金币有roomId属性
                    if (coin.roomId === undefined) {
                        coin.roomId = game.currentRoomId;
                    }
                    
                    // 设置金币为已收集
                    coin.collected = true;
                    game.coinsCollected++;
                    
                    // 清除可能存在的旧isCorrect值，确保每次收集都重新判断
                    delete coin.isCorrect;
                    
                    // 记录最近收集的金币
                    game.lastCollectedCoin = coin;
                    
                    console.log('金币被收集！', {
                        currentCount: game.coinsCollected,
                        coinId: coin.id,
                        coinRoomId: coin.roomId,
                        coinPosition: {x: coin.x, y: coin.y}
                    });
                    
                    // 记录到game对象，方便调试
                    game.lastCollectedCoinId = coin.id;
                    
                    // 金币收集音效已移除，改为跳跃时播放
                    
                    // 检查游戏是否已经开始1.5秒以上
                    const currentTime = Date.now();
                    const gameStarted = game.startTime !== null;
                    const enoughTimePassed = gameStarted && (currentTime - game.startTime > 1500);
                    
                    if (enoughTimePassed) {
                        // 每收集一个硬币显示一次问好弹窗
                        if (window.questionPopupManager && typeof window.questionPopupManager.showHelloPopup === 'function') {
                            try {
                                console.log('尝试显示问题弹窗...');
                                window.questionPopupManager.showHelloPopup();
                                console.log('问题弹窗显示命令已发送');
                            } catch (popupError) {
                                console.error('显示问好弹窗时出错:', popupError);
                            }
                        } else if (typeof showHelloPopup === 'function') {
                            // 备选方案：如果questionPopupManager不可用，使用本地函数
                            try {
                                console.log('使用本地showHelloPopup函数...');
                                showHelloPopup();
                            } catch (popupError) {
                                console.error('使用本地函数显示弹窗时出错:', popupError);
                            }
                        } else {
                            console.warn('无法显示问题弹窗：questionPopupManager未初始化且无本地showHelloPopup函数');
                        }
                    } else {
                        console.log('游戏开始后1.5秒内不显示问题弹窗');
                    }
                }
            });
        }
        
        // 检查玩家与门的碰撞
        if (typeof checkDoorCollision === 'function') {
            checkDoorCollision();
        }
    } catch (updateError) {
        console.error('游戏更新失败:', updateError);
        // 即使更新出错也继续尝试，确保游戏不会完全崩溃
    }
}

// 检查当前房间内所有金币问题是否都回答正确
function checkAllCoinsAnsweredCorrectly() {
    // 首先确保game.coins是数组
    if (!Array.isArray(game.coins)) {
        console.log('金币数组不存在或不是数组，门锁定状态');
        return false;
    }
    
    // 获取当前房间的金币
    // 添加兼容性处理：金币可能没有roomId属性，这时候将其视为当前房间的金币
    const currentRoomCoins = game.coins.filter(coin => 
        coin && (coin.roomId === game.currentRoomId || coin.roomId === undefined)
    );
    
    // 输出详细的调试信息
    console.log('检查当前房间金币状态:', {currentRoomId: game.currentRoomId, totalCoins: game.coins.length, currentRoomCoins: currentRoomCoins.length});
    
    // 如果当前房间没有金币，则默认返回false（需要玩家回答问题才能通过）
    if (currentRoomCoins.length === 0) {
        console.log('当前房间没有金币，门锁定状态');
        return false;
    }
    
    // 显示每个金币的详细状态
    currentRoomCoins.forEach((coin, index) => {
        console.log(`金币 ${index} 状态:`, {
            collected: coin.collected,
            isCorrect: coin.isCorrect,
            hasIsCorrect: 'isCorrect' in coin,
            roomId: coin.roomId,
            hasRoomId: 'roomId' in coin
        });
    });
    
    // 检查所有金币是否都被收集
    const collectedCoins = currentRoomCoins.filter(coin => coin.collected);
    const allCollected = collectedCoins.length === currentRoomCoins.length;
    console.log(`金币收集情况: 总数=${currentRoomCoins.length}, 已收集=${collectedCoins.length}, 全部收集=${allCollected}`);
    
    if (!allCollected) {
        return false;
    }
    
    // 检查所有已收集的金币是否都回答正确
    // 添加兼容性处理：对于没有isCorrect属性的金币，默认视为回答正确
    const correctCoins = collectedCoins.filter(coin => 
        coin.isCorrect === true || 'isCorrect' in coin === false
    );
    
    const allCorrect = correctCoins.length === collectedCoins.length;
    console.log(`金币回答情况: 已收集=${collectedCoins.length}, 回答正确=${correctCoins.length}, 全部正确=${allCorrect}`);
    
    // 找出回答错误的金币
    if (!allCorrect) {
        const incorrectCoins = collectedCoins.filter(coin => 'isCorrect' in coin && coin.isCorrect !== true);
        console.log(`回答错误的金币数量: ${incorrectCoins.length}`);
        incorrectCoins.forEach((coin, index) => {
            console.log(`错误金币 ${index} isCorrect值:`, coin.isCorrect);
        });
    }
    
    console.log('金币回答状态检查最终结果:', allCorrect);
    return allCorrect;
}

// 显示通知消息
function showNotification(message) {
    // 简单实现：在canvas上绘制文本提示
    console.log('显示通知:', message);
    
    // 创建一个临时的通知元素
    let notificationElement = document.getElementById('game-notification');
    
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'game-notification';
        notificationElement.style.position = 'absolute';
        notificationElement.style.top = '50%';
        notificationElement.style.left = '50%';
        notificationElement.style.transform = 'translate(-50%, -50%)';
        notificationElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notificationElement.style.color = 'white';
        notificationElement.style.padding = '20px';
        notificationElement.style.borderRadius = '10px';
        notificationElement.style.fontSize = '18px';
        notificationElement.style.zIndex = '1000';
        notificationElement.style.textAlign = 'center';
        document.body.appendChild(notificationElement);
    }
    
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        if (notificationElement) {
            notificationElement.style.display = 'none';
        }
    }, 3000);
}

// 检查玩家与门的碰撞
function checkDoorCollision() {
    // console.log('执行门碰撞检查，当前房间ID:', game.currentRoomId, '门数量:', game.doors.length);
    
    // 检查门数组是否存在
    if (!Array.isArray(game.doors)) {
        // console.error('错误: game.doors 不是一个有效的数组');
        return;
    }
    
    // 检查金币数组
    // console.log('金币数组状态:', {coins: game.coins, coinsLength: game.coins?.length || 0});
    
    // 遍历当前房间的所有门
    game.doors.forEach(door => {
        // 检查门对象是否有效
        if (!door || typeof door !== 'object') {
            console.error('发现无效的门对象:', door);
            return;
        }
        
        // 显示门的完整属性
        console.log('门对象详情:', {
            id: door.id,
            roomId: door.roomId,
            x: door.x,
            y: door.y,
            width: door.width,
            height: door.height,
            targetRoomId: door.targetRoomId
        });
        
        // 只处理当前房间的门
        if (door.roomId === game.currentRoomId) {
            console.log('检查当前房间的门:', door.id || '未设置ID');
            
            // 确保门有宽度和高度属性
            const doorWidth = door.width || 50; // 默认宽度
            const doorHeight = door.height || 100; // 默认高度
            
            // 检查碰撞
            const isCollision = game.player.x + game.player.width > door.x &&
                game.player.x < door.x + doorWidth &&
                game.player.y + game.player.height > door.y &&
                game.player.y < door.y + doorHeight;
                
            // 显示碰撞检测的详细计算
            // console.log('碰撞检测计算:', {
            //     playerRight: game.player.x + game.player.width,
            //     doorLeft: door.x,
            //     playerLeft: game.player.x,
            //     doorRight: door.x + doorWidth,
            //     playerBottom: game.player.y + game.player.height,
            //     doorTop: door.y,
            //     playerTop: game.player.y,
            //     doorBottom: door.y + doorHeight,
            //     isCollision: isCollision
            // });
                
            if (isCollision) {
                // console.log('检测到玩家与门碰撞！');
                
                // 预检查金币状态
                const currentRoomCoins = game.coins.filter(coin => coin.roomId === game.currentRoomId);
                // console.log('当前房间金币预检查:', {
                //     totalRoomCoins: currentRoomCoins.length,
                //     collectedCoins: currentRoomCoins.filter(coin => coin.collected).length,
                //     correctAnswers: currentRoomCoins.filter(coin => coin.collected && coin.isCorrect === true).length
                // });
                
                // 检查是否所有金币问题都回答正确
                const canUnlock = checkAllCoinsAnsweredCorrectly();
                console.log('门解锁检查结果:', canUnlock);
                
                if (canUnlock) {
                    console.log('门已解锁，准备切换房间到:', door.targetRoomId);
                    
                    // 检查目标房间ID是否存在
                    if (!door.targetRoomId) {
                        console.error('错误: 门没有设置目标房间ID');
                        return;
                    }
                    
                    // 切换房间，传递完整的door对象
                    switchRoom(door);
                } else {
                    console.log('门未解锁：请正确回答当前房间内所有金币的问题');
                    // 添加视觉提示，显示需要回答问题
                    if (typeof showNotification === 'function') {
                        showNotification('请先回答完所有问题才能通过！');
                    }
                }
            }
        }
    });
}

// 切换房间
function switchRoom(door) {
    const targetRoomId = door.targetRoomId;
    game.currentRoomId = targetRoomId;
    
    console.log(`切换到房间${targetRoomId}`);
    
    // 根据房间ID固定科目
    game.currentSubject = '';
    if (targetRoomId === 1) {
        game.currentSubject = '历史';
    } else if (targetRoomId === 2) {
        game.currentSubject = '数学';
    } else if (targetRoomId === 3) {
        game.currentSubject = '英语';
    }
    console.log(`房间${targetRoomId}的科目已固定为: ${game.currentSubject}`);
    
    // 根据房间ID切换对应的场景（房间1-3对应场景0-2）
    const sceneIndex = targetRoomId - 1;
    // loadScene(sceneIndex); // 移除对不存在函数的调用
    
    // 从levelData中加载当前房间的groundY值（如果存在）
    let roomGroundY = game.groundY; // 默认使用当前值
    if (window.levelData && window.levelData.groundY) {
        // 检查是否是按房间存储的groundY值
        if (Array.isArray(window.levelData.groundY)) {
            const roomGroundYData = window.levelData.groundY.find(g => g.roomId === targetRoomId);
            if (roomGroundYData && typeof roomGroundYData.value === 'number') {
                roomGroundY = roomGroundYData.value;
                console.log('从levelData加载房间', targetRoomId, '的groundY值:', roomGroundY);
            }
        } else if (typeof window.levelData.groundY === 'number') {
            // 如果是单个数值，则使用该值
            roomGroundY = window.levelData.groundY;
            console.log('从levelData加载通用groundY值:', roomGroundY);
        }
    }
    
    // 确认groundY值有效（房间切换时也要确保地面正确）
    if (roomGroundY === undefined || typeof roomGroundY !== 'number' || roomGroundY < 0 || roomGroundY > game.canvas.height) {
        roomGroundY = Math.min(540, game.canvas.height - 50);
        console.warn('房间切换时重新设置无效的groundY值为安全默认值:', roomGroundY);
    }
    
    game.groundY = roomGroundY;
    // console.log('切换到房间:', targetRoomId, '，场景索引:', sceneIndex, '，当前groundY值:', game.groundY);
    
    // 加载当前房间的背景图片
    if (window.rooms) {
        const currentRoom = window.rooms.find(room => room.id === targetRoomId);
        if (currentRoom && currentRoom.backgroundImage) {
            // console.log(`切换房间时加载背景图片: ${currentRoom.backgroundImage}`);
            // 更新背景图片，添加时间戳防止缓存
            const timestamp = new Date().getTime();
            const backgroundImageUrl = currentRoom.backgroundImage + `?t=${timestamp}`;
            
            if (game.backgroundImage) {
                game.backgroundImage.onload = function() {
                    // console.log(`房间切换时，背景图片${currentRoom.backgroundImage}加载成功`);
                };
                game.backgroundImage.onerror = function() {
                    // console.error(`房间切换时，背景图片${currentRoom.backgroundImage}加载失败`);
                };
                game.backgroundImage.src = backgroundImageUrl;
            } else {
                game.backgroundImage = new Image();
                game.backgroundImage.onload = function() {
                    // console.log(`房间切换时，背景图片${currentRoom.backgroundImage}加载成功`);
                };
                game.backgroundImage.onerror = function() {
                    // console.error(`房间切换时，背景图片${currentRoom.backgroundImage}加载失败`);
                };
                game.backgroundImage.src = backgroundImageUrl;
            }
        } else {
            // console.warn(`房间ID:${targetRoomId}没有设置背景图片`);
        }
    } else {
        // console.warn('window.rooms未定义，无法加载背景图片');
    }
    
    // 加载当前房间的金币（支持两种格式，与loadLevelData保持一致）
    game.coins = [];
    if (window.levelData && window.levelData.coins) {
        let currentRoomCoins = [];
        
        // 检查是否是按房间分组的格式
        if (window.levelData.coins.length > 0 && window.levelData.coins[0].roomId && window.levelData.coins[0].items) {
            // 按房间分组格式
            const roomData = window.levelData.coins.find(room => room.roomId === targetRoomId);
            if (roomData && roomData.items) {
                currentRoomCoins = roomData.items;
            }
        } else {
            // 直接的金币对象数组格式，每个金币都有自己的roomId
            currentRoomCoins = window.levelData.coins.filter(coin => coin.roomId === targetRoomId);
        }
        
        if (currentRoomCoins.length > 0) {
            // 加载金币时对坐标应用格点吸附，确保中心点对齐到格点
            game.coins = currentRoomCoins.map(coin => {
                // 将保存的x/y坐标视为中心点，应用格点吸附
                const snappedCenter = snapToGrid(coin.x, coin.y);
                // 计算左上角坐标（中心点 - 宽高/2）
                const coinWidth = 20; // 金币宽度
                const coinHeight = 20; // 金币高度
                return {
                    ...coin,
                    x: snappedCenter.x - coinWidth / 2,  // 左上角x坐标
                    y: snappedCenter.y - coinHeight / 2,  // 左上角y坐标
                    collected: false
                };
            });
            console.log('已加载房间', targetRoomId, '的金币并应用格点吸附，数量:', game.coins.length);
        } else {
            console.log('房间', targetRoomId, '没有金币数据');
        }
    }
    
    // 加载当前房间的框（优先从rooms.items加载，与loadLevelData保持一致）
    game.boxes = [];
    if (window.rooms) {
        const currentRoom = window.rooms.find(room => room.id === targetRoomId);
        if (currentRoom && currentRoom.items && currentRoom.items.length > 0) {
            // 加载框时对坐标应用格点吸附，确保左上角对齐到格点
            game.boxes = currentRoom.items.map(box => {
                // 直接将保存的x/y坐标视为左上角坐标，应用格点吸附
                const snapped = snapToGrid(box.x, box.y);
                return {
                    ...box,
                    x: snapped.x,
                    y: snapped.y,
                    roomId: targetRoomId
                };
            });
            console.log('已从rooms.items加载房间', targetRoomId, '的框并应用格点吸附，数量:', game.boxes.length);
        } else if (window.levelData && window.levelData.boxes) {
            // 如果rooms.items中没有框数据，则尝试从boxes数组加载（兼容旧格式）
            let currentRoomBoxes = [];
            
            // 检查是否是按房间分组的格式
            if (window.levelData.boxes.length > 0 && window.levelData.boxes[0].roomId && window.levelData.boxes[0].items) {
                // 按房间分组格式
                const roomData = window.levelData.boxes.find(room => room.roomId === targetRoomId);
                if (roomData && roomData.items) {
                    currentRoomBoxes = roomData.items;
                }
            } else {
                // 直接的框对象数组格式，每个框都有自己的roomId
                currentRoomBoxes = window.levelData.boxes.filter(box => box.roomId === targetRoomId);
            }
            
            if (currentRoomBoxes.length > 0) {
                // 加载框时对坐标应用格点吸附，确保左上角对齐到格点
                game.boxes = currentRoomBoxes.map(box => {
                    // 直接将保存的x/y坐标视为左上角坐标，应用格点吸附
                    const snapped = snapToGrid(box.x, box.y);
                    return {
                        ...box,
                        x: snapped.x,
                        y: snapped.y,
                        roomId: targetRoomId
                    };
                });
                console.log('已从boxes数组加载房间', targetRoomId, '的框并应用格点吸附，数量:', game.boxes.length);
            } else {
                console.log('房间', targetRoomId, '没有框数据');
            }
        } else {
            console.log('房间', targetRoomId, '没有框数据');
        }
    }
    
    // 加载当前房间的平台数据
    game.platforms = [];
    if (window.rooms) {
        const currentRoom = window.rooms.find(room => room.id === targetRoomId);
        if (currentRoom && currentRoom.platforms && currentRoom.platforms.length > 0) {
            game.platforms = currentRoom.platforms.map(platform => ({
                ...platform
            }));
            console.log('已加载房间', targetRoomId, '的平台数据，数量:', game.platforms.length);
        } else {
            console.log('房间', targetRoomId, '没有平台数据');
        }
    }
    
    // 使用门配置中的targetX和targetY作为传送位置
    if (door.targetX !== undefined && door.targetY !== undefined) {
        game.player.x = door.targetX;
        game.player.y = door.targetY;
        console.log('使用配置的传送位置:', door.targetX, door.targetY);
    } else {
        // 备选方案：找到目标房间对应的门
        const targetDoor = game.doors.find(d => 
            d.roomId === targetRoomId && 
            d.targetRoomId === door.roomId
        );
        
        if (targetDoor) {
            // 根据门的位置设置玩家位置
            if (targetDoor.x < game.canvas.width / 2) {
                // 门在左侧，玩家出现在门右侧
                game.player.x = targetDoor.x + targetDoor.width + 10;
            } else {
                // 门在右侧，玩家出现在门左侧
                game.player.x = targetDoor.x - game.player.width - 10;
            }
            // 设置玩家Y坐标，确保玩家站在门旁边（考虑碰撞箱高度）
            game.player.y = targetDoor.y + targetDoor.height / 2 - game.player.height / 2;
        } else {
            // 最终备选位置
            game.player.x = 170;
            game.player.y = 490;
        }
    }
    
    // 重置跳跃状态
    game.player.isJumping = false;
    game.player.velocityY = 0;
}

// 绘制角色和游戏界面
function draw() {
    try {
        // 安全检查
        if (!game || !game.ctx || !game.canvas) {
            console.error('绘制失败：游戏上下文未初始化');
            return;
        }
        
        // 清空画布
        game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        
        // 绘制背景
        if (game.backgroundImage && game.backgroundImage.complete) {
            // 如果背景图片已加载，绘制图片
            game.ctx.drawImage(game.backgroundImage, 0, 0, game.canvas.width, game.canvas.height);
        } else {
            // 如果背景图片未加载，使用备用颜色
            game.ctx.fillStyle = '#87CEEB';
            game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        }
        
        // 绘制格点（仅在编辑模式下）
        if (game.showGrid && typeof drawGrid === 'function' && (game.coinPlacementMode || game.boxMode || game.sceneCopyMode)) {
            try {
                // drawGrid() 函数已删除
            } catch (gridError) {
                console.error('绘制格点时出错:', gridError);
            }
        }
        
        // 地面绘制已移除
        
        // 绘制平台（如果有）
        try {
            if (Array.isArray(game.platforms) && game.platforms.length > 0) {
                // 保存当前状态
                game.ctx.save();
                game.ctx.fillStyle = '#8B4513';
                
                // 使用for循环代替forEach，提高Edge兼容性
                for (let i = 0; i < game.platforms.length; i++) {
                    const platform = game.platforms[i];
                    if (platform && typeof platform.x === 'number' && typeof platform.y === 'number' && 
                        typeof platform.width === 'number' && typeof platform.height === 'number') {
                        // 确保平台尺寸有效
                        const width = Math.max(1, platform.width);
                        const height = Math.max(1, platform.height);
                        game.ctx.fillRect(platform.x, platform.y, width, height);
                    }
                }
                // 恢复状态
                game.ctx.restore();
            }
        } catch (platformError) {
            console.error('绘制平台时出错:', platformError);
        }
        
        // 绘制门（中层元素）
        try {
            if (Array.isArray(game.doors)) {
                game.doors.forEach(door => {
                    if (door.roomId === game.currentRoomId) {
                        game.ctx.fillStyle = 'rgba(100, 149, 237, 0.1)'; // 非常透明的蓝色
                        game.ctx.fillRect(door.x, door.y, door.width, door.height);
                        
                        // 绘制半透明门边框
                        game.ctx.strokeStyle = 'rgba(70, 130, 180, 0.3)';
                        game.ctx.lineWidth = 1;
                        game.ctx.strokeRect(door.x, door.y, door.width, door.height);
                        
                        // 绘制门标签
                        game.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        game.ctx.font = '14px Arial';
                        game.ctx.textAlign = 'center';
                        game.ctx.fillText(`房间${door.targetRoomId}`, door.x + door.width/2, door.y + door.height/2 + 5);
                        game.ctx.textAlign = 'left';
                    }
                });
            }
        } catch (doorError) {
            console.error('绘制门时出错:', doorError);
        }
        
        // 绘制金币（中层元素）
        try {
            console.log('开始绘制金币，当前金币数量:', game.coins ? game.coins.length : 0);
            if (Array.isArray(game.coins)) {
                game.coins.forEach((coin, index) => {
                    if (!coin.collected) {
                        console.log(`绘制金币 ${index}:`, coin);
                        try {
                            // 确保金币属性有效
                            const coinX = coin.x || 0;
                            const coinY = coin.y || 0;
                            const coinWidth = coin.width || 20;
                            const coinHeight = coin.height || 20;
                            
                            console.log(`金币 ${index} 绘制坐标:`, {x: coinX, y: coinY, width: coinWidth, height: coinHeight});
                            
                            // 先检测正式金币图片是否可用
                            let useFormalImage = false;
                            if (game.coinImage && game.coinImage.complete && game.coinImage.width > 0) {
                                // 正式金币图片可用，使用图片绘制
                                useFormalImage = true;
                                game.ctx.drawImage(game.coinImage, coinX, coinY, coinWidth, coinHeight);
                                console.log(`使用正式图片绘制金币 ${index}`);
                            }
                            
                            // 如果正式金币图片不可用，使用备用的圆形绘制
                            if (!useFormalImage) {
                                console.log(`正式金币图片不可用，使用备用圆形绘制金币 ${index}`);
                                const centerX = coinX + coinWidth/2;
                                const centerY = coinY + coinHeight/2;
                                const radius = coinWidth/2;
                                
                                // 绘制圆形金币
                                game.ctx.beginPath();
                                game.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                                
                                // 设置填充色和描边色
                                game.ctx.fillStyle = '#FFD700'; // 金色
                                game.ctx.strokeStyle = '#B8860B'; // 暗金色边框
                                game.ctx.lineWidth = 2;
                                
                                game.ctx.fill();
                                game.ctx.stroke();
                            } // 修复：添加缺失的右大括号
                        } catch (coinError) {
                            console.error('绘制单个金币时出错:', coinError);
                            
                            // 错误恢复：使用简单矩形绘制
                            try {
                                game.ctx.fillStyle = '#FF0000';
                                game.ctx.fillRect(coin.x, coin.y, coin.width, coin.height);
                                console.log(`使用简单矩形替代绘制金币 ${index}`);
                            } catch (fallbackErr) {
                                console.error(`使用替代方法绘制金币 ${index} 也失败了:`, fallbackErr);
                            }
                        }
                    }
                });
            } else {
                console.warn('game.coins 不是数组，跳过金币绘制');
                // 初始化金币数组
                if (game) {
                    game.coins = [];
                    console.log('已初始化金币数组');
                }
            }
        } catch (coinsError) {
            console.error('绘制金币时出错:', coinsError);
        }
        
        // 绘制框（中层元素）- 仅在框放置模式下显示
        try {
            if (game.boxMode && Array.isArray(game.boxes)) {
                game.boxes.forEach(box => {
                    game.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                    game.ctx.lineWidth = 3;
                    game.ctx.strokeRect(box.x, box.y, box.width, box.height);
                    
                    // 填充半透明背景
                    game.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                    game.ctx.fillRect(box.x, box.y, box.width, box.height);
                });
            }
        } catch (boxesError) {
            console.error('绘制框时出错:', boxesError);
        }
        
        // 角色碰撞箱显示已移除
        
        // 绘制角色（中层元素）
        try {
            if (game.player && typeof game.player.x === 'number' && typeof game.player.y === 'number') {
                // 先检测正式绘制方法是否可用
                let drawSuccessful = false;
                
                // 优先尝试使用animationManager进行正式绘制
                if (typeof window.animationManager === 'object' && 
                    window.animationManager !== null && 
                    typeof window.animationManager.drawCharacter === 'function' &&
                    typeof window.animationManager.isReady === 'function' &&
                    window.animationManager.isReady()) {
                    try {
                        // 确保player对象属性完整
                        const safePlayer = {
                            x: typeof game.player.x === 'number' ? game.player.x : 0,
                            y: typeof game.player.y === 'number' ? game.player.y : 0,
                            width: typeof game.player.width === 'number' ? game.player.width : 30,
                            height: typeof game.player.height === 'number' ? game.player.height : 50,
                            direction: game.player.direction || 'right',
                            isWalking: !!game.player.isWalking,
                            currentFrame: typeof game.player.currentFrame === 'number' ? game.player.currentFrame : 0
                        };
                        
                        // 调用动画管理器进行正式绘制
                        drawSuccessful = window.animationManager.drawCharacter(game.ctx, safePlayer);
                    } catch (animationDrawError) {
                        console.error('使用动画管理器绘制角色时出错:', animationDrawError);
                        drawSuccessful = false;
                    }
                }
                
                // 只有在正式绘制方法不可用或失败时，才使用备用绘制方法
                if (!drawSuccessful) {
                    try {
                        // 使用备用绘制函数
                        drawSimpleCharacter();
                    } catch (simpleDrawError) {
                        console.error('备用角色绘制失败:', simpleDrawError);
                        // 紧急备用：绘制一个简单的矩形表示角色
                        try {
                            game.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                            game.ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
                        } catch (e) {}
                    }
                }
                
                // 简单角色绘制函数
                function drawSimpleCharacter() {
                    // 保存状态
                    game.ctx.save();
                    
                    const characterWidth = 30;
                    const characterHeight = 50;
                    const centerX = game.player.x + game.player.width / 2;
                    const centerY = game.player.y + game.player.height / 2;
                    
                    // 检查方向并应用镜像变换
                    if (game.player.direction === 'left') {
                        // 应用水平翻转，但保持中心点不变
                        game.ctx.translate(centerX, 0);
                        game.ctx.scale(-1, 1);
                        game.ctx.translate(-centerX, 0);
                    }
                    
                    // 绘制身体 - 使用更简单的形状
                    game.ctx.fillStyle = '#FFC0CB'; // 粉色身体
                    game.ctx.fillRect(centerX - characterWidth/2, centerY - characterHeight/2, characterWidth, characterHeight);
                    
                    // 绘制头部 - 使用圆形，确保在Edge中正常工作
                    game.ctx.fillStyle = '#FFDBAC'; // 肤色头部
                    game.ctx.beginPath();
                    try {
                        // 确保圆形绘制正确
                        game.ctx.arc(centerX, centerY - characterHeight/2 - 10, 15, 0, Math.PI * 2);
                        game.ctx.fill();
                    } catch (e) {
                        // 如果圆形绘制失败，使用矩形替代
                        game.ctx.fillRect(centerX - 15, centerY - characterHeight/2 - 25, 30, 30);
                    }
                    
                    // 如果在行走，绘制腿部动画效果
                    if (game.player.isWalking) {
                        game.ctx.fillStyle = '#1E90FF'; // 蓝色裤子
                        
                        // 简化动画计算，减少Edge浏览器压力
                        // 使用更简单的动画逻辑，避免复杂的时间函数
                        let legOffset = 0;
                        try {
                            // 使用frameCount代替Date.now，更稳定
                            legOffset = Math.sin(game.player.frameCount / 5) * 3; // 减少偏移量
                        } catch (e) {
                            legOffset = 0; // 出错时使用固定值
                        }
                        
                        // 绘制腿部
                        game.ctx.fillRect(centerX - characterWidth/2 - 5, centerY + characterHeight/2 - 10, 10, 10 + legOffset);
                        game.ctx.fillRect(centerX + characterWidth/2 - 5, centerY + characterHeight/2 - 10, 10, 10 - legOffset);
                    }
                    
                    // 恢复状态
                    game.ctx.restore();
                }
            }
        } catch (characterError) {
            console.error('绘制角色时出错:', characterError);
        }
    
        // 金币放置模式的视觉提示（放在最上层）
        try {
            if (game.coinPlacementMode) {
                if (window.gameMousePos) {
                    const mouseX = window.gameMousePos.x;
                    const mouseY = window.gameMousePos.y;
                    const coinWidth = 30;
                    const coinHeight = 30;
                    
                    // 使用五角星预览金币
                    game.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                    game.ctx.beginPath();
                    
                    // 五角星的10个点（外圈和内圈）
                    const spikes = 5;
                    const outerRadius = coinWidth/2;
                    const innerRadius = outerRadius * 0.4;
                    
                    for (let i = 0; i < spikes * 2; i++) {
                        const angle = (i * Math.PI) / spikes - Math.PI / 2; // 从顶部开始
                        const r = i % 2 === 0 ? outerRadius : innerRadius;
                        const x = mouseX + Math.cos(angle) * r;
                        const y = mouseY + Math.sin(angle) * r;
                        
                        if (i === 0) {
                            game.ctx.moveTo(x, y);
                        } else {
                            game.ctx.lineTo(x, y);
                        }
                    }
                    
                    game.ctx.closePath();
                    game.ctx.fill();
                    game.ctx.strokeStyle = '#B8860B';
                    game.ctx.lineWidth = 2;
                    game.ctx.stroke();
                }
                
                // 绘制操作提示文本
                game.ctx.fillStyle = '#FFF';
                game.ctx.font = '20px Arial';
                game.ctx.textAlign = 'center';
                game.ctx.fillText('金币放置模式：点击画布添加金币', game.canvas.width/2, 50);
                game.ctx.font = '16px Arial';
                game.ctx.fillText('按C键清除所有金币', game.canvas.width/2, 75);
                game.ctx.textAlign = 'left';
            }
        } catch (coinModeError) {
            console.error('绘制金币放置模式时出错:', coinModeError);
        }
        
        // 框放置模式的视觉提示（放在最上层）
        try {
            if (game.boxMode) {
                // 绘制当前正在拖拽的框
                if (game.currentBox && game.isDrawingBox) {
                    game.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    game.ctx.lineWidth = 2;
                    game.ctx.setLineDash([5, 5]);
                    game.ctx.strokeRect(game.currentBox.x, game.currentBox.y, game.currentBox.width, game.currentBox.height);
                    game.ctx.setLineDash([]);
                    
                    // 填充半透明背景
                    game.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                    game.ctx.fillRect(game.currentBox.x, game.currentBox.y, game.currentBox.width, game.currentBox.height);
                }
                
                // 绘制操作提示文本
                game.ctx.fillStyle = '#FFF';
                game.ctx.font = '20px Arial';
                game.ctx.textAlign = 'center';
                game.ctx.fillText('框放置模式：拖拽鼠标创建框', game.canvas.width/2, 50);
                game.ctx.font = '16px Arial';
                game.ctx.fillText('按C键清除所有框', game.canvas.width/2, 75);
                game.ctx.textAlign = 'left';
            }
        } catch (boxModeError) {
            console.error('绘制框放置模式时出错:', boxModeError);
        }
        
        // 绘制游戏界面元素（顶层）
        try {
            // 绘制分数
            game.ctx.fillStyle = '#FFF';
            game.ctx.font = '20px Arial';
            game.ctx.fillText('金币: ' + (game.coinsCollected || 0), 20, 30);
            
            // 绘制当前场景信息
            game.ctx.fillStyle = '#FFF';
            game.ctx.font = '16px Arial';
            game.ctx.fillText('当前场景: ' + ((game.currentScene || 0) + 1), game.canvas.width - 120, 30);
            
            // 绘制操作说明
            game.ctx.fillText('← → 移动 | ↑ 或 空格 跳跃 | 点击屏幕问好', 20, game.canvas.height - 20);
            
            // 绘制加载状态（如果需要）
            if (game.isLoading) {
                game.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                game.ctx.fillRect(game.canvas.width/2 - 150, game.canvas.height/2 - 30, 300, 60);
                game.ctx.fillStyle = '#FFF';
                game.ctx.font = '20px Arial';
                game.ctx.textAlign = 'center';
                game.ctx.fillText('游戏加载中...', game.canvas.width/2, game.canvas.height/2);
                game.ctx.textAlign = 'left';
            }
        } catch (uiError) {
            console.error('绘制界面元素时出错:', uiError);
        }
    } catch (error) {
        console.error('draw函数执行出错:', error);
        // 绘制错误信息到画布
        if (game && game.ctx && game.canvas) {
            game.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            game.ctx.fillRect(0, 0, game.canvas.width, 50);
            game.ctx.fillStyle = '#FFF';
            game.ctx.font = '16px Arial';
            game.ctx.fillText('游戏渲染错误，请刷新页面', 10, 25);
        }
    }
    
    // 胜利时显示"逃离成功"
    if (game.victory) {
        if (game && game.ctx && game.canvas) {
            try {
                // 设置文字样式
                game.ctx.fillStyle = '#FFD700';
                game.ctx.font = 'bold 72px Arial';
                game.ctx.textAlign = 'center';
                game.ctx.textBaseline = 'middle';
                
                // 绘制文字阴影，增加立体感
                game.ctx.shadowColor = '#000000';
                game.ctx.shadowBlur = 10;
                
                // 绘制"逃离成功"文字
                game.ctx.fillText('逃离成功', game.canvas.width / 2, game.canvas.height / 2);
                
                // 重置阴影
                game.ctx.shadowBlur = 0;
            } catch (victoryTextError) {
                console.error('绘制胜利文字时出错:', victoryTextError);
            }
        }
    }
    
    // 绘制问题弹窗 - 检查showHelloPopup标志
    if (game.showHelloPopup) {
        if (window.questionPopupManager && typeof window.questionPopupManager.drawPopup === 'function') {
            try {
                window.questionPopupManager.drawPopup();
                console.log('使用questionPopupManager绘制弹窗');
            } catch (popupError) {
                console.error('绘制弹窗时出错:', popupError);
                // 失败时尝试使用本地实现
                if (typeof drawPopup === 'function') {
                    try {
                        drawPopup();
                    } catch (localPopupError) {
                        console.error('使用本地函数绘制弹窗时出错:', localPopupError);
                    }
                }
            }
        } else if (typeof drawPopup === 'function') {
            // 备选方案：使用本地函数
            try {
                drawPopup();
                console.log('使用本地函数绘制弹窗');
            } catch (popupError) {
                console.error('使用本地函数绘制弹窗时出错:', popupError);
            }
        }
    }
}

// 绘制自动换行文本的辅助函数
// 本地问题弹窗绘制函数实现
function drawPopup() {
    console.log('执行本地drawPopup函数');
    
    if (!game || !game.ctx || !game.canvas) {
        console.error('无法绘制弹窗：游戏上下文未初始化');
        return;
    }
    
    // 绘制半透明背景遮罩
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // 绘制弹窗主体
    const popupWidth = 600;
    const popupHeight = 400;
    const popupX = game.canvas.width / 2 - popupWidth / 2;
    const popupY = game.canvas.height / 2 - popupHeight / 2;
    
    game.ctx.fillStyle = '#FFF';
    game.ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
    
    // 绘制弹窗边框
    game.ctx.strokeStyle = '#333';
    game.ctx.lineWidth = 3;
    game.ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
    
    // 绘制标题
    game.ctx.fillStyle = '#333';
    game.ctx.font = '24px Arial';
    game.ctx.textAlign = 'center';
    game.ctx.fillText('问题挑战', game.canvas.width / 2, popupY + 40);
    
    // 绘制问题内容
    game.ctx.font = '18px Arial';
    game.ctx.fillStyle = '#000';
    
    if (game.filteredQuestions && game.filteredQuestions.length > 0 && game.currentQuestionIndex >= 0 && game.currentQuestionIndex < game.filteredQuestions.length) {
        const currentQuestion = game.filteredQuestions[game.currentQuestionIndex];
        if (currentQuestion) {
            // 绘制问题文本（支持多行）
            const questionText = currentQuestion.content || '加载问题中...';
            const questionY = popupY + 80;
            drawWrappedText(questionText, popupX + 20, questionY, popupWidth - 40, 30);
            
            // 绘制选项按钮
            game.optionButtons.forEach((button, index) => {
                // 设置按钮位置
                button.x = popupX + 50;
                button.y = questionY + 80 + (index * 50);
                
                // 绘制按钮背景
                if (game.selectedOption === index) {
                    game.ctx.fillStyle = game.isCorrect ? '#4CAF50' : '#F44336'; // 统一使用与questionPopup.js相同的颜色方案
                } else {
                    game.ctx.fillStyle = '#E0E0E0';
                }
                game.ctx.fillRect(button.x, button.y, button.width, button.height);
                
                // 绘制按钮边框
                game.ctx.strokeStyle = '#333';
                game.ctx.strokeRect(button.x, button.y, button.width, button.height);
                
                // 绘制选项文本
                game.ctx.fillStyle = '#000';
                game.ctx.font = '16px Arial';
                game.ctx.textAlign = 'left';
                game.ctx.fillText(button.text || '', button.x + 10, button.y + 25);
            });
            
            // 绘制关闭按钮
            game.closeButton.x = popupX + popupWidth - 140;
            game.closeButton.y = popupY + popupHeight - 60;
            
            // 绘制关闭按钮背景
            game.ctx.fillStyle = '#FF6347';
            game.ctx.fillRect(game.closeButton.x, game.closeButton.y, game.closeButton.width, game.closeButton.height);
            
            // 绘制关闭按钮文本
            game.ctx.fillStyle = '#FFF';
            game.ctx.font = '16px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.fillText(game.closeButton.text, game.closeButton.x + game.closeButton.width / 2, game.closeButton.y + 25);
            
            // 如果显示结果，绘制正确/错误信息
            if (game.showResult) {
                game.ctx.font = '20px Arial';
                game.ctx.fillStyle = game.isCorrect ? '#4CAF50' : '#F44336'; // 统一使用与questionPopup.js相同的颜色方案
                game.ctx.textAlign = 'center';
                game.ctx.fillText(
                    game.isCorrect ? '回答正确！' : '回答错误！', // 简化文本，与questionPopup.js保持一致
                    game.canvas.width / 2,
                    popupY + popupHeight - 100
                );
            }
        }
    } else {
        // 没有问题数据时显示提示
        game.ctx.fillText('没有可用的问题数据', game.canvas.width / 2, popupY + 150);
        
        // 绘制关闭按钮
        game.closeButton.x = popupX + popupWidth - 140;
        game.closeButton.y = popupY + popupHeight - 60;
        
        game.ctx.fillStyle = '#FF6347';
        game.ctx.fillRect(game.closeButton.x, game.closeButton.y, game.closeButton.width, game.closeButton.height);
        
        game.ctx.fillStyle = '#FFF';
        game.ctx.font = '16px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText(game.closeButton.text, game.closeButton.x + game.closeButton.width / 2, game.closeButton.y + 25);
    }
    
    // 重置文本对齐
    game.ctx.textAlign = 'left';
}

// 播放正确答案音效的函数
// 音效函数现在通过soundManager全局对象提供，已在soundManager.js中定义

function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    // 按空格分割单词，但保留空格
    const words = text.split(/(\s+)/);
    let line = '';
    let currentY = y;
    let totalHeight = 0;
    
    for (let n = 0; n < words.length; n++) {
        const word = words[n];
        const testLine = line + word;
        const metrics = game.ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && line.length > 0) {
            game.ctx.fillText(line.trim(), x, currentY);
            line = word;
            currentY += lineHeight;
            totalHeight += lineHeight;
        } else {
            line = testLine;
        }
    }
    
    // 绘制最后一行
    if (line.trim()) {
        game.ctx.fillText(line.trim(), x, currentY);
        totalHeight += lineHeight;
    }
    
    return totalHeight;
}

// 游戏主循环
function gameLoop() {
    try {
        // 设置游戏循环运行标志
        if (game) {
            game.loopRunning = true;
        }
        
        // 检查并更新游戏状态（即使未准备好渲染，也需要更新游戏逻辑）
        if (typeof update === 'function') {
            update();
        } else {
            console.warn('update函数未定义');
        }
        
        // 只有在isReadyToRender为true时才进行绘制
        if (game && game.isReadyToRender && typeof draw === 'function') {
            draw();
        }
        
        // 继续游戏循环
        requestAnimationFrame(gameLoop);
    } catch (err) {
        console.error('游戏循环错误:', err);
        // 即使出错也尝试继续循环
        setTimeout(() => {
            requestAnimationFrame(gameLoop);
        }, 100);
    }
}

// 当页面加载完成时初始化游戏
// 音效管理器已在HTML中直接引入

// 确保页面加载完成后调用initGame函数
function initializeGame() {
    if (!window._gameInitialized) {
        window._gameInitialized = true;
        initGame();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // 页面已经加载完成，直接初始化游戏
    initializeGame();
}