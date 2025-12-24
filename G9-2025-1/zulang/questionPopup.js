// questionPopup.js - 问题加载和弹窗相关功能模块

// 选项按钮默认配置
const DEFAULT_OPTION_BUTTONS_CONFIG = [
    {
        width: 300,
        height: 40,
        index: 0,
        color: "#2196F3",
        textColor: "#FFF",
        fontSize: 20
    },
    {
        width: 300,
        height: 40,
        index: 1,
        color: "#2196F3",
        textColor: "#FFF",
        fontSize: 20
    },
    {
        width: 300,
        height: 40,
        index: 2,
        color: "#2196F3",
        textColor: "#FFF",
        fontSize: 20
    },
    {
        width: 300,
        height: 40,
        index: 3,
        color: "#2196F3",
        textColor: "#FFF",
        fontSize: 20
    }
];

// 问题弹窗管理器
const questionPopupManager = {
    // 从game对象引用的必要属性
    game: null,
    
    // 倒计时相关配置和状态
    countdownConfig: {
        duration: 20000, // 倒计时总时长（毫秒）
        warningThreshold: 5000, // 警告阈值（最后5秒）
        updateInterval: 16 // 更新间隔（约60fps）
    },
    countdownStartTime: null,
    countdownRemaining: 0,
    isCountdownRunning: false,
    
    // 初始化问题弹窗管理器
    init(gameRef) {
        this.game = gameRef;
    },
    
    // 开始倒计时
    startCountdown() {
        // 停止可能正在运行的倒计时
        this.stopCountdown();
        
        // 初始化倒计时状态
        this.countdownStartTime = Date.now();
        this.countdownRemaining = this.countdownConfig.duration;
        this.isCountdownRunning = true;
        
        console.log('倒计时开始，总时长:', this.countdownConfig.duration, '毫秒');
    },
    
    // 停止倒计时
    stopCountdown() {
        this.isCountdownRunning = false;
        this.countdownStartTime = null;
        this.countdownRemaining = 0;
        
        console.log('倒计时停止');
    },
    
    // 更新倒计时
    updateCountdown() {
        if (!this.isCountdownRunning || !this.game.showHelloPopup) {
            return;
        }
        
        // 计算剩余时间
        const elapsed = Date.now() - this.countdownStartTime;
        this.countdownRemaining = Math.max(0, this.countdownConfig.duration - elapsed);
        
        // 将剩余时间转换为秒（保留1位小数）
        this.game.countdownSeconds = (this.countdownRemaining / 1000).toFixed(1);
        
        // 检查倒计时是否结束
        if (this.countdownRemaining <= 0) {
            this.isCountdownRunning = false;
            this.handleCountdownEnd();
        }
    },
    
    // 处理倒计时结束
    handleCountdownEnd() {
        console.log('倒计时结束，自动提交答案');
        
        // 倒计时结束视为答错
        this.game.showResult = true;
        this.game.isCorrect = false;
        
        // 如果有音效系统，播放错误音效
        if (window.soundManager) {
            window.soundManager.playSound('incorrectAnswer');
        }
    },
    
    // 加载问题JSON文件
    async loadQuestions() {
        try {
            const response = await fetch('popupquestion.json');
            if (!response.ok) {
                throw new Error('无法加载问题文件');
            }
            const data = await response.json();
            this.game.questions = data.questions;
            this.game.isLoading = false;
        } catch (error) {
            console.error('加载问题失败:', error);
            // 如果加载失败，使用默认问题
            this.game.questions = [
                { title: "问题挑战！", content: "你最喜欢马里奥的哪个角色？" },
                { title: "趣味问答！", content: "马里奥最初叫什么名字？" },
                { title: "小测试！", content: "马里奥游戏中，蘑菇有什么作用？" }
            ];
            this.game.isLoading = false;
        }
    },
    
    // 显示问题弹窗
    showHelloPopup() {
        this.game.showHelloPopup = true;
        this.game.selectedOption = null;
        this.game.showResult = false;
        this.game.isCorrect = false;
        this.game.attemptCount = 0;
        // 移除自动关闭计时器，改为手动关闭
        
        // 播放答题背景音乐
        if (window.soundManager) {
            window.soundManager.playBackgroundMusic('questionBackground');
        }
        
        // 获取布局配置，如果没有则使用默认值
        const layoutConfig = window.buttonPositions?.popup?.layout || {};
        const verticalSpacing = layoutConfig.verticalSpacing || 50;
        const optionsStartYOffset = layoutConfig.optionsStartYOffset || 80;
        const closeButtonYOffset = layoutConfig.closeButtonYOffset || 20;
        const centerX = layoutConfig.centerX !== undefined ? layoutConfig.centerX : true;
        const centerY = layoutConfig.centerY !== undefined ? layoutConfig.centerY : true;
        
        // 初始化选项按钮配置
        this.game.optionButtons = this.game.optionButtons || [];
        for (let i = 0; i < DEFAULT_OPTION_BUTTONS_CONFIG.length; i++) {
            if (!this.game.optionButtons[i]) {
                this.game.optionButtons[i] = {...DEFAULT_OPTION_BUTTONS_CONFIG[i]};
            } else {
                // 合并默认配置
                Object.assign(this.game.optionButtons[i], 
                    Object.fromEntries(Object.entries(DEFAULT_OPTION_BUTTONS_CONFIG[i])
                        .filter(([key, value]) => this.game.optionButtons[i][key] === undefined)));
            }
        }
        
        // 检查是否有可用题目
        if (this.game.questions && this.game.questions.length > 0) {
            // 根据当前科目过滤问题
            let filteredQuestions = this.game.questions;
            
            // 如果设置了当前科目，则只显示对应科目的问题
            if (this.game.currentSubject && this.game.currentSubject !== '') {
                filteredQuestions = this.game.questions.filter(q => 
                    q.subject === this.game.currentSubject
                );
                
                // 如果没有找到对应科目的问题，回退到使用所有问题
                if (filteredQuestions.length === 0) {
                    console.log(`未找到${this.game.currentSubject}科目的问题，使用所有问题`);
                    filteredQuestions = this.game.questions;
                } else {
                    console.log(`使用${this.game.currentSubject}科目的问题，共${filteredQuestions.length}个`);
                }
            }
            
            // 从过滤后的问题中排除已经问过的问题
            let availableQuestions = filteredQuestions.filter(q => 
                !this.game.askedQuestions.includes(this.game.questions.indexOf(q))
            );
            
            // 如果所有问题都问过了，重置已问问题列表
            if (availableQuestions.length === 0) {
                console.log('所有问题都已问过，重置已问问题列表');
                this.game.askedQuestions = [];
                availableQuestions = filteredQuestions;
            }
            
            // 从可用问题中随机选择一个
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const currentQuestion = availableQuestions[randomIndex];
            
            // 找到该问题在原始数组中的索引
            const currentQuestionIndex = this.game.questions.indexOf(currentQuestion);
            
            // 将当前问题添加到已问问题列表
            this.game.askedQuestions.push(currentQuestionIndex);
            
            // 设置当前问题索引
            this.game.currentQuestionIndex = currentQuestionIndex;
            
            // 设置选项按钮位置和文本，确保所有按钮都被重置
            this.game.optionButtons.forEach((button, index) => {
                // 重置所有按钮文本
                button.text = '';
                
                // 设置按钮位置
                button.x = this.game.canvas.width / 2 - button.width / 2;
                button.y = this.game.canvas.height / 2 + optionsStartYOffset + index * verticalSpacing;
                button.index = index;
                
                // 处理选项
                let options = [];
                
                // 优先使用标准的options字段
                if (currentQuestion.options && Array.isArray(currentQuestion.options)) {
                    options = currentQuestion.options;
                }
                // 处理异常情况：检查是否有重复的content字段（第二个content字段应为选项）
                else if (Array.isArray(currentQuestion.content)) {
                    options = currentQuestion.content;
                }
                
                // 如果有选项并且索引有效，设置选项文本
                if (options.length > 0 && index < options.length) {
                    button.text = options[index];
                }
            });
            
            // 设置关闭按钮位置
            this.game.closeButton.x = this.game.canvas.width / 2 - this.game.closeButton.width / 2;
            this.game.closeButton.y = this.game.canvas.height / 2 + optionsStartYOffset + 
                                    (this.game.optionButtons.filter(b => b.text).length) * verticalSpacing + 
                                    closeButtonYOffset;
            
            // 启动倒计时
            this.startCountdown();
        }
    },
    
    // 处理弹窗点击事件
    handlePopupClick(x, y) {
        // 检查是否点击了关闭按钮
        if (this.isPointInRect(x, y, this.game.closeButton.x, this.game.closeButton.y, 
                              this.game.closeButton.width, this.game.closeButton.height)) {
            this.game.showHelloPopup = false;
            
            // 停止答题背景音乐
            if (window.soundManager) {
                window.soundManager.stopBackgroundMusic();
            }
            
            // 恢复播放全局背景音乐
            if (window.playGameBackgroundMusic) {
                window.playGameBackgroundMusic();
            }
        } 
        // 检查是否点击了选项按钮
        else {
            console.log(`===== 点击检测调试 =====`);
            console.log(`点击坐标: x=${x}, y=${y}`);
            
            // 打印所有按钮的位置信息用于调试
            console.log(`选项按钮位置信息:`);
            for (let i = 0; i < this.game.optionButtons.length; i++) {
                const button = this.game.optionButtons[i];
                if (button.text) {
                    console.log(`按钮 ${i}: x=${button.x}, y=${button.y}, width=${button.width}, height=${button.height}, text="${button.text}"`);
                    // 检查点击是否在按钮范围内
                    const isIn = this.isPointInRect(x, y, button.x, button.y, button.width, button.height);
                    console.log(`  点击是否在此按钮内: ${isIn}`);
                }
            }
            
            const optionIndex = this.isPointInOptionButton(x, y);
            console.log(`isPointInOptionButton返回索引: ${optionIndex}`);
            
            if (optionIndex !== -1 && !this.game.showResult) {
                this.game.selectedOption = optionIndex;
                console.log(`设置selectedOption为: ${optionIndex}`);
                // 验证答案
                const currentQuestion = this.game.questions[this.game.currentQuestionIndex];
                
                // 调试：检查问题对象的完整内容
                console.log('当前问题对象:', JSON.stringify(currentQuestion, null, 2));
                
                // 注意：问题数据使用的是correctAnswer属性
                const correctIndex = currentQuestion.correctAnswer;
                console.log('从问题对象获取的correctAnswer值:', correctIndex);
                
                // 确认属性存在
                if (correctIndex === undefined) {
                    console.log('警告: 问题对象缺少correctAnswer属性！');
                }
                
                const selectedOptionText = this.game.optionButtons[optionIndex]?.text || '';
                console.log('选项按钮数组状态:', this.game.optionButtons.map(btn => btn?.text || 'undefined').join(', '));
                
                // 增强的答案验证逻辑
                let isCorrect = false;
                
                // 1. 首先进行索引比较
                if (optionIndex === correctIndex) {
                    isCorrect = true;
                    console.log('答案验证 - 索引匹配成功:', optionIndex, '=', correctIndex);
                } else {
                    console.log('答案验证 - 索引不匹配:', optionIndex, '≠', correctIndex);
                    
                    // 2. 尝试字符串比较（处理文本值）
                    const correctOptionText = this.game.optionButtons[correctIndex]?.text || '';
                    const trimmedSelected = selectedOptionText.trim();
                    const trimmedCorrect = correctOptionText.trim();
                    
                    if (trimmedSelected === trimmedCorrect) {
                        isCorrect = true;
                        console.log('答案验证 - 文本匹配成功:', trimmedSelected, '=', trimmedCorrect);
                    } else {
                        console.log('答案验证 - 文本不匹配:', trimmedSelected, '≠', trimmedCorrect);
                        
                        // 3. 尝试数字比较（处理数字值）
                        const numSelected = parseFloat(trimmedSelected);
                        const numCorrect = parseFloat(trimmedCorrect);
                        
                        if (!isNaN(numSelected) && !isNaN(numCorrect) && numSelected === numCorrect) {
                            isCorrect = true;
                            console.log('答案验证 - 数字匹配成功:', numSelected, '=', numCorrect);
                        } else {
                            console.log('答案验证 - 数字不匹配或无法解析为数字');
                            
                            // 4. 尝试布尔字符串比较
                            const boolMap = {
                                'true': true,
                                'false': false,
                                '对': true,
                                '错': false,
                                '是': true,
                                '否': false,
                                '正确': true,
                                '错误': false
                            };
                            
                            const boolSelected = boolMap[trimmedSelected.toLowerCase()];
                            const boolCorrect = boolMap[trimmedCorrect.toLowerCase()];
                            
                            if (boolSelected !== undefined && boolCorrect !== undefined && boolSelected === boolCorrect) {
                                isCorrect = true;
                                console.log('答案验证 - 布尔值匹配成功:', boolSelected, '=', boolCorrect);
                            } else {
                                console.log('答案验证 - 布尔值不匹配或无法解析');
                            }
                        }
                    }
                }
                    
                // 输出超级详细的比较信息到控制台
                console.log(`===== 答案验证增强调试 =====`);
                console.log(`问题标题: ${currentQuestion.title || '未知'}`);
                console.log(`问题ID: ${currentQuestion.id || '未知'}`);
                console.log(`用户选择索引: ${optionIndex}`);
                console.log(`正确答案索引: ${correctIndex}`);
                console.log(`选择的选项文本: "${selectedOptionText}"`);
                console.log(`正确选项文本: "${this.game.optionButtons[correctIndex]?.text || '未知'}"`);
                console.log(`选项按钮数量: ${this.game.optionButtons.length}`);
                console.log(`是否选择了有效选项索引: ${optionIndex >= 0 && optionIndex < this.game.optionButtons.length}`);
                console.log(`验证结果: ${isCorrect ? '正确 ✓' : '错误 ✗'}`);
                console.log(`问题对象中的correctIndex属性: ${currentQuestion.correctIndex}`);
                console.log(`问题对象中的correctAnswer属性: ${currentQuestion.correctAnswer}`);
                console.log(`========================`);
                
                // 保存选择的选项供调试显示
                this.game.selectedOption = optionIndex;
                
                // 设置isCorrect状态（与game.js保持一致）
                this.game.isCorrect = isCorrect;
                console.log(`最终isCorrect状态设置为: ${isCorrect}`);
                
                // 无论对错都立即显示结果，便于调试
                this.game.showResult = true;
                console.log(`答案验证后最终设置: isCorrect=${this.game.isCorrect}, showResult=${this.game.showResult}`);
                
                // 用户回答完后立即停止背景音乐
                if (window.soundManager) {
                    window.soundManager.stopBackgroundMusic();
                }
                
                // 额外验证：确保isCorrect状态被正确赋值
                if (this.game.isCorrect !== isCorrect) {
                    console.error('警告: isCorrect状态设置失败，值不匹配!');
                }
                
                // 保留原有重试逻辑，但确保状态正确设置
                if (!isCorrect) {
                    this.game.attemptCount++;
                    
                    if (this.game.attemptCount < 2) {
                        // 第一次错误，延迟清除选择状态
                        setTimeout(() => {
                            if (this.game && !this.game.showResult) {
                                this.game.selectedOption = null;
                            }
                        }, 1000); // 显示1秒后清除
                    }
                }
                
                // 用户选择答案后停止倒计时
                this.stopCountdown();
            } else {
                // 主观题，没有正确答案
                this.game.isCorrect = true;
                this.game.showResult = true;
            }
        }
    },
    
    // 检查点是否在矩形内
    isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
        return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
    },
    
    // 检查点是否在选项按钮内
    isPointInOptionButton(x, y) {
        for (let i = 0; i < this.game.optionButtons.length; i++) {
            const button = this.game.optionButtons[i];
            if (button.text && this.isPointInRect(x, y, button.x, button.y, button.width, button.height)) {
                return i;
            }
        }
        return -1;
    },
    
    // 绘制问题弹窗
    drawPopup() {
        if (!this.game.showHelloPopup || !this.game.questions || this.game.currentQuestionIndex === -1) {
            return;
        }
        
        const currentQuestion = this.game.questions[this.game.currentQuestionIndex];
        
        // 计算弹窗高度，确保有足够空间显示所有内容
        // 设置最大宽度为画布宽度的90%，确保不会超出屏幕
        const maxWidth = this.game.canvas.width * 0.9;
        const popupWidth = Math.min(700, maxWidth); // 增加宽度以容纳更多内容
        const popupMinHeight = 500; // 增加最小高度以容纳更多内容
        
        // 估算标题和内容的高度（带换行）
        const contentWidth = popupWidth - 40; // 内容区域宽度，留出边距
        const titleLines = Math.ceil(currentQuestion.title.length * 12 / contentWidth); // 估算标题行数
        const contentLines = Math.ceil(currentQuestion.content.length * 10 / contentWidth); // 估算内容行数
        const textHeight = (titleLines * 25) + (contentLines * 20) + 60; // 标题行高25，内容行高20，加上间距
        
        const optionsHeight = this.game.optionButtons.filter(b => b.text).length * 50;
        const resultHeight = this.game.showResult ? 120 : 0;
        const totalHeight = Math.max(popupMinHeight, textHeight + optionsHeight + resultHeight);
        
        // 调整弹窗位置，确保不会超出画布边界
        const popupX = this.game.canvas.width/2 - popupWidth/2;
        // 计算垂直位置，确保不会从顶部或底部溢出
        const desiredY = this.game.canvas.height/2 - totalHeight/2;
        const minY = 10; // 顶部最小边距
        const maxY = this.game.canvas.height - totalHeight - 10; // 底部最大位置（留出底部边距）
        const popupY = Math.max(minY, Math.min(desiredY, maxY));
        
        // 绘制弹窗背景
        this.game.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.game.ctx.fillRect(popupX, popupY, popupWidth, totalHeight);
        
        // 绘制弹窗边框
        this.game.ctx.strokeStyle = '#FFF';
        this.game.ctx.lineWidth = 2;
        this.game.ctx.strokeRect(popupX, popupY, popupWidth, totalHeight);
        
        // 绘制倒计时UI
        if (this.isCountdownRunning) {
            // 计算剩余时间（秒）
            const remainingSeconds = Math.ceil(this.countdownRemaining / 1000);
            
            // 根据剩余时间选择颜色
            let countdownColor = '#4CAF50'; // 绿色
            if (remainingSeconds <= 10) countdownColor = '#FF9800'; // 橙色
            if (remainingSeconds <= 5) countdownColor = '#F44336'; // 红色
            
            // 绘制倒计时文本
            this.game.ctx.fillStyle = countdownColor;
            this.game.ctx.font = 'bold 24px Arial';
            this.game.ctx.textAlign = 'right';
            this.game.ctx.textBaseline = 'top';
            this.game.ctx.fillText(`${remainingSeconds}s`, popupX + popupWidth - 20, popupY + 10);
            
            // 绘制倒计时背景框
            this.game.ctx.strokeStyle = countdownColor;
            this.game.ctx.lineWidth = 2;
            const countdownWidth = 60;
            const countdownHeight = 40;
            this.game.ctx.strokeRect(popupX + popupWidth - countdownWidth - 15, popupY + 5, countdownWidth, countdownHeight);
        }
        
        // 获取JSON配置中的布局参数
        const layoutConfig = window.buttonPositions && window.buttonPositions.popup && window.buttonPositions.popup.layout;
        const subjectYOffset = layoutConfig ? layoutConfig.subjectYOffset : 20;
        const titleYOffset = layoutConfig ? layoutConfig.titleYOffset : 50;
        const contentYOffset = layoutConfig ? layoutConfig.contentYOffset : 90;
        
        // 不再显示科目信息
        
        // 移除测试模式的正确答案显示功能
        
        // 绘制题目标题（带自动换行）
        this.game.ctx.fillStyle = '#FFF';
        this.game.ctx.font = '20px Arial';
        this.game.ctx.textAlign = 'center';
        this.drawWrappedText(currentQuestion.title, this.game.canvas.width/2, popupY + titleYOffset, contentWidth, 25);
        
        // 绘制题目内容（带自动换行）
        this.game.ctx.font = '16px Arial';
        const contentHeight = this.drawWrappedText(currentQuestion.content, this.game.canvas.width/2, popupY + contentYOffset, contentWidth, 20);
        
        // 根据内容高度调整后续元素的位置
        const optionsStartYOffset = layoutConfig ? layoutConfig.optionsStartYOffset : 10;
        const verticalSpacing = layoutConfig ? layoutConfig.verticalSpacing : 50;
        const adjustedOptionsY = popupY + contentYOffset + contentHeight + optionsStartYOffset;
        
        // 绘制选项按钮
        this.game.optionButtons.forEach((button, index) => {
            if (button.text) {
                // 获取按钮配置
                const buttonConfig = DEFAULT_OPTION_BUTTONS_CONFIG[index] || {};
                
                // 更新按钮位置和宽度
                const buttonWidth = contentWidth; // 按钮宽度与内容区域相同
                button.width = buttonWidth;
                button.x = this.game.canvas.width / 2 - buttonWidth / 2;
                button.y = adjustedOptionsY + index * verticalSpacing;
                
                // 应用默认配置（如果未设置）
                if (!button.color) button.color = buttonConfig.color;
                if (!button.textColor) button.textColor = buttonConfig.textColor;
                if (!button.fontSize) button.fontSize = buttonConfig.fontSize;
                if (!button.height) button.height = buttonConfig.height;
                
                // 按钮背景色
                if (this.game.selectedOption === index) {
                    // 增强的颜色设置逻辑，确保正确答案显示绿色
                    const isCorrectValue = this.game.isCorrect;
                    const correctColor = isCorrectValue ? '#4CAF50' : '#F44336';
                    this.game.ctx.fillStyle = correctColor;
                    
                    // 增强调试信息
                    console.log(`===== 按钮颜色调试 =====`);
                    console.log(`绘制选项 ${index} - 确认isCorrect值: ${isCorrectValue}`);
                    console.log(`使用颜色: ${correctColor} (${isCorrectValue ? '正确答案应为绿色' : '错误答案应为红色'})`);
                    console.log(`当前问题索引: ${this.game.currentQuestionIndex}`);
                    console.log(`当前选中选项: ${this.game.selectedOption}`);
                    console.log(`======================`);
                } else {
                    this.game.ctx.fillStyle = button.color || '#333';
                }
                
                this.game.ctx.fillRect(button.x, button.y, button.width, button.height);
                
                // 按钮边框
                this.game.ctx.strokeStyle = '#FFF';
                this.game.ctx.lineWidth = 2;
                this.game.ctx.strokeRect(button.x, button.y, button.width, button.height);
                
                // 按钮文本
                this.game.ctx.fillStyle = button.textColor || '#FFF';
                this.game.ctx.font = `${button.fontSize || 16}px Arial`;
                this.game.ctx.textAlign = 'center';
                this.game.ctx.textBaseline = 'middle';
                
                // 文本自动换行，增加行高以提高可读性
                this.drawWrappedText(button.text, button.x + button.width/2, button.y + button.height/2, button.width - 30, 22);
                
                // 测试模式：不再直接标记按钮，改为在弹窗顶部显示正确答案信息
            }
        });
        
        // 绘制关闭按钮
        const closeButtonWidth = Math.min(200, contentWidth); // 关闭按钮宽度，最大200px，最小为内容宽度
        this.game.closeButton.width = closeButtonWidth;
        this.game.closeButton.x = this.game.canvas.width / 2 - closeButtonWidth / 2;
        this.game.closeButton.y = adjustedOptionsY + 
                                (this.game.optionButtons.filter(b => b.text).length) * verticalSpacing + 
                                (layoutConfig ? layoutConfig.closeButtonYOffset : 30); // 增加间距
        
        this.game.ctx.fillStyle = this.game.closeButton.color || '#4CAF50';
        this.game.ctx.fillRect(this.game.closeButton.x, this.game.closeButton.y, this.game.closeButton.width, this.game.closeButton.height);
        this.game.ctx.strokeStyle = '#FFF';
        this.game.ctx.lineWidth = 2;
        this.game.ctx.strokeRect(this.game.closeButton.x, this.game.closeButton.y, this.game.closeButton.width, this.game.closeButton.height);
        
        this.game.ctx.fillStyle = this.game.closeButton.textColor || '#FFF';
        this.game.ctx.font = `${this.game.closeButton.fontSize || 20}px Arial`;
        this.game.ctx.textAlign = 'center';
        this.game.ctx.textBaseline = 'middle';
        this.game.ctx.fillText(this.game.closeButton.text, 
                              this.game.closeButton.x + this.game.closeButton.width/2, 
                              this.game.closeButton.y + this.game.closeButton.height/2);
        
        // 绘制结果
        if (this.game.showResult) {
            const resultY = this.game.closeButton.y + this.game.closeButton.height + 20;
            this.game.ctx.fillStyle = this.game.isCorrect ? '#4CAF50' : '#F44336';
            this.game.ctx.font = '18px Arial';
            this.game.ctx.textAlign = 'center';
            this.game.ctx.fillText(this.game.isCorrect ? '回答正确！' : '回答错误！', this.game.canvas.width/2, resultY);
            
            // 添加详细的调试信息显示
            const debugY = resultY + 30;
            this.game.ctx.fillStyle = '#FFD700'; // 金色
            this.game.ctx.font = '14px Arial';
            
            // 定义选项字母（A, B, C, D...）
            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            
            // 显示选择的选项和正确答案信息
            if (this.game.selectedOption !== null && this.game.selectedOption !== undefined) {
                const selectedOptionText = this.game.optionButtons[this.game.selectedOption]?.text || '未知';
                const correctAnswerIndex = currentQuestion.correctAnswer;
                let correctOptionText = '未知';
                
                // 尝试找到正确答案对应的按钮文本
                if (correctAnswerIndex !== null && correctAnswerIndex !== undefined) {
                    const correctIndexNum = parseInt(correctAnswerIndex, 10);
                    if (!isNaN(correctIndexNum) && this.game.optionButtons[correctIndexNum]) {
                        correctOptionText = this.game.optionButtons[correctIndexNum].text;
                    }
                }
                
                // 显示选择的选项（带索引和字母标识）
                this.game.ctx.fillText(`选择: ${this.game.selectedOption} - ${optionLetters[this.game.selectedOption] || this.game.selectedOption} - ${selectedOptionText}`, 
                                     this.game.canvas.width/2, debugY);
                
                // 显示正确答案（带索引和字母标识）
                this.game.ctx.fillText(`正确: ${correctAnswerIndex} - ${optionLetters[parseInt(correctAnswerIndex, 10)] || correctAnswerIndex} - ${correctOptionText}`, 
                                     this.game.canvas.width/2, debugY + 25);
                
                // 显示比较结果
                const resultText = this.game.isCorrect ? '✓ 答案正确!' : '✗ 答案错误!';
                this.game.ctx.fillStyle = this.game.isCorrect ? '#4CAF50' : '#F44336'; // 正确为绿色，错误为红色
                this.game.ctx.font = 'bold 16px Arial';
                this.game.ctx.fillText(resultText, this.game.canvas.width/2, debugY + 50);
                this.game.ctx.fillStyle = '#FFD700'; // 恢复金色
                this.game.ctx.font = '14px Arial';
                
                // 控制台日志
                console.log(`===== 答案结果调试 =====`);
                console.log(`问题ID: ${currentQuestion.id || '未知'}`);
                console.log(`用户选择索引: ${this.game.selectedOption} (类型: ${typeof this.game.selectedOption})`);
                console.log(`用户选择文本: ${optionLetters[this.game.selectedOption] || this.game.selectedOption} - ${selectedOptionText}`);
                console.log(`正确答案索引: ${correctAnswerIndex} (类型: ${typeof correctAnswerIndex})`);
                console.log(`正确答案文本: ${optionLetters[parseInt(correctAnswerIndex, 10)] || correctAnswerIndex} - ${correctOptionText}`);
                console.log(`数字比较结果: ${Number(this.game.selectedOption)} === ${Number(correctAnswerIndex)} ? ${Number(this.game.selectedOption) === Number(correctAnswerIndex)}`);
                console.log(`最终结果: ${this.game.isCorrect ? '正确' : '错误'}`);
                console.log(`======================`);
            }
            
            // 显示解释（如果有）
            if (currentQuestion.explanation) {
                this.game.ctx.fillStyle = '#FFF';
                this.game.ctx.fillText(currentQuestion.explanation, this.game.canvas.width/2, debugY + 80);
            }
        }
    },
    
    // 绘制自动换行文本
    drawWrappedText(text, x, y, maxWidth, lineHeight) {
        if (!text) return 0;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = this.game.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        // 调整绘制位置，使文本居中显示
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;
        
        for (let i = 0; i < lines.length; i++) {
            this.game.ctx.fillText(lines[i], x, startY + i * lineHeight);
        }
        
        return totalHeight;
    },
    
    // 更新弹窗状态（处理自动关闭等）
    updatePopup() {
        // 更新倒计时
        this.updateCountdown();
        
        if (this.game.showHelloPopup && this.game.showResult) {
            // 如果还没有设置定时器，无论答题正确与否都自动关闭
            if (!this.game.autoCloseTimer) {
                this.game.autoCloseTimer = setTimeout(() => {
                    this.game.showHelloPopup = false;
                    this.game.autoCloseTimer = null;
                    
                    // 停止答题背景音乐
                    if (window.soundManager) {
                        window.soundManager.stopBackgroundMusic();
                    }
                    
                    // 恢复播放全局背景音乐
                    if (window.playGameBackgroundMusic) {
                        window.playGameBackgroundMusic();
                    }
                }, 1500); // 1.5秒后自动关闭
            }
        } else if (this.game.autoCloseTimer) {
            // 如果弹窗状态改变，清除定时器
            clearTimeout(this.game.autoCloseTimer);
            this.game.autoCloseTimer = null;
        }
    }
};

// 将questionPopupManager暴露到全局
window.questionPopupManager = questionPopupManager;