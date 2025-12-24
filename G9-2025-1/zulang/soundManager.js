// 音效管理器 - 负责加载和播放游戏中的所有音效
class SoundManager {
    constructor() {
        this.soundConfig = null;
        this.audioCache = new Map();
        this.isInitialized = false;
        this.backgroundMusic = null; // 背景音乐音频对象
    }

    // 初始化音效管理器，加载配置文件
    async init() {
        try {
            const response = await fetch('soundConfig.json');
            if (!response.ok) {
                throw new Error(`加载配置文件失败: ${response.status}`);
            }
            
            this.soundConfig = await response.json();
            this.isInitialized = true;
            console.log('音效管理器初始化成功', this.soundConfig);
            return true;
        } catch (error) {
            console.error('音效管理器初始化失败:', error);
            // 如果配置加载失败，使用默认配置
            this._useDefaultConfig();
            return false;
        }
    }

    // 使用默认配置作为备用方案
    _useDefaultConfig() {
        this.soundConfig = {
            "sounds": {
                "correctAnswer": {
                    "event": "回答正确",
                    "file": "飞书20251201-160841.mp3",
                    "description": "当玩家回答问题正确时播放"
                },
                "incorrectAnswer": {
                    "event": "回答错误",
                    "file": "飞书20251202-230857.mp3",
                    "description": "当玩家回答问题错误时播放"
                },
                "gameBackground": {
                    "event": "全局背景音乐",
                    "file": "飞书20251203-090726.mp3",
                    "description": "游戏游玩时的全局背景音乐"
                },
                "questionBackground": {
                    "event": "答题背景音乐",
                    "file": "飞书20251203-090730.mp3",
                    "description": "当显示答题弹窗时播放的背景音乐"
                }
            }
        };
        this.isInitialized = true;
        console.log('使用默认音效配置');
    }

    // 播放指定类型的音效
    playSound(soundType) {
        if (!this.isInitialized || !this.soundConfig) {
            console.warn('音效管理器尚未初始化');
            return false;
        }

        const soundInfo = this.soundConfig.sounds[soundType];
        if (!soundInfo) {
            console.warn(`未找到音效类型: ${soundType}`);
            return false;
        }

        try {
            // 尝试播放音效，使用缓存或创建新的音频对象
            this._playAudioFile('', soundInfo.file);
            console.log(`播放音效: ${soundType} (${soundInfo.event})`);
            return true;
        } catch (error) {
            console.error(`播放音效失败 (${soundType}):`, error);
            return false;
        }
    }

    // 内部方法：播放音频文件，支持回退机制
    _playAudioFile(absolutePath, relativePath, isBackground = false) {
        console.log(`尝试播放音频: 相对路径=${relativePath}`);
        
        // 创建一个统一的错误处理函数
        const handlePlayError = (error, pathType) => {
            console.warn(`${pathType}播放失败: ${error.message}`);
            console.warn(`错误详情:`, error);
        };
        
        // 只使用相对路径（更适合Web环境）
        try {
            const audio = new Audio(relativePath);
            console.log(`创建音频对象使用相对路径: ${relativePath}`);
            
            // 如果是背景音乐，保存引用并设置循环
            if (isBackground) {
                this.backgroundMusic = audio;
                audio.loop = true;
                audio.volume = 0.5; // 设置背景音乐音量为50%
            }
            
            audio.play().then(() => {
                console.log(`成功使用相对路径播放音频: ${relativePath}`);
            }).catch(error => {
                handlePlayError(error, "相对路径");
            });
        } catch (createError) {
            console.error(`创建相对路径音频对象失败: ${createError.message}`);
        }
    }
    
    // 播放背景音乐
    playBackgroundMusic(soundType) {
        console.log(`playBackgroundMusic被调用，soundType: ${soundType}`);
        if (!this.isInitialized || !this.soundConfig) {
            console.warn('音效管理器尚未初始化');
            return false;
        }
        console.log(`音效管理器已初始化，soundConfig:`, this.soundConfig);

        const soundInfo = this.soundConfig.sounds[soundType];
        if (!soundInfo) {
            console.warn(`未找到音效类型: ${soundType}`);
            return false;
        }
        console.log(`找到音效信息:`, soundInfo);

        try {
            // 先停止当前可能正在播放的背景音乐
            this.stopBackgroundMusic();
            
            // 播放新的背景音乐
            this._playAudioFile('', soundInfo.file, true);
            console.log(`播放背景音乐: ${soundType} (${soundInfo.event})，文件: ${soundInfo.file}`);
            return true;
        } catch (error) {
            console.error(`播放背景音乐失败 (${soundType}):`, error);
            return false;
        }
    }
    
    // 暂停背景音乐
    pauseBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            console.log('暂停背景音乐');
            return true;
        }
        return false;
    }
    
    // 恢复背景音乐
    resumeBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.play().catch(error => {
                console.error('恢复背景音乐失败:', error);
            });
            console.log('恢复背景音乐');
            return true;
        }
        return false;
    }
    
    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
            console.log('停止背景音乐');
            return true;
        }
        return false;
    }

    // 获取音效配置信息
    getSoundInfo(soundType) {
        if (!this.isInitialized || !this.soundConfig) {
            return null;
        }
        return this.soundConfig.sounds[soundType] || null;
    }

    // 获取所有音效事件列表
    getAllSoundEvents() {
        if (!this.isInitialized || !this.soundConfig) {
            return [];
        }
        
        const events = [];
        for (const [type, info] of Object.entries(this.soundConfig.sounds)) {
            events.push({
                type,
                event: info.event,
                description: info.description
            });
        }
        return events;
    }
}

// 创建并导出单例实例
const soundManager = new SoundManager();

// 在浏览器环境中，将实例和类暴露到全局
if (typeof window !== 'undefined') {
    // 导出常用的便捷函数
    window.playCorrectSound = () => soundManager.playSound('correctAnswer');
    window.playIncorrectSound = () => soundManager.playSound('incorrectAnswer');
    window.playQuestionBackgroundMusic = () => soundManager.playBackgroundMusic('questionBackground');
    window.stopQuestionBackgroundMusic = () => soundManager.stopBackgroundMusic();
    window.playGameBackgroundMusic = () => soundManager.playBackgroundMusic('gameBackground');
    window.stopGameBackgroundMusic = () => soundManager.stopBackgroundMusic();

    // 导出管理器类和实例，供其他模块使用
    window.SoundManager = SoundManager;
    window.soundManager = soundManager;
}

// 立即初始化音效管理器
try {
    soundManager.init().catch(error => {
        console.error('音效管理器初始化失败:', error);
        // 使用默认配置
        soundManager._useDefaultConfig();
    });
} catch (e) {
    console.error('尝试初始化音效管理器时出错:', e);
    // 使用默认配置
    soundManager._useDefaultConfig();
}