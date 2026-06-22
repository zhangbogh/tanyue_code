const GameData = {
    materials: {
        '碳酸钙': { category: 'basic', count: 0, icon: '🪨' },
        '盐酸': { category: 'basic', count: 3, icon: '🧪' },
        '过氧化氢': { category: 'basic', count: 3, icon: '🧴' },
        '二氧化锰': { category: 'basic', count: 2, icon: '⬛' },
        '锌粒': { category: 'basic', count: 3, icon: '⚪' },
        '稀硫酸': { category: 'basic', count: 2, icon: '💧' },
        '氧化钙': { category: 'advanced', count: 2, icon: '⚪' },
        '水': { category: 'basic', count: 10, icon: '💧' },
        '硫酸铜': { category: 'advanced', count: 1, icon: '🔵' },
        '乙醇': { category: 'advanced', count: 1, icon: '🧪' },
        '乙酸': { category: 'advanced', count: 1, icon: '🧪' },
        '浓硫酸': { category: 'high', count: 0, icon: '☠️' },
        '浓盐酸': { category: 'high', count: 0, icon: '☠️' },
        '高锰酸钾': { category: 'high', count: 0, icon: '🟣' },
        '氯酸钾': { category: 'high', count: 0, icon: '⚪' },
        '碳酸钠': { category: 'advanced', count: 0, icon: '🧂' },
        '产物_二氧化碳': { category: 'product', count: 0, icon: '💨' },
        '产物_氧气': { category: 'product', count: 0, icon: '🫧' },
        '产物_氢气': { category: 'product', count: 0, icon: '⚡' },
        '产物_硫酸铜晶体': { category: 'product', count: 0, icon: '💎' },
        '产物_氢氧化钙': { category: 'product', count: 0, icon: '🧪' },
        '产物_乙酸乙酯': { category: 'product', count: 0, icon: '✨' },
        '产物_氯化氢': { category: 'product', count: 0, icon: '☁️' },
        '产物_氧化钙': { category: 'product', count: 0, icon: '⬜' },
        '产物_氢氧化钠': { category: 'product', count: 0, icon: '🧊' },
        '副产物_氯化钠': { category: 'waste', count: 0, icon: '🧂' },
    },

    recipes: [
        {
            id: 'co2',
            name: '二氧化碳',
            category: 'basic',
            formula: '碳酸钙 + 盐酸 → 二氧化碳',
            reagents: ['碳酸钙', '盐酸'],
            product: '产物_二氧化碳',
            successRate: 1.0,
            experience: 10,
            gold: 15,
            description: '基础反应，产生气泡',
            image: 'images/1.1.png',
            unlocked: true
        },
        {
            id: 'o2',
            name: '氧气',
            category: 'basic',
            formula: '过氧化氢 + 二氧化锰 → 氧气',
            reagents: ['过氧化氢', '二氧化锰'],
            product: '产物_氧气',
            successRate: 0.95,
            experience: 12,
            gold: 18,
            description: '产生无色气泡',
            image: 'images/4.1.png',
            unlocked: true
        },
        {
            id: 'h2',
            name: '氢气',
            category: 'basic',
            formula: '锌粒 + 稀硫酸 → 氢气',
            reagents: ['锌粒', '稀硫酸'],
            product: '产物_氢气',
            successRate: 0.95,
            experience: 12,
            gold: 18,
            description: '产生可燃气体',
            image: 'images/3.1.png',
            unlocked: true
        },
        {
            id: 'cu_so4_crystal',
            name: '硫酸铜晶体',
            category: 'advanced',
            formula: '硫酸铜 + 水 → 硫酸铜晶体',
            reagents: ['硫酸铜', '水'],
            product: '产物_硫酸铜晶体',
            successRate: 0.8,
            experience: 25,
            gold: 35,
            description: '蓝色晶体析出',
            image: '',
            unlocked: false
        },
        {
            id: 'ca_oh2',
            name: '氢氧化钙',
            category: 'advanced',
            formula: '氧化钙 + 水 → 氢氧化钙',
            reagents: ['氧化钙', '水'],
            product: '产物_氢氧化钙',
            successRate: 0.85,
            experience: 20,
            gold: 28,
            description: '放热反应',
            image: '',
            unlocked: false
        },
        {
            id: 'ethyl_acetate',
            name: '乙酸乙酯',
            category: 'high',
            formula: '乙酸 + 乙醇 + 浓硫酸 → 乙酸乙酯',
            reagents: ['乙酸', '乙醇', '浓硫酸'],
            product: '产物_乙酸乙酯',
            successRate: 0.6,
            experience: 50,
            gold: 80,
            description: '需要加热催化',
            image: '',
            unlocked: false
        },
        {
            id: 'hcl_gas',
            name: '氯化氢气体',
            category: 'advanced',
            formula: '浓盐酸 + 浓硫酸 → 氯化氢',
            reagents: ['浓盐酸', '浓硫酸'],
            product: '产物_氯化氢',
            successRate: 0.75,
            experience: 30,
            gold: 40,
            description: '脱水反应产生酸性气体',
            image: '',
            unlocked: false
        },
        {
            id: 'o2_kmno4',
            name: '氧气(高锰酸钾法)',
            category: 'advanced',
            formula: '高锰酸钾 → 氧气 + 二氧化锰',
            reagents: ['高锰酸钾'],
            product: '产物_氧气',
            successRate: 0.9,
            experience: 22,
            gold: 30,
            description: '加热分解产生氧气',
            image: '',
            unlocked: false
        },
        {
            id: 'ca_co3_decompose',
            name: '生石灰',
            category: 'high',
            formula: '碳酸钙 → 氧化钙 + 二氧化碳',
            reagents: ['碳酸钙', '碳酸钙'],
            product: '产物_氧化钙',
            successRate: 0.7,
            experience: 35,
            gold: 50,
            description: '高温分解石灰石',
            image: '',
            unlocked: false
        },
        {
            id: 'naoh',
            name: '氢氧化钠',
            category: 'high',
            formula: '氧化钙 + 水 + 碳酸钠 → 氢氧化钠',
            reagents: ['氧化钙', '水', '碳酸钠'],
            product: '产物_氢氧化钠',
            successRate: 0.65,
            experience: 45,
            gold: 70,
            description: '苛化法制碱',
            image: '',
            unlocked: false
        }
    ],

    shopItems: [
        { name: '碳酸钙', price: 5, icon: '🪨' },
        { name: '盐酸', price: 8, icon: '🧪' },
        { name: '过氧化氢', price: 10, icon: '🧴' },
        { name: '二氧化锰', price: 12, icon: '⬛' },
        { name: '锌粒', price: 8, icon: '⚪' },
        { name: '稀硫酸', price: 15, icon: '💧' },
        { name: '氧化钙', price: 20, icon: '⚪' },
        { name: '水', price: 2, icon: '💧' },
        { name: '硫酸铜', price: 25, icon: '🔵' },
        { name: '乙醇', price: 30, icon: '🧪' },
        { name: '乙酸', price: 30, icon: '🧪' },
        { name: '浓硫酸', price: 50, icon: '☠️' },
        { name: '浓盐酸', price: 45, icon: '☠️' },
        { name: '高锰酸钾', price: 60, icon: '🟣' },
        { name: '碳酸钠', price: 35, icon: '🧂' },
    ],

    recipeShopItems: [
        { recipeId: 'ca_oh2', name: '📜 氢氧化钙图纸', price: 35, icon: '📜', requiredLevel: 2 },
        { recipeId: 'cu_so4_crystal', name: '📜 硫酸铜晶体图纸', price: 40, icon: '📜', requiredLevel: 2 },
        { recipeId: 'o2_kmno4', name: '📜 氧气(高锰酸钾法)图纸', price: 45, icon: '📜', requiredLevel: 3 },
        { recipeId: 'hcl_gas', name: '📜 氯化氢气体图纸', price: 50, icon: '📜', requiredLevel: 3 },
        { recipeId: 'ca_co3_decompose', name: '📜 生石灰图纸', price: 60, icon: '📜', requiredLevel: 4 },
        { recipeId: 'ethyl_acetate', name: '📜 乙酸乙酯图纸', price: 80, icon: '📜', requiredLevel: 5 },
        { recipeId: 'naoh', name: '📜 氢氧化钠图纸', price: 100, icon: '📜', requiredLevel: 6 },
    ],

    customers: [],
    nextCustomerId: 1,

    player: {
        gold: 100,
        experience: 0,
        level: 1,
        levelName: '学徒'
    },

    levelThresholds: [
        { level: 1, name: '学徒', threshold: 0 },
        { level: 2, name: '初阶炼金术士', threshold: 50 },
        { level: 3, name: '进阶级炼金术士', threshold: 120 },
        { level: 4, name: '高阶炼金术士', threshold: 250 },
        { level: 5, name: '大师级炼金术士', threshold: 500 },
        { level: 6, name: '专家级炼金术士', threshold: 1000 },
        { level: 7, name: '资深炼金术士', threshold: 2000 },
        { level: 8, name: '传奇炼金术士', threshold: 4000 },
        { level: 9, name: '宗师级炼金术士', threshold: 8000 },
        { level: 10, name: '巅峰炼金术士', threshold: 16000 }
    ],

    garden: {
        collected: 0,
        required: 3,
        items: [],
        regions: [
            { id: 'white_rock', name: '白岩石灰岩区', icon: '⚪', material: '碳酸钙', materialIcon: '🪨', unlocked: true, bg: 'url(images/5.png)' },
            { id: 'green_garden', name: '绿植花圃区', icon: '🌿', material: '土壤', materialIcon: '🟤', unlocked: true, bg: 'linear-gradient(180deg, #90EE90 0%, #228B22 50%, #006400 100%)' },
            { id: 'deadwood', name: '枯木林区', icon: '🌳', material: '枯树枝', materialIcon: '🪵', unlocked: true, bg: 'linear-gradient(180deg, #D2B48C 0%, #8B4513 50%, #654321 100%)' },
            { id: 'pond', name: '清水池塘区', icon: '💧', material: '清水', materialIcon: '💧', unlocked: true, bg: 'linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #000080 100%)' },
            { id: 'metal_cave', name: '金属矿洞区', icon: '⛏️', material: '锌粒', materialIcon: '⚪', unlocked: false, bg: 'linear-gradient(180deg, #696969 0%, #4a4a4a 50%, #2f2f2f 100%)' },
            { id: 'manganese', name: '软锰矿矿区', icon: '🖤', material: '二氧化锰', materialIcon: '⚫', unlocked: false, bg: 'linear-gradient(180deg, #4a4a4a 0%, #2f2f2f 50%, #1a1a1a 100%)' },
            { id: 'volcano', name: '火山硫磺区', icon: '🌋', material: '硫磺', materialIcon: '🟡', unlocked: false, bg: 'linear-gradient(180deg, #FF4500 0%, #8B0000 50%, #4a0000 100%)' },
            { id: 'salt_lake', name: '盐湖结晶区', icon: '🏜️', material: '氯化钠', materialIcon: '🧂', unlocked: false, bg: 'linear-gradient(180deg, #f0f8ff 0%, #e6e6fa 50%, #d8bfd8 100%)' },
            { id: 'charcoal_pile', name: '木炭堆区', icon: '🔥', material: '木炭', materialIcon: '⬛', unlocked: false, bg: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 50%, #0a0a0a 100%)' },
            { id: 'sand_area', name: '细沙区', icon: '🏖️', material: '二氧化硅', materialIcon: '🏜️', unlocked: false, bg: 'linear-gradient(180deg, #F4A460 0%, #DEB887 50%, #D2B48C 100%)' }
        ],
        currentRegion: null,
        refreshInterval: 120000
    }
};

let currentRecipe = null;
let addedReagents = [];
let isHeating = false;
let isCrafting = false;
let draggedMaterial = null;
let dragElement = null;
let isLampLit = false;
let isHourglassRunning = false;
let hourglassStartTime = 0;
let hourglassDuration = 10000;
let hourglassTimer = null;
let reactionQuality = null;
let hasTransitionedToLevel = false;
let flameSound = null;

function startGame() {
    // 设置状态锁，防止后续事件重复跳转到第一关页面
    hasTransitionedToLevel = true;
    
    // 清除视频超时定时器，防止游戏过程中被跳回第一关页面
    if (window._videoTimeoutId) {
        clearTimeout(window._videoTimeoutId);
        window._videoTimeoutId = null;
    }
    
    document.getElementById('level-intro').classList.add('hidden');
    document.getElementById('bgm').play();
    goToGarden();
}

function goToGarden() {
    document.getElementById('lab-scene').classList.remove('active');
    document.getElementById('garden-scene').classList.remove('active');
    document.getElementById('region-scene').classList.add('active');
    renderRegions();
    updateSceneToggleButton();
}

function showRegionSelect() {
    const existingPickaxe = document.getElementById('pickaxe');
    if (existingPickaxe) {
        existingPickaxe.remove();
        console.log('稿子已从页面移除');
    }
    
    document.body.classList.remove('cursor-pickaxe');
    
    document.getElementById('garden-scene').classList.remove('active');
    document.getElementById('region-scene').classList.add('active');
    renderRegions();
}

function renderRegions() {
    const grid = document.getElementById('region-grid');
    grid.innerHTML = '';
    
    GameData.garden.regions.forEach(region => {
        const card = document.createElement('div');
        card.className = 'region-card' + (region.unlocked ? '' : ' locked');
        card.innerHTML = `
            <div class="region-icon">${region.icon}</div>
            <div class="region-name">${region.name}</div>
        `;
        if (region.unlocked) {
            card.onclick = () => enterRegion(region);
        }
        grid.appendChild(card);
    });
}

function enterRegion(region) {
    GameData.garden.currentRegion = region;
    document.getElementById('region-scene').classList.remove('active');
    document.getElementById('garden-scene').classList.add('active');
    
    const gardenScene = document.querySelector('.garden-scene');
    gardenScene.style.backgroundImage = region.bg;
    gardenScene.style.backgroundSize = 'cover';
    gardenScene.style.backgroundPosition = 'center';
    gardenScene.style.backgroundRepeat = 'no-repeat';
    
    document.getElementById('garden-title').textContent = region.icon + ' ' + region.name;
    document.getElementById('garden-task-desc').innerHTML = `在<span style="color: #f39c12;">${region.name}</span>中找到并收集 <strong>${region.material}</strong>`;
    
    document.body.classList.remove('cursor-pickaxe');

    initGarden();
    
    // 在白岩石灰岩区添加可拖动的稿子
    if (region.id === 'white_rock') {
        addPickaxeToGarden();
    } else {
        // 移除稿子（如果存在）
        const existingPickaxe = document.getElementById('pickaxe');
        if (existingPickaxe) {
            existingPickaxe.remove();
            console.log('稿子已从页面移除');
        }
    }
}

function goToLab() {
    // 移除稿子（如果存在）
    const existingPickaxe = document.getElementById('pickaxe');
    if (existingPickaxe) {
        existingPickaxe.remove();
        console.log('稿子已从页面移除');
    }
    
    document.body.classList.remove('cursor-pickaxe');
    
    document.getElementById('garden-scene').classList.remove('active');
    document.getElementById('region-scene').classList.remove('active');
    document.getElementById('lab-scene').classList.add('active');
    renderMaterials();
    updateSceneToggleButton();
}

function toggleScene() {
    const labScene = document.getElementById('lab-scene');
    if (labScene.classList.contains('active')) {
        goToGarden();
    } else {
        goToLab();
    }
}

function updateSceneToggleButton() {
    const btn = document.getElementById('scene-toggle-btn');
    const labScene = document.getElementById('lab-scene');
    if (labScene.classList.contains('active')) {
        btn.innerHTML = '🌸 后花园';
    } else {
        btn.innerHTML = '⚗️ 实验室';
    }
}

function initGarden() {
    const collectiblesContainer = document.getElementById('collectibles');
    collectiblesContainer.innerHTML = '';
    GameData.garden.collected = 0;
    GameData.garden.items = [];
    updateGardenUI();

    // 只生成可收集的材料，不生成装饰元素
    spawnMaterials();

    if (GameData.garden.refreshTimer) {
        clearInterval(GameData.garden.refreshTimer);
    }
    GameData.garden.refreshTimer = setInterval(() => {
        refreshGarden();
    }, GameData.garden.refreshInterval);
}

function addPickaxeToGarden() {
    const existingPickaxe = document.getElementById('pickaxe');
    if (existingPickaxe) {
        existingPickaxe.remove();
    }
    
    const pickaxe = document.createElement('div');
    pickaxe.id = 'pickaxe';
    pickaxe.className = 'pickaxe';
    pickaxe.innerHTML = '⛏️ 稿子';
    
    pickaxe.style.position = 'fixed';
    pickaxe.style.bottom = '20px';
    pickaxe.style.right = '20px';
    pickaxe.style.padding = '15px 20px';
    pickaxe.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
    pickaxe.style.color = 'white';
    pickaxe.style.borderRadius = '10px';
    pickaxe.style.cursor = 'grab';
    pickaxe.style.zIndex = '9999';
    pickaxe.style.fontSize = '18px';
    pickaxe.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    pickaxe.style.transition = 'all 0.2s ease';
    pickaxe.style.userSelect = 'none';
    
    pickaxe.addEventListener('mouseenter', function() {
        if (!pickaxe._isDragging) {
            pickaxe.style.transform = 'scale(1.05)';
            pickaxe.style.backgroundColor = 'rgba(52, 73, 94, 0.95)';
        }
    });
    
    pickaxe.addEventListener('mouseleave', function() {
        if (!pickaxe._isDragging) {
            pickaxe.style.transform = 'scale(1)';
            pickaxe.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
        }
    });

    let dragClone = null;
    let offsetX = 0;
    let offsetY = 0;

    pickaxe.addEventListener('mousedown', function(e) {
        e.preventDefault();
        pickaxe._isDragging = true;
        document.body.classList.add('cursor-pickaxe');
        playSoundEffect('images/镐子拖动的声音.m4a', 800);

        const rect = pickaxe.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        dragClone = document.createElement('div');
        dragClone.id = 'pickaxe-drag-clone';
        dragClone.textContent = '⛏️';
        dragClone.style.position = 'fixed';
        dragClone.style.left = (e.clientX - 16) + 'px';
        dragClone.style.top = (e.clientY - 16) + 'px';
        dragClone.style.fontSize = '32px';
        dragClone.style.zIndex = '10000';
        dragClone.style.pointerEvents = 'none';
        dragClone.style.userSelect = 'none';
        document.body.appendChild(dragClone);

        pickaxe.style.opacity = '0.4';
    });

    document.addEventListener('mousemove', function(e) {
        if (!dragClone) return;
        dragClone.style.left = (e.clientX - 16) + 'px';
        dragClone.style.top = (e.clientY - 16) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        if (!dragClone) return;

        const hitEl = document.elementFromPoint(e.clientX, e.clientY);
        const collectible = hitEl ? hitEl.closest('.collectible-stone') : null;
        const hitTarget = collectible && !collectible.classList.contains('collected');

        if (hitTarget) {
            dragClone.style.transition = 'transform 0.1s ease';
            dragClone.style.transform = 'rotate(-45deg) scale(1.3)';
            dragClone.style.transformOrigin = 'bottom right';

            setTimeout(() => {
                dragClone.style.transform = 'rotate(15deg) scale(1.1)';
            }, 100);

            setTimeout(() => {
                dragClone.style.transform = 'rotate(-45deg) scale(1.3)';
            }, 180);

            setTimeout(() => {
                dragClone.style.transform = 'rotate(0deg) scale(1)';
            }, 260);

            setTimeout(() => {
                dragClone.remove();
                dragClone = null;
                pickaxe._isDragging = false;
                pickaxe.style.opacity = '1';
                pickaxe.style.transform = 'scale(1)';
                pickaxe.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
                document.body.classList.remove('cursor-pickaxe');
                handlePickaxeHit(collectible);
            }, 350);
        } else {
            dragClone.remove();
            dragClone = null;
            pickaxe._isDragging = false;
            pickaxe.style.opacity = '1';
            pickaxe.style.transform = 'scale(1)';
            pickaxe.style.backgroundColor = 'rgba(44, 62, 80, 0.9)';
            document.body.classList.remove('cursor-pickaxe');
        }
    });
    
    document.body.appendChild(pickaxe);
}

function handlePickaxeHit(el) {
    const materialName = el.dataset.material;
    if (!materialName) return;

    el.classList.add('hit-shake');
    playSoundEffect('images/碳酸钙破碎声(1).m4a', 1000);

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const flash = document.createElement('div');
    flash.className = 'stone-flash';
    flash.style.cssText = `
        position: fixed;
        left: ${cx}px;
        top: ${cy}px;
        z-index: 10002;
        pointer-events: none;
    `;
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());

    const colors = ['#a0a0a0', '#b8b8b8', '#8a8a7a', '#c4b99a', '#9e9e8e', '#d4c9a8'];
    for (let i = 0; i < 16; i++) {
        const debris = document.createElement('div');
        debris.className = 'stone-debris';
        const size = 4 + Math.random() * 14;
        const angle = (Math.PI * 2 / 16) * i + (Math.random() - 0.5) * 0.4;
        const speed = 60 + Math.random() * 80;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - 40;
        const color = colors[Math.floor(Math.random() * colors.length)];
        debris.style.cssText = `
            position: fixed;
            left: ${cx - size / 2}px;
            top: ${cy - size / 2}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: ${Math.random() > 0.4 ? '50%' : Math.random() > 0.5 ? '2px' : '0'};
            z-index: 10001;
            pointer-events: none;
            --dx: ${dx}px;
            --dy: ${dy}px;
            --rot: ${-180 + Math.random() * 360}deg;
        `;
        document.body.appendChild(debris);
        debris.addEventListener('animationend', () => debris.remove());
    }

    setTimeout(() => {
        showNotification('使用稿子击碎了碳酸钙！', 'success');

        el.innerHTML = `<img src="images/15.png" alt="${materialName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`;

        if (GameData.materials[materialName]) {
            GameData.materials[materialName].count += 1;
        } else {
            GameData.materials[materialName] = {
                count: 1,
                icon: '🪨'
            };
        }

        GameData.garden.collected += 1;
        updateGardenUI();

        if (GameData.garden.collected >= GameData.garden.required) {
            setTimeout(() => {
                showNotification('收集任务完成！返回实验室开始炼制吧！', 'success');
                setTimeout(goToLab, 2000);
            }, 500);
        }

        el.classList.remove('hit-shake');
        el.classList.add('collected');
    }, 300);
}

function spawnMaterials() {
    const collectiblesContainer = document.getElementById('collectibles');
    const region = GameData.garden.currentRegion;
    
    if (!region) return;
    
    const materialName = region.material;
    const materialIcon = region.materialIcon;
    
    // 为白岩石灰岩区调整列位置，避免草丛区域
    let columns;
    if (region.id === 'white_rock' && materialName === '碳酸钙') {
        // 白岩石灰岩区：只在右侧地面区域生成碳酸钙，避免左侧和中间的草丛
        // 分散放置，10个
        columns = [
            { x: 50, y: 75 },
            { x: 65, y: 88 },
            { x: 78, y: 78 },
            { x: 88, y: 85 },
            { x: 95, y: 80 },
            { x: 70, y: 70 },
            { x: 82, y: 92 },
            { x: 58, y: 82 },
            { x: 85, y: 75 },
            { x: 92, y: 90 }
        ];
    } else {
        columns = [
            { x: 10 },
            { x: 30 },
            { x: 50 },
            { x: 70 },
            { x: 85 }
        ];
    }

    columns.forEach((col, index) => {
        if (region.id === 'white_rock' && materialName === '碳酸钙') {
            // 在白岩石灰岩区使用更自然的样式
            const el = document.createElement('div');
            el.className = 'collectible collectible-stone';
            // 随机大小：50-70px
            const size = 50 + Math.random() * 20;
            // 随机旋转角度：-15到15度
            const rotation = (Math.random() - 0.5) * 30;
            // 小幅随机偏移，避免过于整齐
            const randomX = (Math.random() - 0.5) * 6;
            const randomY = (Math.random() - 0.5) * 4;
            // 随机透明度：0.8-1.0
            const opacity = 0.8 + Math.random() * 0.2;

            // 使用预定义的X和Y坐标，加上小幅随机偏移
            const finalX = col.x + randomX;
            const finalY = col.y + randomY;
            // 添加阴影效果，让碳酸钙看起来更自然地放置在地面上
            const shadowBlur = 10 + Math.random() * 10;
            const shadowOffsetX = -5 + Math.random() * 10;
            const shadowOffsetY = 5 + Math.random() * 5;
            el.style.cssText = `left: ${finalX}%; top: ${finalY}%; width: ${size}px; height: ${size}px; transform: rotate(${rotation}deg); opacity: ${opacity}; transition: all 0.3s ease; box-shadow: ${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, 0.3);`;
            el.innerHTML = `<img src="images/15.png" alt="${materialName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`;
            el.dataset.material = materialName;
            el.dataset.description = materialName;
            el.title = `需要用稿子击碎 ${materialName}`;

            collectiblesContainer.appendChild(el);
            GameData.garden.items.push(el);
        } else {
            // 根据区域类型设置不同的Y坐标基准
            let baseY;
            if (region.id === 'white_rock' && materialName === '碳酸钙') {
                baseY = 80 + Math.random() * 10;
            } else {
                baseY = 50 + Math.random() * 15;
            }
            for (let i = 0; i < 3; i++) {
                // 其他区域保持原有样式
                const el = document.createElement('div');
                el.className = 'collectible collectible-stone';
                el.style.cssText = `left: ${col.x}%; top: ${baseY + yOffset + i * 8}%; font-size: 35px; cursor: pointer;`;
                el.textContent = materialIcon;
                el.dataset.material = materialName;
                el.dataset.description = materialName;
                el.title = `${materialName}`;
                el.onclick = () => collectMaterial(el);
                collectiblesContainer.appendChild(el);
                GameData.garden.items.push(el);
            }
        }
    });
}

function refreshGarden() {
    GameData.garden.items.forEach(el => {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
    GameData.garden.items = [];
    GameData.garden.collected = 0;
    updateGardenUI();
    spawnMaterials();
    showNotification('🌿 后花园已刷新！发现了新的矿物', 'info');
}

function collectMaterial(element) {
    if (element.classList.contains('collected')) return;

    const materialName = element.dataset.material || '未知材料';
    const region = GameData.garden.currentRegion;
    
    element.classList.add('collected');
    element.style.opacity = '0.5';
    
    if (!GameData.materials[materialName]) {
        GameData.materials[materialName] = { 
            category: 'basic', 
            count: 0, 
            icon: region ? region.materialIcon : '🪨' 
        };
    }
    GameData.materials[materialName].count++;

    if (region && materialName === region.material) {
        GameData.garden.collected++;
        updateGardenUI();
    }
    
    showNotification(`获得 ${materialName} ×1`, 'success');

    if (GameData.garden.collected >= GameData.garden.required) {
        setTimeout(() => {
            showNotification('收集任务完成！返回实验室开始炼制吧！', 'success');
            setTimeout(goToLab, 2000);
        }, 500);
    }
}

function updateGardenUI() {
    document.getElementById('collected-count').textContent = GameData.garden.collected;
    document.getElementById('required-count').textContent = GameData.garden.required;
}

function init() {
    initVideoIntro();
    renderMaterials();
    renderRecipes('basic');
    renderCustomers();
    updatePlayerStats();
    initDragAndDrop();
    updateCustomerBadge();
    generateCustomerWithRandomInterval();
    setInterval(updateCustomerTimers, 1000);
}

function playVideo() {
    const video = document.getElementById('intro-video');
    
    if (video) {
        // 确保视频元素在尝试播放前已加载
        if (video.readyState >= 2) {
            // 视频已加载，直接播放
            video.play().then(function() {
                console.log('视频开始播放');
            }).catch(function(error) {
                console.error('播放失败:', error);
                // 播放失败时使用安全函数进入游戏
                const videoIntro = document.getElementById('video-intro');
                const levelIntro = document.getElementById('level-intro');
                const bgm = document.getElementById('bgm');
                safeShowLevelIntro(videoIntro, levelIntro, bgm);
            });
        } else {
            // 视频尚未加载，等待加载完成后再播放
            video.addEventListener('loadeddata', function playWhenLoaded() {
                video.play().then(function() {
                    console.log('视频开始播放');
                }).catch(function(error) {
                    console.error('播放失败:', error);
                    // 播放失败时使用安全函数进入游戏
                    const videoIntro = document.getElementById('video-intro');
                    const levelIntro = document.getElementById('level-intro');
                    const bgm = document.getElementById('bgm');
                    safeShowLevelIntro(videoIntro, levelIntro, bgm);
                });
                // 移除事件监听器，避免重复触发
                video.removeEventListener('loadeddata', playWhenLoaded);
            });
        }
    }
}

function skipVideo() {
    const videoIntro = document.getElementById('video-intro');
    const levelIntro = document.getElementById('level-intro');
    const bgm = document.getElementById('bgm');
    
    // 设置状态锁，防止后续事件重复跳转
    hasTransitionedToLevel = true;
    
    // 清除视频超时定时器
    if (window._videoTimeoutId) {
        clearTimeout(window._videoTimeoutId);
        window._videoTimeoutId = null;
    }
    
    if (videoIntro) {
        videoIntro.classList.add('hidden');
    }
    if (levelIntro) {
        levelIntro.classList.remove('hidden');
    }
    if (bgm) {
        bgm.play();
    }
}

// 统一的视频结束跳转函数
function transitionToLevelIntro(video, videoIntro, levelIntro, bgm) {
    // 检查是否已经跳转过，防止重复跳转导致游戏过程中被拉回第一关页面
    if (hasTransitionedToLevel) {
        console.log('⚠️ 已经跳转到过第一关页面，忽略重复跳转请求');
        return;
    }

    // 设置状态锁，标记已经跳转过
    hasTransitionedToLevel = true;
    console.log('🎬 正在跳转到第一关页面...');

    // 清除5秒超时定时器，防止游戏过程中被跳回第一关页面
    if (window._videoTimeoutId) {
        clearTimeout(window._videoTimeoutId);
        window._videoTimeoutId = null;
        console.log('✅ 已清除视频超时定时器');
    }

    // 隐藏视频介绍
    if (videoIntro) {
        videoIntro.classList.add('hidden');
    }

    // 显示第一关介绍
    if (levelIntro) {
        levelIntro.classList.remove('hidden');
    }

    // 播放背景音乐
    if (bgm) {
        bgm.play().catch(function(err) {
            console.warn('背景音乐播放失败:', err);
        });
    }

    // 确保视频不会重新播放
    if (video) {
        video.pause();
        video.currentTime = 0;
        video.loop = false;

        // 移除视频元素，彻底防止重复播放
        const oldVideo = video;
        setTimeout(function() {
            if (oldVideo && oldVideo.parentNode) {
                oldVideo.parentNode.removeChild(oldVideo);
                console.log('✅ 视频元素已移除，跳转完成');
            }
        }, 100);
    }
}

// 安全显示第一关页面的统一函数（所有跳转都必须通过此函数）
function safeShowLevelIntro(videoIntro, levelIntro, bgm) {
    if (hasTransitionedToLevel) {
        console.log('⚠️ safeShowLevelIntro: 已经跳转过，忽略请求');
        return;
    }

    hasTransitionedToLevel = true;
    console.log('🔒 safeShowLevelIntro: 安全显示第一关页面');

    if (videoIntro) {
        videoIntro.classList.add('hidden');
    }
    if (levelIntro) {
        levelIntro.classList.remove('hidden');
    }
    if (bgm) {
        bgm.play().catch(function(err) {
            console.warn('背景音乐播放失败:', err);
        });
    }
}

function initVideoIntro() {
    const video = document.getElementById('intro-video');
    const videoIntro = document.getElementById('video-intro');
    const levelIntro = document.getElementById('level-intro');
    const bgm = document.getElementById('bgm');
    
    // 存储超时定时器引用，以便后续清除
    let videoTimeoutId = null;
    
    console.log('初始化视频 intro...');
    console.log('视频元素:', video);
    console.log('视频intro元素:', videoIntro);
    console.log('level-intro元素:', levelIntro);
    
    // 直接显示跳过按钮
    const skipButton = document.querySelector('.video-skip-button');
    if (skipButton) {
        skipButton.style.display = 'block';
    }
    
    if (video && videoIntro) {
        // 确保视频不循环
        video.loop = false;
        
        // 视频播放结束事件
        video.addEventListener('ended', function() {
            console.log('✅ 视频播放结束事件触发');
            transitionToLevelIntro(video, videoIntro, levelIntro, bgm);
        });
        
        // 备用方案：通过 timeupdate 检测视频是否接近结尾（防止 ended 事件未触发）
        let endCheckTriggered = false;
        video.addEventListener('timeupdate', function() {
            if (!endCheckTriggered && video.duration > 0 && video.duration - video.currentTime < 0.5) {
                endCheckTriggered = true;
                console.log('⏱️ 视频即将播放完毕（备用检测）');
                // 延迟一点确保 ended 事件有机会先触发
                setTimeout(function() {
                    if (videoIntro && !videoIntro.classList.contains('hidden')) {
                        console.log('⚡ 使用备用方案跳转到第一关');
                        transitionToLevelIntro(video, videoIntro, levelIntro, bgm);
                    }
                }, 1000);
            }
        });
        
        // 视频错误事件
        video.addEventListener('error', function(e) {
            console.error('视频加载错误:', e);
            console.error('错误代码:', e.target.error.code);
            // 视频加载错误时使用安全函数进入游戏
            safeShowLevelIntro(videoIntro, levelIntro, bgm);
        });
        
        // 添加用户交互检测，解决自动播放限制
        function handleUserInteraction() {
            console.log('用户交互检测到，尝试播放视频');
            playVideo();
            // 移除事件监听器，避免重复触发
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        }
        
        // 添加多种用户交互事件监听器
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        
        // 注：已移除5秒超时机制，避免在用户未操作时强制跳转到第一关页面
        // 视频播放完毕后会通过 ended 事件正常跳转，或用户可点击"跳过视频"按钮
    } else {
        console.error('视频元素或视频intro元素不存在');
        // 如果视频元素不存在，使用安全函数进入游戏
        safeShowLevelIntro(videoIntro, levelIntro, bgm);
    }
}

function generateCustomerWithRandomInterval() {
    generateCustomer();
    // 0-90秒的随机间隔
    const randomInterval = Math.random() * 90000;
    setTimeout(generateCustomerWithRandomInterval, randomInterval);
}

// 初始化材料拖拽 
 function initDragAndDrop() { 
     // 材料项拖拽 
     document.querySelectorAll('.material-item').forEach(item => { 
         item 
 .setAttribute('draggable', 'true'); 
         
         item 
 .ondragstart = function(e) { 
             draggedMaterial 
 = this.dataset.material; 
             dragElement 
 = this; 
             this.classList.add('dragging'); 
             e 
 .dataTransfer.setData('text/plain', draggedMaterial); 
         }; 
         
         item 
 .ondragend = function() { 
             this.classList.remove('dragging'); 
             draggedMaterial 
 = null; 
             dragElement 
 = null; 
         }; 
     }); 
     
     // 烧瓶拖拽目标 
     const reactionVessel = document.getElementById('reaction-vessel'); 
     reactionVessel 
 .ondragover = function(e) { 
         e 
 .preventDefault(); 
         this.classList.add('drag-over'); 
     }; 
     
     reactionVessel 
 .ondragleave = function() { 
         this.classList.remove('drag-over'); 
     }; 
     
     reactionVessel 
 .ondrop = function(e) { 
         e 
 .preventDefault(); 
         this.classList.remove('drag-over'); 
         
         if (!draggedMaterial || GameData.materials[draggedMaterial].count <= 0) return; 
         
         // 消耗材料 
         GameData.materials[draggedMaterial].count--; 
         // 添加到已选试剂 
         addReagent(draggedMaterial); 
         // 更新UI 
         updateMaterialList(); 
         updateReactionLiquid(); 
     }; 

    const matchBox = document.getElementById('match-box');
    const alcoholLamp = document.getElementById('alcohol-lamp');
    
    matchBox.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('type', 'match');
        matchBox.classList.add('dragging');
    });
    
    matchBox.addEventListener('dragend', function() {
        matchBox.classList.remove('dragging');
    });
    
    alcoholLamp.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('type', 'alcohol-lamp');
        alcoholLamp.classList.add('dragging');
    });
    
    alcoholLamp.addEventListener('dragend', function() {
        alcoholLamp.classList.remove('dragging');
    });
    
    // 烧瓶作为酒精灯的放置目标
    reactionVessel.addEventListener('dragover', function(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type === 'alcohol-lamp') {
            reactionVessel.classList.add('drag-over');
        }
    });
    
    reactionVessel.addEventListener('dragleave', function(e) {
        reactionVessel.classList.remove('drag-over');
    });
    
    reactionVessel.addEventListener('drop', function(e) {
        e.preventDefault();
        reactionVessel.classList.remove('drag-over');
        const type = e.dataTransfer.getData('type');
        if (type === 'alcohol-lamp') {
            const alcoholLampEl = document.getElementById('alcohol-lamp');
            const lampArea = document.getElementById('alcohol-lamp-area');
            const reactionColumn = document.querySelector('.reaction-column');
            const addedReagents = document.getElementById('added-reagents');
            const actionButtons = document.querySelector('.action-buttons');
            
            alcoholLampEl.classList.add('inside-flask');
            reactionColumn.appendChild(alcoholLampEl);
            lampArea.classList.add('has-lamp-inside');
            if (addedReagents) {
                addedReagents.classList.add('hidden-when-lamp-inside');
            }
            if (actionButtons) {
                actionButtons.classList.add('hidden-when-lamp-inside');
            }
            showNotification('酒精灯已放置到烧瓶下方', 'info');
            lightAlcoholLamp();
            if (isLampLit) {
                startHourglass();
            }
        }
    });
    
    // 酒精灯区域也可以作为放置目标（用于将酒精灯拖回原位）
    const lampArea = document.getElementById('alcohol-lamp-area');
    lampArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type === 'alcohol-lamp') {
            lampArea.classList.add('drop-target');
        }
    });
    
    lampArea.addEventListener('dragleave', function(e) {
        if (!lampArea.contains(e.relatedTarget)) {
            lampArea.classList.remove('drop-target');
        }
    });
    
    lampArea.addEventListener('drop', function(e) {
        e.preventDefault();
        lampArea.classList.remove('drop-target');
        const type = e.dataTransfer.getData('type');
        if (type === 'alcohol-lamp') {
            const alcoholLampEl = document.getElementById('alcohol-lamp');
            const matchBox = document.getElementById('match-box');
            alcoholLampEl.classList.remove('inside-flask');
            // 使用 insertBefore 确保酒精灯在火柴前面（保持原有顺序）
            if (matchBox && matchBox.parentNode === lampArea) {
                lampArea.insertBefore(alcoholLampEl, matchBox);
            } else {
                lampArea.appendChild(alcoholLampEl);
            }
            lampArea.classList.remove('has-lamp-inside');
        }
    });
    
    // 使用整个酒精灯区域作为 drop target，而不是只使用隐藏的 lamp-wick
    alcoholLamp.addEventListener('dragover', function(e) {
        e.preventDefault();
        alcoholLamp.classList.add('drop-target');
    });
    
    alcoholLamp.addEventListener('dragleave', function(e) {
        if (!alcoholLamp.contains(e.relatedTarget)) {
            alcoholLamp.classList.remove('drop-target');
        }
    });
    
    alcoholLamp.addEventListener('drop', function(e) {
        e.preventDefault();
        alcoholLamp.classList.remove('drop-target');
        const type = e.dataTransfer.getData('type');
        if (type === 'match') {
            lightAlcoholLamp();
        }
    });

    document.addEventListener('dragend', function() {
        // 延迟处理，确保所有其他dragend事件处理完成
        setTimeout(() => {
            if (dragElement) {
                dragElement.remove();
                dragElement = null;
            }
            draggedMaterial = null;
            document.querySelectorAll('.material-item').forEach(function(el) {
                el.classList.remove('dragging');
            });
            const vessel = document.getElementById('reaction-vessel');
            if (vessel) {
                vessel.classList.remove('drag-over');
            }
        }, 0);
    });
 } 
 
 // 添加试剂到炼制台 
 function addReagent(materialName) { 
     if (addedReagents.includes(materialName)) return; 
     addedReagents 
 .push(materialName); 
     
     const addedReagentsEl = document.getElementById('added-reagents'); 
     const reagentTag = document.createElement('div'); 
     reagentTag 
 .className = 'reagent-tag'; 
     reagentTag 
 .innerHTML = ` 
         ${GameData.materials[materialName].icon} ${materialName} 
         <span class="reagent-remove" onclick="removeReagent('${materialName}')">×</span> 
     `; 
     addedReagentsEl 
 .appendChild(reagentTag); 
     
     // 匹配配方 
     matchRecipe(); 
 } 
 
 // 更新烧瓶液体高度 
 function updateReactionLiquid() { 
     const liquid = document.getElementById('reaction-liquid'); 
     const height = Math.min(addedReagents.length * 20, 80); // 最多80%高度 
     liquid 
 .style.height = `${height}%`; 
     liquid 
 .classList.add('active'); 
 } 
 
 // 更新材料列表 
 function updateMaterialList() { 
     renderMaterials(); 
 } 
 
 // 匹配配方 
 function matchRecipe() { 
     // 对试剂数组进行排序，确保顺序一致 
     const sortedReagents = [...addedReagents].sort(); 
     
     // 查找匹配的配方 
     for (const recipe of GameData.recipes) { 
         if (!recipe.unlocked) continue;
         const sortedRecipeReagents = [...recipe.reagents].sort(); 
         
         // 检查试剂数量是否相同 
         if (sortedReagents.length !== sortedRecipeReagents.length) { 
             continue; 
         } 
         
         // 检查所有试剂是否匹配 
         let match = true; 
         for (let i = 0; i < sortedReagents.length; i++) { 
             if (sortedReagents[i] !== sortedRecipeReagents[i]) { 
                 match = false; 
                 break; 
             } 
         } 
         
         if (match) { 
             currentRecipe = recipe; 
             document.getElementById('current-recipe-title').textContent = 
                 `${recipe.name} - ${recipe.description}`; 
             break; 
         } 
     } 
 }

function renderMaterials() {
    const list = document.getElementById('material-list');
    list.innerHTML = '';
    
    for (const [name, data] of Object.entries(GameData.materials)) {
        if (data.count > 0) {
            const item = document.createElement('div');
            item.className = 'material-item';
            item.draggable = true;
            item.dataset.material = name;
            
            if (name === '碳酸钙') {
                item.innerHTML = `
                    <div class="material-image-container">
                        <img src="images/14.png" alt="碳酸钙" class="material-image"/>
                    </div>
                    <span class="material-count">×${data.count}</span>
                `;
            } else {
                item.innerHTML = `
                    <span class="material-name">${data.icon}</span>
                    <span class="material-count">×${data.count}</span>
                `;
            }

            item.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', name);
                e.dataTransfer.setData('material', name);
                draggedMaterial = name;
                item.classList.add('dragging');
                
                // 降低背景音乐音量
                const bgm = document.getElementById('bgm');
                if (bgm) {
                    bgm.volume = 0.3; // 降低到30%
                }
                
                dragElement = document.createElement('div');
                dragElement.className = 'dragging-material';
                dragElement.textContent = `${data.icon} ${name}`;
                document.body.appendChild(dragElement);
                
                e.dataTransfer.setDragImage(new Image(), 0, 0);
                
                const moveHandler = function(e) {
                    if (dragElement) {
                        dragElement.style.left = e.clientX + 'px';
                        dragElement.style.top = e.clientY + 'px';
                    }
                };
                
                // 使用捕获阶段的事件监听器，确保先于其他监听器执行
                document.addEventListener('drag', moveHandler, true);
                
                const dragendHandler = function() {
                    // 移除事件监听器
                    document.removeEventListener('drag', moveHandler, true);
                    // 延迟移除dragElement，确保所有事件处理完成
                    setTimeout(function() {
                        if (dragElement) {
                            dragElement.remove();
                            dragElement = null;
                        }
                        // 恢复背景音乐音量
                        const bgm = document.getElementById('bgm');
                        if (bgm) {
                            bgm.volume = 1.0; // 恢复到100%
                        }
                    }, 0);
                };
                
                item.addEventListener('dragend', dragendHandler, { once: true });
            });

            item.addEventListener('click', function() {
                if (currentRecipe) {
                    addReagentByClick(name);
                } else {
                    showNotification('请先选择一个配方', 'warning');
                }
            });

            list.appendChild(item);
        }
    }

    if (list.children.length === 0) {
        list.innerHTML = '<div class="empty-message">仓库为空，请前往后花园采集材料</div>';
    }
}

function addReagentByDrag(materialName) {
    if (!currentRecipe) {
        showNotification('请先选择一个配方', 'warning');
        return;
    }
    if (isCrafting) return;

    const neededReagents = currentRecipe.reagents.filter(r => !addedReagents.includes(r));
    
    if (!neededReagents.includes(materialName)) {
        if (addedReagents.includes(materialName)) {
            showNotification('该试剂已添加', 'warning');
        } else {
            showNotification('该配方不需要这个材料', 'error');
        }
        return;
    }

    if (GameData.materials[materialName] && GameData.materials[materialName].count > 0) {
        GameData.materials[materialName].count--;
        addedReagents.push(materialName);
        
        renderMaterials();
        updateReactionDisplay();
        showNotification(`添加 ${materialName} 到烧瓶`, 'info');
        playSoundEffect('1.mp3', 1000);
    } else {
        showNotification('材料不足', 'error');
    }
}

function addReagentByClick(materialName) {
    if (!currentRecipe || isCrafting) return;

    const neededReagents = currentRecipe.reagents.filter(r => !addedReagents.includes(r));
    
    if (!neededReagents.includes(materialName)) {
        if (addedReagents.includes(materialName)) {
            showNotification('该试剂已添加', 'warning');
        } else {
            showNotification('该配方不需要这个材料', 'error');
        }
        return;
    }

    if (GameData.materials[materialName] && GameData.materials[materialName].count > 0) {
        GameData.materials[materialName].count--;
        addedReagents.push(materialName);
        
        renderMaterials();
        updateReactionDisplay();
        showNotification(`添加 ${materialName} 到烧瓶`, 'info');
        playSoundEffect('1.mp3', 1000);
    } else {
        showNotification('材料不足', 'error');
    }
}

function renderRecipes(category) {
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';

    const recipes = GameData.recipes.filter(r => r.category === category);
    
    // 如果有选中的配方，只显示选中的配方
    if (currentRecipe && currentRecipe.category === category) {
        const recipe = currentRecipe;
        const item = document.createElement('div');
        item.className = 'recipe-item selected';
        item.onclick = () => {
            // 点击已选中的配方，取消选择，显示所有配方
            currentRecipe = null;
            renderRecipes(category);
            document.getElementById('current-recipe-title').textContent = '选择配方开始炼制';
            // 清空图片区域，隐藏空框
            const imageFull = document.getElementById('recipe-image-full');
            imageFull.innerHTML = '';
            imageFull.style.display = 'none';
        };

        item.innerHTML = `
            <div>
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-formula">${recipe.formula}</div>
            </div>
        `;

        list.appendChild(item);

        if (recipe.image) {
            const img = document.createElement('img');
            img.src = recipe.image;
            img.alt = recipe.name;
            img.className = 'recipe-item-image';
            list.appendChild(img);
        }
    } else {
        recipes.forEach(recipe => {
            const item = document.createElement('div');
            item.className = 'recipe-item' + (recipe.unlocked ? '' : ' recipe-locked');

            if (recipe.unlocked) {
                item.onclick = () => selectRecipe(recipe);
                item.innerHTML = `
                    <div>
                        <div class="recipe-name">${recipe.name}</div>
                        <div class="recipe-formula">${recipe.formula}</div>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <div>
                        <div class="recipe-name">🔒 ${recipe.name}</div>
                        <div class="recipe-formula">在商城购买图纸解锁</div>
                    </div>
                `;
            }

            list.appendChild(item);
        });
    }
}

function showRecipeCategory(category) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 如果当前选中的配方不属于新分类，清空图片
    if (!currentRecipe || currentRecipe.category !== category) {
        const imageFull = document.getElementById('recipe-image-full');
        imageFull.innerHTML = '';
        imageFull.style.display = 'none';
    }
    
    renderRecipes(category);
}

function selectRecipe(recipe) {
    if (!recipe.unlocked) {
        showNotification('该配方尚未解锁，请在商城购买图纸', 'warning');
        return;
    }
    currentRecipe = recipe;
    addedReagents = [];
    isHeating = false;
    updateReactionDisplay();
    
    // 先设置图片，再渲染配方列表（确保图片不被清空）
    const imageFull = document.getElementById('recipe-image-full');
    if (recipe.image) {
        imageFull.innerHTML = `<img src="${recipe.image}" alt="${recipe.name}">`;
        imageFull.style.display = 'flex';
    } else {
        imageFull.innerHTML = '';
        imageFull.style.display = 'none';
    }
    
    renderRecipes(recipe.category);
    
    document.getElementById('current-recipe-title').textContent = 
        `${recipe.name} - ${recipe.description}`;
}

function updateReactionDisplay() {
    const vessel = document.getElementById('reaction-liquid');
    const reagentsContainer = document.getElementById('added-reagents');
    
    const progress = currentRecipe ? 
        (addedReagents.length / currentRecipe.reagents.length) * 80 : 0;
    vessel.style.height = `${progress}%`;

    reagentsContainer.innerHTML = addedReagents.map((reagent, index) => `
        <div class="reagent-tag" onclick="removeReagent(${index})" style="cursor: pointer;" title="点击移除">
            <span>${GameData.materials[reagent]?.icon || '🧪'} ${reagent}</span>
            <span style="margin-left: 5px;">×</span>
        </div>
    `).join('');
}

function removeReagent(reagent) {
    let index;
    if (typeof reagent === 'string') {
        // 通过材料名称移除
        index = addedReagents.indexOf(reagent);
    } else {
        // 通过索引移除
        index = reagent;
    }
    
    if (index !== -1) {
        const reagentName = addedReagents[index];
        if (GameData.materials[reagentName]) {
            GameData.materials[reagentName].count++;
        }
        addedReagents.splice(index, 1);
        renderMaterials();
        updateReactionDisplay();
    }
}

function toggleHeat() {
    if (!currentRecipe || addedReagents.length === 0 || isCrafting) return;
    
    isHeating = !isHeating;
    document.getElementById('reaction-flame').classList.toggle('active', isHeating);
    document.getElementById('reaction-liquid').classList.toggle('active', isHeating && addedReagents.length > 0);
}

function startCrafting() {
    if (!currentRecipe || isCrafting) return;
    
    if (!isLampLit) {
        showNotification('请先点燃酒精灯', 'warning');
        return;
    }

    if (addedReagents.length < currentRecipe.reagents.length) {
        showNotification('请添加所有需要的试剂', 'error');
        return;
    }


}

function isRecipeComplete() {
    if (!currentRecipe) return false;
    const reagentCounts = {};
    addedReagents.forEach(r => {
        reagentCounts[r] = (reagentCounts[r] || 0) + 1;
    });
    return currentRecipe.reagents.every(r => reagentCounts[r] >= 1);
}

// 根据添加的材料查找匹配的配方
function findMatchingRecipe(reagents) {
    // 对试剂数组进行排序，确保顺序一致
    const sortedReagents = [...reagents].sort();
    
    // 查找匹配的配方
    for (const recipe of GameData.recipes) {
        if (!recipe.unlocked) continue;
        const sortedRecipeReagents = [...recipe.reagents].sort();
        
        if (sortedReagents.length !== sortedRecipeReagents.length) {
            continue;
        }
        
        let match = true;
        for (let i = 0; i < sortedReagents.length; i++) {
            if (sortedReagents[i] !== sortedRecipeReagents[i]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            return recipe;
        }
    }
    
    return null;
}

function completeCrafting(quality) {
    quality = quality || 'perfect';
    const success = quality === 'perfect';
    
    let recipe = currentRecipe;
    
    // 如果没有选择配方，尝试根据添加的材料查找匹配的配方
    if (!recipe) {
        recipe = findMatchingRecipe(addedReagents);
    }
    
    if (recipe) {
        // 有配方的情况（无论是选择的还是自动匹配的）
        if (success) {
            const product = recipe.product;
            if (!GameData.materials[product]) {
                GameData.materials[product] = { category: 'product', count: 0, icon: '✨' };
            }
            GameData.materials[product].count++;
            
            const expMultiplier = quality === 'perfect' ? 1.5 : 1;
            GameData.player.experience += Math.floor(recipe.experience * expMultiplier);
            GameData.player.gold += recipe.gold;
            checkLevelUp();
            
            showResultModal(true, recipe, quality);
        } else {
            const wasteCount = Math.floor(Math.random() * 2) + 1;
            if (!GameData.materials['副产物_氯化钠']) {
                GameData.materials['副产物_氯化钠'] = { category: 'waste', count: 0, icon: '🧂' };
            }
            GameData.materials['副产物_氯化钠'].count += wasteCount;
            
            showResultModal(false, recipe, quality);
        }
    } else {
        // 没有找到匹配的配方
        const wasteCount = Math.floor(Math.random() * 2) + 1;
        if (!GameData.materials['副产物_氯化钠']) {
            GameData.materials['副产物_氯化钠'] = { category: 'waste', count: 0, icon: '🧂' };
        }
        GameData.materials['副产物_氯化钠'].count += wasteCount;
        
        // 给予少量经验值
        GameData.player.experience += 5;
        checkLevelUp();
        
        // 显示通用结果模态框
        showResultModal(false, { name: '未知产物', experience: 5, gold: 0 }, quality);
    }

    addedReagents = [];
    currentRecipe = null;
    isHeating = false;
    isLampLit = false;
    isHourglassRunning = false;
    reactionQuality = null;
    if (flameSound) {
        flameSound.pause();
        flameSound = null;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.volume = 1.0;
        }
    }
    if (hourglassTimer) {
        clearTimeout(hourglassTimer);
        hourglassTimer = null;
    }
    const alcoholLampImg = document.querySelector('.alcohol-lamp img');
    if (alcoholLampImg) {
        alcoholLampImg.src = 'images/19.png';
    }
    document.getElementById('reaction-flame').classList.remove('active');
    document.getElementById('reaction-liquid').classList.remove('active');
    document.getElementById('lamp-flame').classList.remove('lit');
    document.getElementById('hourglass').classList.remove('running', 'perfect', 'too-early', 'too-late');
    document.getElementById('hourglass-status').textContent = '准备就绪';
    const instructionDrag = document.querySelector('.instruction-drag');
    if (instructionDrag) {
        instructionDrag.style.display = 'flex';
    }

    const alcoholLampEl = document.getElementById('alcohol-lamp');
    const lampArea = document.getElementById('alcohol-lamp-area');
    const matchBox = document.getElementById('match-box');
    const addedReagentsEl = document.getElementById('added-reagents');
    const actionButtons = document.querySelector('.action-buttons');
    if (alcoholLampEl && lampArea) {
        alcoholLampEl.classList.remove('inside-flask');
        if (matchBox && matchBox.parentNode === lampArea) {
            lampArea.insertBefore(alcoholLampEl, matchBox);
        } else {
            lampArea.appendChild(alcoholLampEl);
        }
        lampArea.classList.remove('has-lamp-inside');
        if (addedReagentsEl) {
            addedReagentsEl.classList.remove('hidden-when-lamp-inside');
        }
        if (actionButtons) {
            actionButtons.classList.remove('hidden-when-lamp-inside');
        }
    }

    renderMaterials();
    updateReactionDisplay();
    updatePlayerStats();
}

function showResultModal(success, recipe, quality) {
    quality = quality || 'perfect';
    const modal = document.getElementById('result-modal');
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const details = document.getElementById('result-details');

    let expGained = quality === 'perfect' ? Math.floor(recipe.experience * 1.5) : recipe.experience;
    
    if (success) {
        const qualityText = quality === 'perfect' ? '完美' : '普通';
        icon.textContent = quality === 'perfect' ? '✨' : '✅';
        title.textContent = quality === 'perfect' ? '完美炼制！' : '炼制成功';
        title.style.color = quality === 'perfect' ? '#f39c12' : '#27ae60';
        details.innerHTML = `
            <p>品质: ${qualityText}</p>
            <p>获得: ${recipe.name}</p>
            <p>经验 +${expGained}</p>
            <p>金币 +${recipe.gold}</p>
        `;
    } else {
        const failReason = quality === 'too-early' ? '反应不足' : '反应过度';
        icon.textContent = '❌';
        title.textContent = '炼制失败';
        title.style.color = '#e74c3c';
        details.innerHTML = `
            <p>原因: ${failReason}</p>
            <p>产生了副产物</p>
            <p>返还少量经验</p>
        `;
        GameData.player.experience += Math.floor(recipe.experience * 0.2);
    }

    modal.classList.add('active');
}

function closeResultModal() {
    document.getElementById('result-modal').classList.remove('active');
}

function clearReaction() {
    addedReagents.forEach(reagent => {
        if (GameData.materials[reagent]) {
            GameData.materials[reagent].count++;
        }
    });
    addedReagents = [];
    isHeating = false;
    isLampLit = false;
    isHourglassRunning = false;
    reactionQuality = null;
    if (flameSound) {
        flameSound.pause();
        flameSound = null;
        const bgm = document.getElementById('bgm');
        if (bgm) {
            bgm.volume = 1.0;
        }
    }
    if (hourglassTimer) {
        clearTimeout(hourglassTimer);
        hourglassTimer = null;
    }
    // 更换酒精灯图片为未点燃状态
    const alcoholLampImg = document.querySelector('.alcohol-lamp img');
    if (alcoholLampImg) {
        alcoholLampImg.src = 'images/19.png';
    }
    document.getElementById('reaction-flame').classList.remove('active');
    document.getElementById('reaction-liquid').classList.remove('active');
    document.getElementById('lamp-flame').classList.remove('lit');
    document.getElementById('hourglass').classList.remove('running', 'perfect', 'too-early', 'too-late');
    document.getElementById('hourglass-status').textContent = '准备就绪';
    const instructionDrag = document.querySelector('.instruction-drag');
    if (instructionDrag) {
        instructionDrag.style.display = 'flex';
    }

    renderMaterials();
    updateReactionDisplay();
    showNotification('炼制已清空，材料已返还', 'info');
}

function lightAlcoholLamp() {
    // 隐藏所有高亮区域
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    document.getElementById('reaction-vessel').classList.remove('drag-over');
    
    if (addedReagents.length === 0) {
        showNotification('请先添加材料到烧瓶', 'warning');
        return;
    }
    
    // 尝试自动匹配配方
    if (!currentRecipe) {
        matchRecipe();
        if (!currentRecipe) {
            showNotification('无法匹配到合适的配方', 'warning');
            return;
        }
    }
    
    if (!isRecipeComplete()) {
        showNotification('材料数量不足，无法点燃', 'warning');
        return;
    }
    
    isLampLit = true;
    const alcoholLampImg = document.querySelector('.alcohol-lamp img');
    if (alcoholLampImg) {
        alcoholLampImg.src = 'images/20.png';
    }
    document.getElementById('lamp-flame').classList.add('lit');
    document.getElementById('reaction-flame').classList.add('active');
    document.getElementById('reaction-liquid').classList.add('active');
    if (flameSound) {
        flameSound.pause();
        flameSound = null;
    }
    const bgm = document.getElementById('bgm');
    if (bgm) {
        bgm.volume = 0.2;
    }
    flameSound = new Audio('images/火焰燃烧的声音(1).m4a');
    flameSound.volume = 0.8;
    flameSound.loop = true;
    flameSound.play().catch(function(error) {
        console.error('火焰音效播放失败:', error);
    });
    const instructionDrag = document.querySelector('.instruction-drag');
    if (instructionDrag) {
        instructionDrag.style.display = 'none';
    }
    showNotification('🔥 酒精灯已点燃！可以开始反应了', 'success');
}

function toggleHourglass() {
    if (!isLampLit) {
        showNotification('请先点燃酒精灯', 'warning');
        return;
    }
    if (addedReagents.length === 0) {
        showNotification('请先添加材料', 'warning');
        return;
    }
    
    if (isHourglassRunning) {
        stopHourglass();
    } else {
        startHourglass();
    }
}

function startHourglass() {
    isHourglassRunning = true;
    hourglassStartTime = Date.now();
    
    const hourglass = document.getElementById('hourglass');
    hourglass.classList.add('running');
    document.getElementById('hourglass-status').textContent = '沙子流逝中...';
}

function stopHourglass() {
    if (!isHourglassRunning) return;
    
    isHourglassRunning = false;
    const elapsedTime = Date.now() - hourglassStartTime;
    
    const hourglass = document.getElementById('hourglass');
    hourglass.classList.remove('running');
    
    if (hourglassTimer) {
        clearTimeout(hourglassTimer);
        hourglassTimer = null;
    }
    
    const perfectTime = hourglassDuration * 0.6;
    const earlyThreshold = hourglassDuration * 0.4;
    const lateThreshold = hourglassDuration * 0.85;
    
    if (elapsedTime < earlyThreshold) {
        reactionQuality = 'failed';
        hourglass.classList.add('too-early');
        document.getElementById('hourglass-status').textContent = '反应不足！';
        showNotification('❌ 反应不足，产物品质较差', 'error');
    } else if (elapsedTime >= earlyThreshold && elapsedTime <= lateThreshold) {
        reactionQuality = 'perfect';
        hourglass.classList.add('perfect');
        document.getElementById('hourglass-status').textContent = '完美！';
        showNotification('✨ 完美反应！开始炼制...', 'success');
        setTimeout(() => completeCrafting('perfect'), 1000);
        return;
    } else {
        reactionQuality = 'failed';
        hourglass.classList.add('too-late');
        document.getElementById('hourglass-status').textContent = '反应过度！';
        showNotification('❌ 反应过度，产物品质较差', 'error');
    }
    
    // hourglass-btn 已被移除，不再需要更新按钮文字
    setTimeout(() => completeCrafting(reactionQuality), 1500);
}

function checkLevelUp() {
    const thresholds = GameData.levelThresholds;
    let newLevel = 1;
    
    for (const t of thresholds) {
        if (GameData.player.experience >= t.threshold) {
            newLevel = t.level;
        }
    }

    if (newLevel > GameData.player.level) {
        const oldLevel = GameData.player.level;
        GameData.player.level = newLevel;
        GameData.player.levelName = thresholds[newLevel - 1].name;
        
        showNotification(`恭喜升级到 ${GameData.player.levelName}！`, 'success');
        showLevelUpAnimation();
    }
}

function showLevelUpAnimation() {
    const anim = document.createElement('div');
    anim.className = 'level-up-animation';
    anim.textContent = `⬆️ 升级!`;
    document.body.appendChild(anim);
    setTimeout(() => anim.remove(), 2000);
}

function generateCustomer() {
    if (GameData.customers.length >= 5) return;

    const types = ['normal', 'advanced', 'special'];
    const weights = [0.6, 0.3, 0.1];
    const rand = Math.random();
    let type;
    
    if (rand < weights[0]) type = 'normal';
    else if (rand < weights[0] + weights[1]) type = 'advanced';
    else type = 'special';

    const products = Object.keys(GameData.materials).filter(k => 
        k.startsWith('产物_') && GameData.materials[k].count > 0
    );

    if (products.length === 0) return;

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const productName = randomProduct.replace('产物_', '');
    const demandCount = type === 'normal' ? 1 : type === 'advanced' ? 2 : 3;
    
    const names = {
        normal: ['冒险者', '农夫', '商人', '学生', '旅行者'],
        advanced: ['学者', '医师', '工坊主', '炼金同好'],
        special: ['贵族', '皇家顾问', '神秘法师']
    };

    const rewards = {
        normal: { gold: 20, exp: 15 },
        advanced: { gold: 50, exp: 35 },
        special: { gold: 100, exp: 70 }
    };

    const customer = {
        id: GameData.nextCustomerId++,
        name: names[type][Math.floor(Math.random() * names[type].length)],
        type: type,
        product: randomProduct,
        productName: productName,
        count: demandCount,
        rewards: rewards[type],
        timeLeft: type === 'special' ? 60 : 120,
        accepted: false
    };

    GameData.customers.push(customer);
    renderCustomers();
    updateCustomerBadge();
    showNotification(`${customer.name}来到了你的炼金店！`, 'info');
}

function renderCustomers() {
    const list = document.getElementById('customer-list');
    list.innerHTML = '';

    if (GameData.customers.length === 0) {
        list.innerHTML = '<div class="empty-message">暂无顾客光临...</div>';
        return;
    }

    GameData.customers.forEach(customer => {
        const item = document.createElement('div');
        item.className = `customer-item ${customer.type}`;
        
        const buttonText = customer.accepted ? '提交' : '完成需求';
        const buttonAction = customer.accepted ? `submitCustomer(${customer.id})` : `completeCustomer(${customer.id})`;
        
        item.innerHTML = `
            <div class="customer-header">
                <span class="customer-name">${customer.name}</span>
                <span class="customer-type ${customer.type}">${getTypeName(customer.type)}</span>
            </div>
            <div class="customer-demand">需求: ${customer.productName} × ${customer.count}</div>
            <div class="customer-reward">报酬: 🪙${customer.rewards.gold} | ⭐${customer.rewards.exp}</div>
            <div class="customer-timer">剩余时间: ${Math.floor(customer.timeLeft / 60)}:${(customer.timeLeft % 60).toString().padStart(2, '0')}</div>
            <button class="btn ${customer.accepted ? 'btn-warning' : 'btn-success'}" onclick="${buttonAction}" style="margin-top: 10px; width: 100%;">
                ${buttonText}
            </button>
        `;
        list.appendChild(item);
    });
}

function getTypeName(type) {
    const names = { normal: '普通', advanced: '进阶', special: '特殊', vip: 'VIP' };
    return names[type] || type;
}

function updateCustomerTimers() {
    GameData.customers = GameData.customers.filter(c => {
        c.timeLeft--;
        return c.timeLeft > 0;
    });
    renderCustomers();
}

function completeCustomer(customerId) {
    const customer = GameData.customers.find(c => c.id === customerId);
    if (!customer) return;

    const product = GameData.materials[customer.product];
    if (!product || product.count < customer.count) {
        showNotification('材料不足，无法完成需求', 'error');
        return;
    }

    product.count -= customer.count;
    GameData.player.gold += customer.rewards.gold;
    GameData.player.experience += customer.rewards.exp;
    
    checkLevelUp();

    GameData.customers = GameData.customers.filter(c => c.id !== customerId);
    
    renderMaterials();
    renderCustomers();
    updateCustomerBadge();
    updatePlayerStats();
    showNotification(`完成 ${customer.name} 的需求！`, 'success');
}

function updatePlayerStats() {
    document.getElementById('gold').textContent = GameData.player.gold;
    document.getElementById('experience').textContent = GameData.player.experience;
    document.getElementById('level').textContent = GameData.player.level;
    document.getElementById('level-name').textContent = `(${GameData.player.levelName})`;
}

function openShop() {
    const modal = document.getElementById('shop-modal');
    const items = document.getElementById('shop-items');
    
    let html = '<div class="shop-section-title">🧪 材料</div>';
    html += GameData.shopItems.map(item => `
        <div class="shop-item">
            <div class="shop-item-name">${item.icon} ${item.name}</div>
            <div class="shop-item-price">🪙 ${item.price}</div>
            <button class="btn btn-success" onclick="buyItem('${item.name}', ${item.price})">购买</button>
        </div>
    `).join('');

    html += '<div class="shop-section-title">📜 配方图纸</div>';
    html += GameData.recipeShopItems.map(item => {
        const recipe = GameData.recipes.find(r => r.id === item.recipeId);
        const owned = recipe && recipe.unlocked;
        const levelMet = GameData.player.level >= item.requiredLevel;
        const levelLabel = GameData.levelThresholds.find(t => t.level === item.requiredLevel);
        const levelName = levelLabel ? levelLabel.name : 'Lv.' + item.requiredLevel;
        return `
            <div class="shop-item${owned ? ' shop-item-owned' : ''}${!levelMet ? ' shop-item-locked' : ''}">
                <div class="shop-item-name">${item.icon} ${item.name}</div>
                <div class="shop-item-price">🪙 ${item.price} | 📊 需要: ${levelName}</div>
                ${owned 
                    ? '<span class="shop-item-owned-label">已拥有</span>' 
                    : !levelMet 
                        ? `<span class="shop-item-locked-label">🔒 等级不足</span>`
                        : `<button class="btn btn-success" onclick="buyRecipe('${item.recipeId}', ${item.price})">购买</button>`}
            </div>
        `;
    }).join('');
    
    items.innerHTML = html;
    modal.classList.add('active');
}

function closeShop() {
    document.getElementById('shop-modal').classList.remove('active');
}

function buyRecipe(recipeId, price) {
    const shopItem = GameData.recipeShopItems.find(i => i.recipeId === recipeId);
    if (shopItem && GameData.player.level < shopItem.requiredLevel) {
        const levelLabel = GameData.levelThresholds.find(t => t.level === shopItem.requiredLevel);
        const levelName = levelLabel ? levelLabel.name : 'Lv.' + shopItem.requiredLevel;
        showNotification(`等级不足！需要达到 ${levelName}`, 'error');
        return;
    }

    if (GameData.player.gold < price) {
        showNotification('金币不足！', 'error');
        return;
    }

    const recipe = GameData.recipes.find(r => r.id === recipeId);
    if (!recipe) {
        showNotification('配方不存在', 'error');
        return;
    }

    if (recipe.unlocked) {
        showNotification('你已经拥有这个配方了', 'warning');
        return;
    }

    GameData.player.gold -= price;
    recipe.unlocked = true;

    updatePlayerStats();
    showNotification(`🎉 解锁配方：${recipe.name}！`, 'success');
    openShop();
}

function openCustomerModal() {
    const modal = document.getElementById('customer-modal');
    const body = document.getElementById('customer-modal-body');
    
    if (GameData.customers.length === 0) {
        body.innerHTML = '<div class="recipe-no-image">暂无顾客需求</div>';
    } else {
        body.innerHTML = GameData.customers.map((customer, index) => {
            const buttonText = customer.accepted ? '提交' : '接受';
            const buttonClass = customer.accepted ? 'btn-warning' : 'btn-success';
            return `
            <div class="customer-demand-item">
                <div class="customer-demand-info">
                    <div class="customer-demand-name">${customer.name}</div>
                    <div class="customer-demand-desc">需要: ${customer.productName} × ${customer.count}</div>
                    <div class="customer-demand-reward">奖励: ${customer.rewards.gold}金币, ${customer.rewards.exp}经验</div>
                </div>
                <button class="btn ${buttonClass}" onclick="handleCustomerAction(${index})">${buttonText}</button>
            </div>
        `;
        }).join('');
    }
    
    modal.classList.add('active');
}

function handleCustomerAction(index) {
    const customer = GameData.customers[index];
    if (customer.accepted) {
        submitCustomerFromModal(customer.id);
    } else {
        customer.accepted = true;
        openCustomerModal();
        showNotification(`已接受 ${customer.name} 的需求！请炼制好产品后点击"提交"`, 'info');
    }
}

function submitCustomerFromModal(customerId) {
    const customer = GameData.customers.find(c => c.id === customerId);
    if (!customer) return;

    const product = GameData.materials[customer.product];
    if (!product || product.count < customer.count) {
        showNotification('材料不足，无法提交', 'error');
        return;
    }

    product.count -= customer.count;
    GameData.player.gold += customer.rewards.gold;
    GameData.player.experience += customer.rewards.exp;
    
    GameData.customers = GameData.customers.filter(c => c.id !== customerId);
    renderMaterials();
    renderCustomers();
    updateCustomerBadge();
    updatePlayerStats();
    closeCustomerModal();
    showNotification(`完成 ${customer.name} 的需求！`, 'success');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
}

function submitCustomer(customerId) {
    submitCustomerFromModal(customerId);
}

function updateCustomerBadge() {
    const badge = document.getElementById('customer-badge-header');
    if (!badge) return;
    const count = GameData.customers.length;
    if (count > 0) {
        badge.style.display = 'inline';
        badge.textContent = count;
    } else {
        badge.style.display = 'none';
    }
}

function buyItem(name, price) {
    if (GameData.player.gold < price) {
        showNotification('金币不足！', 'error');
        return;
    }

    GameData.player.gold -= price;
    
    if (!GameData.materials[name]) {
        GameData.materials[name] = { category: 'basic', count: 0, icon: '🧪' };
    }
    GameData.materials[name].count++;

    renderMaterials();
    updatePlayerStats();
    showNotification(`购买 ${name} 成功！`, 'success');
}

function tradeWithNPC(npcType) {
    const modal = document.getElementById('npc-modal');
    const title = document.getElementById('npc-title');
    const items = document.getElementById('npc-shop-items');

    const npcData = {
        basic: {
            title: '👤 基础材料商',
            items: [
                { name: '碳酸钙', price: 3, icon: '🪨' },
                { name: '盐酸', price: 5, icon: '🧪' },
                { name: '锌粒', price: 5, icon: '⚪' },
            ]
        },
        rare: {
            title: '👤 稀有材料商',
            items: [
                { name: '浓硫酸', price: 40, icon: '☠️' },
                { name: '高锰酸钾', price: 50, icon: '🟣' },
                { name: '氯酸钾', price: 45, icon: '⚪' },
            ]
        },
        回收商: {
            title: '♻️ 回收商',
            items: []
        }
    };

    const npc = npcData[npcType];
    title.textContent = npc.title;

    if (npcType === '回收商') {
        const wastes = Object.entries(GameData.materials)
            .filter(([k, v]) => v.category === 'waste' && v.count > 0);
        
        if (wastes.length === 0) {
            items.innerHTML = '<div class="empty-message">没有可回收的副产物</div>';
        } else {
            items.innerHTML = wastes.map(([name, data]) => `
                <div class="shop-item">
                    <div class="shop-item-name">${data.icon} ${name}</div>
                    <div class="shop-item-price">数量: ${data.count}</div>
                    <div class="shop-item-price">回收价: 🪙 ${Math.floor(data.count * 2)}</div>
                    <button class="btn btn-warning" onclick="recycleWaste('${name}')">回收</button>
                </div>
            `).join('');
        }
    } else {
        items.innerHTML = npc.items.map(item => `
            <div class="shop-item">
                <div class="shop-item-name">${item.icon} ${item.name}</div>
                <div class="shop-item-price">🪙 ${item.price}</div>
                <button class="btn btn-success" onclick="buyFromNPC('${item.name}', ${item.price})">购买</button>
            </div>
        `).join('');
    }

    modal.classList.add('active');
}

function closeNPCModal() {
    document.getElementById('npc-modal').classList.remove('active');
}

function buyFromNPC(name, price) {
    if (GameData.player.gold < price) {
        showNotification('金币不足！', 'error');
        return;
    }

    GameData.player.gold -= price;
    
    if (!GameData.materials[name]) {
        GameData.materials[name] = { category: 'basic', count: 0, icon: '🧪' };
    }
    GameData.materials[name].count++;

    renderMaterials();
    updatePlayerStats();
    showNotification(`购买 ${name} 成功！`, 'success');
}

function recycleWaste(name) {
    const waste = GameData.materials[name];
    if (!waste || waste.count === 0) return;

    const reward = Math.floor(waste.count * 2);
    GameData.player.gold += reward;
    waste.count = 0;

    renderMaterials();
    updatePlayerStats();
    showNotification(`回收成功，获得 🪙${reward}`, 'success');
    tradeWithNPC('回收商');
}

function playSoundEffect(src, duration) {
    const bgm = document.getElementById('bgm');
    if (bgm) {
        bgm.volume = 0.2;
    }
    const sound = new Audio(src);
    sound.volume = 0.8;
    sound.currentTime = 0;
    sound.play().catch(function(error) {
        console.error('音效播放失败:', error);
    });
    setTimeout(function() {
        if (bgm) {
            bgm.volume = 1.0;
        }
    }, duration || 1000);
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

if (document.readyState === 'complete') {
    init();
} else {
    window.onload = init;
}
