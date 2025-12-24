// animation.js - 角色动画管理模块
const animationManager = {
    // 角色动画状态和配置
    config: {
        idle: {
            frameWidth: 128,
            frameHeight: 128,
            frames: 7,
            frameDelay: 10 // 将在运行时从配置文件更新
        },
        walk: {
            frameWidth: 128,
            frameHeight: 128,
            frames: 12,
            frameDelay: 5 // 将在运行时从配置文件更新
        }
    },
    
    // 当前使用的角色目录
    currentCharacterDir: null,
    hasFormalResources: false, // 标记是否已加载正式资源（Girl_2）
    
    // 存储动画图片
    images: {
        idle: null,
        walk: null
    },
    
    // 初始化角色动画属性
    initPlayerAnimation: function(player) {
        player.isWalking = false;
        player.currentFrame = 0;
        player.frameCount = 0;
        // 保留原始碰撞箱大小设置，不覆盖game.js中定义的值
    },
    
    // 更新动画帧逻辑
    updateAnimation: function(player) {
        try {
            // 安全检查
            if (!player) return;
            
            // 每帧尝试同步帧延迟配置（只在第一次或配置有变化时生效，但这里为了简化直接每帧同步）
            if (window.characterConfig) {
                // 只在第一次调用时同步，避免每帧都同步
                if (!this.hasSyncedFrameDelay) {
                    this.syncFrameDelayFromConfig();
                    this.hasSyncedFrameDelay = true;
                }
            }
            
            // 初始化角色帧计数和当前帧，增强Edge兼容性
            player.frameCount = typeof player.frameCount === 'number' ? player.frameCount : 0;
            player.currentFrame = typeof player.currentFrame === 'number' ? player.currentFrame : 0;
            // 明确设置isWalking为布尔值，避免在Edge中出现undefined或其他非布尔值
            player.isWalking = Boolean(player.isWalking);
            
            // 增加帧计数
            player.frameCount++;
            
            // 根据角色的行走状态选择对应的动画配置
            const config = player.isWalking ? this.config.walk : this.config.idle;
            
            // 当帧计数达到延迟阈值时，切换当前帧
            if (player.frameCount >= config.frameDelay) {
                player.frameCount = 0;
                player.currentFrame = (player.currentFrame + 1) % config.frames;
            }
        } catch (err) {
            console.error('更新动画帧时出错:', err);
        }
    },
    
    // 绘制动画角色
    drawCharacter: function(ctx, player) {
        try {
            // 增强安全检查，确保在Edge中更健壮
            if (!ctx || !player || typeof ctx.drawImage !== 'function') {
                console.error('绘制角色失败：参数不完整或不支持drawImage');
                return false;
            }
            
            // 明确设置isWalking为布尔值，避免Edge中的类型问题
            player.isWalking = Boolean(player.isWalking);
            
            // 从内部images属性获取图片，增加额外的Edge兼容性检查
            const idleImage = this.images && this.images.idle ? this.images.idle : null;
            const walkImage = this.images && this.images.walk ? this.images.walk : null;
            
            // 增强图片选择逻辑，增加更严格的完整性检查，确保在Edge中正确判断图片状态
            let image = null;
            if (player.isWalking && walkImage && typeof walkImage.complete === 'boolean' && walkImage.complete && 
                typeof walkImage.width === 'number' && walkImage.width > 0) {
                image = walkImage;
            } else if (idleImage && typeof idleImage.complete === 'boolean' && idleImage.complete && 
                       typeof idleImage.width === 'number' && idleImage.width > 0) {
                image = idleImage;
            }
            
            if (image && typeof image.complete === 'boolean' && image.complete && 
                typeof image.width === 'number' && image.width > 0) {
                // 获取当前动画配置
                const config = player.isWalking ? this.config.walk : this.config.idle;
                
                // 确保帧索引有效，使用显式默认值避免Edge中的问题
                player.currentFrame = typeof player.currentFrame === 'number' ? player.currentFrame : 0;
                if (player.currentFrame < 0 || player.currentFrame >= config.frames) {
                    player.currentFrame = 0;
                }
                
                // 优先使用game.player.spriteOffsetY（如果game对象和该属性存在）
                let spriteOffsetY = 0;
                try {
                    if (window.game && window.game.player && typeof window.game.player.spriteOffsetY === 'number') {
                        spriteOffsetY = window.game.player.spriteOffsetY;
                    } else if (window.characterConfig && 
                               window.characterConfig.character && 
                               window.characterConfig.character.sprite && 
                               typeof window.characterConfig.character.sprite.offsetY === 'number') {
                        // 备选：从characterConfig获取
                        spriteOffsetY = window.characterConfig.character.sprite.offsetY;
                    }
                } catch (e) {
                    spriteOffsetY = 0;
                }
                
                // 计算源图像的裁剪区域
                const sourceX = Math.floor(player.currentFrame * config.frameWidth);
                const sourceY = 0;
                
                // 保存当前上下文状态
                // 保存当前上下文状态
                ctx.save();
                
                try {
                    // 计算绘制位置（中心点对齐），添加安全检查
                    const drawX = typeof player.x === 'number' ? player.x : 0;
                    const drawY = typeof player.y === 'number' ? player.y : 0;
                    const playerWidth = typeof player.width === 'number' ? player.width : 30;
                    const playerHeight = typeof player.height === 'number' ? player.height : 50;
                    
                    // 计算角色中心点
                    const centerX = drawX + playerWidth/2;
                    const centerY = drawY + playerHeight/2;
                    
                    // 根据方向绘制角色
                    if (player.direction !== 'left') {
                        // 右侧方向直接绘制
                        ctx.drawImage(
                            image,
                            sourceX, sourceY,
                            config.frameWidth, config.frameHeight,
                            centerX - config.frameWidth/2,
                            centerY - config.frameHeight/2 + spriteOffsetY,
                            config.frameWidth, config.frameHeight
                        );
                    } else {
                        // 左侧方向，使用transform实现镜像对称
                        ctx.save();
                        // 移动到中心点，水平翻转，再绘制
                        ctx.translate(centerX, 0);
                        ctx.scale(-1, 1);
                        
                        // 绘制镜像后的角色，确保与中心点对齐
                        ctx.drawImage(
                            image,
                            sourceX, sourceY,
                            config.frameWidth, config.frameHeight,
                            -config.frameWidth/2,
                            centerY - config.frameHeight/2 + spriteOffsetY,
                            config.frameWidth, config.frameHeight
                        );
                        ctx.restore();
                    }
                } catch (err) {
                    console.error('绘制角色时出错:', err);
                } finally {
                    // 确保恢复上下文状态
                    try {
                        ctx.restore();
                    } catch (restoreError) {
                        console.error('无法恢复Canvas状态:', restoreError);
                    }
                }
                
                // 图片绘制成功
                return true;
            } else {
                // 图片未加载完成或加载失败时，使用备用绘制
                this.drawFallbackCharacter(ctx, player);
                return false;
            }
        } catch (err) {
            console.error('在Edge中绘制角色图片时出错:', err);
            // 如果绘制图片失败，回退到备用绘制
            try {
                this.drawFallbackCharacter(ctx, player);
            } catch (fallbackError) {
                console.error('备用绘制也失败了:', fallbackError);
            }
            return false;
        }
    },
    
    // 增强的备用绘制函数，提供更生动的几何图形动画，并支持方向翻转
    drawFallbackCharacter: function(ctx, player) {
        // 保存上下文状态
        ctx.save();
        
        // 处理角色方向，实现镜像对称
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        
        // 如果方向是左侧，应用水平翻转
        if (player.direction === 'left') {
            // 移动到中心点，翻转，再移动回来
            ctx.translate(centerX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, 0);
        }
        
        // 设置角色颜色
        ctx.fillStyle = player.isWalking ? '#457B9D' : '#E63946'; // 行走时蓝色，静止时红色
        
        // 头部
        ctx.fillStyle = '#F1FAEE'; // 肤色
        ctx.beginPath();
        ctx.arc(centerX, player.y + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 身体
        ctx.fillStyle = player.isWalking ? '#457B9D' : '#E63946';
        ctx.fillRect(player.x + 2, player.y + 18, player.width - 4, player.height - 18);
        
        // 添加简单的动画效果 - 基于当前帧位置的腿部动画
        if (player.isWalking) {
            // 计算腿部动画偏移量
            const legOffset = Math.sin(player.currentFrame * 0.5) * 5;
            
            // 左腿
            ctx.fillStyle = '#1D3557'; // 裤子颜色
            ctx.fillRect(player.x + 3, player.y + player.height - 10, 6, 10);
            
            // 右腿（带动画）
            ctx.fillStyle = '#1D3557';
            ctx.fillRect(player.x + player.width - 9, player.y + player.height - 10 + legOffset, 6, 10);
        } else {
            // 静态站立姿势
            ctx.fillStyle = '#1D3557';
            ctx.fillRect(player.x + 3, player.y + player.height - 10, 6, 10);
            ctx.fillRect(player.x + player.width - 9, player.y + player.height - 10, 6, 10);
        }
        
        // 恢复上下文状态
        ctx.restore();
    },
    
    // 处理角色移动状态
    handleKeyDown: function(player, keys, key) {
        if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            player.direction = 'right';
            // 只在不跳跃时设置isWalking为true
            if (!player.isJumping) {
                player.isWalking = true;
            }
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            player.direction = 'left';
            // 只在不跳跃时设置isWalking为true
            if (!player.isJumping) {
                player.isWalking = true;
            }
        }
    },
    
    // 处理角色停止状态
    handleKeyUp: function(player, keys, key) {
        if (key === 'ArrowRight' || key === 'd' || key === 'D') {
            // 如果没有左右键按下，则停止行走
            if (!keys.left) {
                player.isWalking = false;
                player.currentFrame = 0;
            } else {
                player.direction = 'left';
                // 只在不跳跃时设置isWalking为true
                if (!player.isJumping) {
                    player.isWalking = true;
                }
            }
        } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
            // 如果没有左右键按下，则停止行走
            if (!keys.right) {
                player.isWalking = false;
                player.currentFrame = 0;
            } else {
                player.direction = 'right';
                // 只在不跳跃时设置isWalking为true
                if (!player.isJumping) {
                    player.isWalking = true;
                }
            }
        }
    },
    
    // 加载角色动画图片
    loadAnimationImages: function(onLoad) {
        console.log('=== 开始加载动画图片 ===');
        const idleImage = new Image();
        const walkImage = new Image();
        
        let loadedCount = 0;
        let errorCount = 0;
        const totalImages = 2;
        
        // 重置图片加载标志
        this.hasIdleImage = false;
        this.hasWalkImage = false;
        this.currentCharacterDir = null;
        this.hasFormalResources = false; // 重置正式资源标志
        
        // 使用相对路径加载图片，提高兼容性
        // 优先加载Girl_2目录（正式页面）的图片，如果失败再加载Girl_1目录（备用页面）的图片
        const imagePaths = {
            idle: ['Girl_2/Idle.png', 'Girl_1/Idle.png'],
            walk: ['Girl_2/Walk.png', 'Girl_1/Walk.png']
        };
        
        console.log('图片加载策略: 先检测正式页面(Girl_2)，如果不存在再加载备用页面(Girl_1)');
        
        // 添加回退到Girl_1目录的逻辑
        const tryLoadImage = function(img, paths, imageType) {
            if (paths.length === 0) {
                console.error('❌ 所有图片路径都失败了 for:', imageType);
                errorCount++;
                // 即使所有路径都失败，仍然标记为已加载以允许回退绘制
                if (!img.complete) {
                    Object.defineProperty(img, 'complete', { value: true, writable: true });
                }
                checkComplete();
                return;
            }
            
            const currentPath = paths[0];
            console.log('🔄 尝试加载图片:', currentPath, '类型:', imageType);
            // 设置图片跨域处理，避免潜在的Canvas安全错误
            img.crossOrigin = 'anonymous';
            img.src = currentPath;
            
            // 添加加载超时处理
            const timeout = setTimeout(() => {
                console.warn(`Timeout loading ${currentPath}, trying next directory`);
                tryLoadImage(img, paths.slice(1), imageType);
            }, 5000); // 5秒超时
            
            img.onload = function() {
                clearTimeout(timeout);
                // 增强图片验证
                if (!img.width || img.width === 0) {
                    console.warn(`Image ${currentPath} loaded but has invalid dimensions`);
                    tryLoadImage(img, paths.slice(1), imageType);
                } else {
                    console.log(`Successfully loaded image: ${currentPath}, width: ${img.width}, height: ${img.height}`);
                    // 设置使用的角色目录
                    if (currentPath.includes('Girl_1')) {
                        animationManager.currentCharacterDir = 'Girl_1';
                        console.log('使用的是备用资源目录: Girl_1');
                    } else if (currentPath.includes('Girl_2')) {
                        animationManager.currentCharacterDir = 'Girl_2';
                        animationManager.hasFormalResources = true; // 标记正式资源已加载
                        console.log('已成功加载正式资源(Girl_2)');
                    }
                    // 添加图片加载成功标志
                    if (imageType === 'idle') {
                        animationManager.hasIdleImage = true;
                        console.log('Idle image loaded successfully');
                    }
                    if (imageType === 'walk') {
                        animationManager.hasWalkImage = true;
                        console.log('Walk image loaded successfully');
                    }
                    loadedCount++;
                    checkComplete();
                }
            };
            
            img.onerror = function() {
                clearTimeout(timeout);
                console.error('Failed to load image:', currentPath);
                // 尝试下一个路径
                tryLoadImage(img, paths.slice(1), imageType);
            };
        };
        
        const checkComplete = function() {
            console.log(`Image loading status: ${loadedCount} loaded, ${errorCount} failed`);
            // 不管成功还是失败，只要所有图片都处理完毕，就继续初始化
            if (loadedCount + errorCount === totalImages && onLoad) {
                // 传递加载成功的状态（至少有一张图片加载成功）
                const success = loadedCount > 0;
                onLoad(success);
            }
        };
        
        // 尝试加载图片，先尝试Girl_2目录，如果失败则回退到Girl_1目录
        console.log('尝试加载的图片路径列表:');
        console.log('Idle images:', imagePaths.idle);
        console.log('Walk images:', imagePaths.walk);
        tryLoadImage(idleImage, imagePaths.idle, 'idle');
        tryLoadImage(walkImage, imagePaths.walk, 'walk');
        
        // 存储图片到animationManager的images属性中
        this.images.idle = idleImage;
        this.images.walk = walkImage;
        
        // 返回图片对象，便于外部使用
        return { idleImage, walkImage };
    },
    
    // 获取已加载的动画图片
    getImages: function() {
        return {
            idle: this.images.idle,
            walk: this.images.walk
        };
    },
    
    // 检查图片是否已加载完成（更宽松的检查，允许部分图片加载失败）
    areImagesLoaded: function() {
        // 增强Edge兼容性：更严格的图片加载检查，使用typeof确保属性存在且类型正确
        try {
            const hasIdleImage = this.images && this.images.idle && 
                                typeof this.images.idle.complete === 'boolean' && this.images.idle.complete && 
                                typeof this.images.idle.width === 'number' && this.images.idle.width > 0;
            
            const hasWalkImage = this.images && this.images.walk && 
                                typeof this.images.walk.complete === 'boolean' && this.images.walk.complete && 
                                typeof this.images.walk.width === 'number' && this.images.walk.width > 0;
            
            const hasAnyImage = hasIdleImage || hasWalkImage;
            
            // 详细日志，帮助调试Edge浏览器中的问题
            console.log('=== 图片资源检查（Edge兼容版）===');
            console.log('Has any images loaded:', hasAnyImage);
            if (this.images) {
                console.log('Image availability:', {
                    idle: hasIdleImage,
                    walk: hasWalkImage
                });
                console.log('Image details:', {
                    idle: this.images.idle ? {
                        width: typeof this.images.idle.width === 'number' ? this.images.idle.width : 'not a number',
                        height: typeof this.images.idle.height === 'number' ? this.images.idle.height : 'not a number',
                        complete: typeof this.images.idle.complete === 'boolean' ? this.images.idle.complete : 'not a boolean',
                        src: this.images.idle.src || 'no src'
                    } : null,
                    walk: this.images.walk ? {
                        width: typeof this.images.walk.width === 'number' ? this.images.walk.width : 'not a number',
                        height: typeof this.images.walk.height === 'number' ? this.images.walk.height : 'not a number',
                        complete: typeof this.images.walk.complete === 'boolean' ? this.images.walk.complete : 'not a boolean',
                        src: this.images.walk.src || 'no src'
                    } : null
                });
            } else {
                console.log('images对象未初始化');
            }
            
            return hasAnyImage;
        } catch (e) {
            console.error('检查图片加载状态时出错:', e);
            return false;
        }
    },
};

// 添加一个方法来检查动画管理器是否准备就绪
animationManager.isReady = function() {
    // 增强Edge兼容性：使用更健壮的属性检查方式
    try {
        // 检查images对象是否已初始化并且图片是否已加载，增加对Edge浏览器的兼容
        const hasIdleImage = this.images && this.images.idle && 
                            typeof this.images.idle.complete === 'boolean' && this.images.idle.complete && 
                            typeof this.images.idle.width === 'number' && this.images.idle.width > 0;
        
        const hasWalkImage = this.images && this.images.walk && 
                            typeof this.images.walk.complete === 'boolean' && this.images.walk.complete && 
                            typeof this.images.walk.width === 'number' && this.images.walk.width > 0;
        
        const hasImages = hasIdleImage || hasWalkImage;
        
        console.log('Animation manager ready check (Edge兼容版):', { 
            hasImages, 
            hasIdle: hasIdleImage, 
            hasWalk: hasWalkImage,
            hasImagesObj: !!this.images
        });
        
        return hasImages;
    } catch (e) {
        console.error('检查动画管理器就绪状态时出错:', e);
        return false;
    }
};

// 添加从配置文件同步帧延迟的函数
animationManager.syncFrameDelayFromConfig = function() {
    try {
        console.log('animationManager尝试从配置同步帧延迟...');
        
        // 检查window.characterConfig是否存在
        if (window.characterConfig && window.characterConfig.character && 
            window.characterConfig.character.animation && 
            window.characterConfig.character.animation.frameDelay) {
            
            const configFrameDelay = window.characterConfig.character.animation.frameDelay;
            console.log('从window.characterConfig获取的frameDelay:', configFrameDelay);
            
            // 应用idle帧延迟
            if (configFrameDelay.idle !== undefined) {
                this.config.idle.frameDelay = configFrameDelay.idle;
                console.log('animationManager已同步idle帧延迟为:', configFrameDelay.idle);
            }
            
            // 应用walk帧延迟
            if (configFrameDelay.walk !== undefined) {
                this.config.walk.frameDelay = configFrameDelay.walk;
                console.log('animationManager已同步walk帧延迟为:', configFrameDelay.walk);
            }
        } else {
            console.log('window.characterConfig尚未准备好');
        }
    } catch (e) {
        console.error('同步帧延迟配置时出错:', e);
    }
};

// 添加状态标记
animationManager.hasIdleImage = false;
animationManager.hasWalkImage = false;
animationManager.hasSyncedFrameDelay = false; // 标记是否已同步帧延迟配置

// 使动画管理器成为全局变量
window.animationManager = animationManager;

// 自动初始化动画，增强Edge兼容性
console.log('Animation manager initialized (Edge兼容版)');

// 只在一个地方加载图片，避免重复加载
try {
    // 确保window对象存在
    if (typeof window !== 'undefined') {
        // 在DOMContentLoaded后再加载图片，增强Edge兼容性
        if (document.readyState === 'loading') {
            // 如果文档正在加载中，等待DOMContentLoaded事件
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM content loaded, starting image loading');
                loadAnimationResources();
            });
        } else {
            // 文档已加载完成，直接加载图片
            setTimeout(loadAnimationResources, 100); // 延迟一小段时间确保更好的兼容性
        }
    } else {
        console.warn('window对象不可用，跳过图片加载');
    }
} catch (err) {
    console.error('Initial animation setup failed:', err);
    // 尝试直接加载图片作为后备方案
    try {
        loadAnimationResources();
    } catch (fallbackErr) {
        console.error('Fallback loading also failed:', fallbackErr);
    }
}

// 分离的图片加载函数，方便多次调用
function loadAnimationResources() {
    try {
        // 使用loadAnimationImages方法加载图片，该方法已配置为使用相对路径提高兼容性
        animationManager.loadAnimationImages(function() {
            console.log('Image loading complete (Edge兼容版)');
            console.log('Current character directory:', animationManager.currentCharacterDir);
            console.log('Animation manager ready status:', animationManager.isReady());
            
            // 在Edge浏览器中强制更新一次状态标志
            animationManager.hasIdleImage = animationManager.images && animationManager.images.idle && 
                                           typeof animationManager.images.idle.complete === 'boolean' && animationManager.images.idle.complete && 
                                           typeof animationManager.images.idle.width === 'number' && animationManager.images.idle.width > 0;
            
            animationManager.hasWalkImage = animationManager.images && animationManager.images.walk && 
                                           typeof animationManager.images.walk.complete === 'boolean' && animationManager.images.walk.complete && 
                                           typeof animationManager.images.walk.width === 'number' && animationManager.images.walk.width > 0;
            
            console.log('Updated image flags for Edge compatibility:', {
                hasIdleImage: animationManager.hasIdleImage,
                hasWalkImage: animationManager.hasWalkImage
            });
        });
    } catch (err) {
        console.error('Image loading failed:', err);
    }
}