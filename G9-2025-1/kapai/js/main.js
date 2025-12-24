import { initKaishi } from './kaishi.js';

let PREFIXES = [];
let ROOTS = [];
let SUFFIXES = [];
let STARTER_DECK = [];
let WORDS = [];
let SPECIAL_WORDS = [];
let EVENTS = [];
let STATUS_DEFS = {};
let ENEMY_ACTIONS = { buff: [], debuff: [] };
const ENEMY_IMAGE_FILES = ['cike.png','gebulin.png','shilaimu.png'];

function findMorpheme(kind, id) {
  const source = kind === 'prefix' ? PREFIXES : kind === 'root' ? ROOTS : SUFFIXES;
  return source ? source.find(x => x.id === id) : undefined;
}


async function loadData() {
  const [lex, words, statusPkg, eventsPkg] = await Promise.all([
    fetch('data/lexicon.json').then(r => r.json()),
    fetch('data/words.json').then(r => r.json()),
    fetch('data/statuses.json').then(r => r.json()).catch(() => ({ statuses: [], enemy_actions: { buff: [], debuff: [] } })),
    fetch('data/events.json').then(r => r.json()).catch(() => ({ events: [] }))
  ]);
  PREFIXES = lex.prefixes || [];
  ROOTS = lex.roots || [];
  SUFFIXES = lex.suffixes || [];
  STARTER_DECK = lex.starterDeck || [];
  WORDS = words.words || [];
  SPECIAL_WORDS = words.specialWords || [];
  EVENTS = eventsPkg.events || [];
  STATUS_DEFS = (statusPkg.statuses || []).reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  ENEMY_ACTIONS = statusPkg.enemy_actions || { buff: [], debuff: [] };
}

// 单词尖塔 - 原型版核心逻辑

// 工具函数
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function createDamageFloat(text, x, y) {
  const el = document.createElement('div');
  const t = (text || '').toString();
  const isDef = /\+/.test(t) || /防|盾|block|defend/i.test(t);
  el.className = isDef ? 'float-def' : 'float-dmg';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  const layer = document.getElementById('effectsLayer') || document.body;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function playAhaSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch (_) {}
}

/**
 * Trigger a strong impact feedback on the battle stage.
 * Visuals: stage shake + radial flash. Used when a card hits the enemy.
 */
function impactStage() {
  const container = document.getElementById('battleArea');
  if (!container) return;
  container.classList.add('shake');
  const flash = document.createElement('div');
  flash.className = 'impact-flash';
  container.appendChild(flash);
  const edges = document.createElement('div');
  edges.className = 'red-edges';
  document.body.appendChild(edges);
  setTimeout(() => { container.classList.remove('shake'); flash.remove(); }, 620);
  setTimeout(() => { edges.remove(); }, 700);
}

// 敌人出牌简易特效：从敌人头像拖拽幽灵到目标
function animateEnemyPlay(target = 'player') {
  const srcEl = document.getElementById('enemyAvatar');
  const dstEl = target === 'player' ? document.getElementById('playerAvatar') : document.getElementById('enemyAvatar');
  const discardEl = document.getElementById('discardStack');
  if (!srcEl || !dstEl || !discardEl) return;
  const src = srcEl.getBoundingClientRect();
  const dst = dstEl.getBoundingClientRect();
  const trash = discardEl.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'deal-ghost';
  ghost.style.setProperty('--ghost-dur', '500ms');
  document.body.appendChild(ghost);
  ghost.style.left = `${src.left + src.width / 2}px`;
  ghost.style.top = `${src.top + src.height / 2}px`;
  // 第一段：飞向目标
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dst.left + dst.width / 2}px, ${dst.top + dst.height / 2}px)`;
  });
  setTimeout(() => {
    // 第二段：飞入弃牌堆
    ghost.style.setProperty('--ghost-dur', '420ms');
    ghost.style.transform = `translate(${trash.left + trash.width / 2}px, ${trash.top + trash.height / 2}px)`;
  }, 520);
  setTimeout(() => ghost.remove(), 980);
}

// 卡牌效果描述（用于卡面展示）
function getEffectDescription(card) {
  if (!card) return '';
  if (card.type === 'prefix') {
    if (card.morphemeId === 're') return '随机抽 1 张牌';
    if (card.morphemeId === 'con') return '抽 1 张牌';
    if (card.morphemeId === 'over') return '下一张牌效果翻倍';
    return '回复 1 点能量';
  }
  if (card.type === 'root') {
    if (card.morphemeId === 'port') return '抽 2 张普通牌（若抽组合牌仅 1 张）';
    if (card.morphemeId === 'struct') return '获得 2 点护盾';
    if (card.morphemeId === 'act') return '造成 5 点伤害';
    return `造成 ${CONFIG.baseDamage} 点伤害`;
  }
  if (card.type === 'suffix') {
    if (card.morphemeId === 'able') return '能量变化 -1~+2（随机）';
    if (card.morphemeId === 'ion' || card.morphemeId === 'ure') return '回复 1 点能量';
    if (card.morphemeId === 'power') return '拖到敌人：随机造成 3-9 点伤害';
    if (card.morphemeId === 'see') return '拖到敌人：预览敌人下一回合意图';
    return '无立即效果';
  }
  return '';
}

// 卡牌类
class Card {
  constructor(data) {
    this.id = `${data.type}-${data.id}-${Math.random().toString(36).slice(2, 7)}`;
    this.morphemeId = data.id;
    this.type = data.type; // prefix | root | suffix
    this.text = data.text;
    this.meaning = data.meaning;
    this.cost = data.cost ?? 1;
  }
}

// 敌人类
class Enemy {
  constructor(name, maxHp) {
    this.name = name;
    this.maxHp = maxHp ?? CONFIG.enemyBaseHp;
    this.hp = this.maxHp;
    this.block = 0;
    this.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
    this.intent = 'attack';
    this.intentValue = 6;
    this.intentQueue = [];
  }

  rollIntent() {
    // 若存在预览队列，则按队列锁定下一回合意图
    if (this.intentQueue && this.intentQueue.length > 0) {
      const next = this.intentQueue.shift();
      this.intent = next.intent;
      this.intentValue = next.intentValue;
      return;
    }
    // 否则正常随机生成
    const r = Math.random();
    const w = CONFIG.enemyIntentWeights;
    if (r < w.attack) {
      this.intent = 'attack';
      this.intentValue = 6 + Math.floor(Math.random() * 6);
    } else if (r < w.attack + w.defend) {
      this.intent = 'defend';
      this.intentValue = 5 + Math.floor(Math.random() * 5);
    } else if (r < w.attack + w.defend + w.debuff) {
      this.intent = 'debuff';
      this.intentValue = 1;
    } else {
      this.intent = 'buff';
      this.intentValue = 1;
    }
  }

  takeTurn(game) {
    // 敌人回合：抽一张敌人牌堆中的牌（用于简单的出牌逻辑占位）
    if (game && typeof game.enemyDraw === 'function') {
      try { game.enemyDraw(1); } catch (_) {}
    }
    if (this.intent === 'attack') {
      const base = this.intentValue;
      const dmg = game.applyOutgoingDamageModifiers(base, 'enemy');
      const blockedRaw = Math.min(dmg, game.player.block);
      const absorbed = game.applyBlockAbsorbModifiers(blockedRaw, 'player');
      const unblocked = Math.max(0, dmg - absorbed);
      game.player.block = Math.max(0, game.player.block - blockedRaw);
      game.player.hp = Math.max(0, game.player.hp - unblocked);
      if (game.player.hp <= 0) { game.handleDeath(); return; }
      // reaction：若处于反击窗口且本次造成了实际伤害，则反击并清除状态
      if (unblocked > 0 && game.reactionStatus && game.reactionStatus.active && game.reactionStatus.turnsRemaining > 0) {
        game.dealDamage(game.reactionStatus.retaliateDamage, true);
        game.reactionStatus.active = false;
        game.reactionStatus.turnsRemaining = 0;
        game.reactionStatus.hasTriggered = true;
        game.reactionStatus.applyPenaltyAtStart = false;
      }
      animateEnemyPlay('player');
      game.triggerAttackDash('enemy');
      impactStage();
      const pAv = document.getElementById('playerAvatar');
      if (pAv) { pAv.classList.add('hit'); setTimeout(() => pAv.classList.remove('hit'), 320); }
      const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
      createDamageFloat(`敌人造成 ${dmg}`, rect.left + rect.width / 2, rect.top + 40);
    } else if (this.intent === 'defend') {
      const gain = game.applyBlockGainModifiers('enemy', this.intentValue);
      this.block += gain;
      animateEnemyPlay('enemy');
      game.triggerDefensePulse('enemy');
      const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
      createDamageFloat(`敌人格挡 +${gain}`, rect.left + rect.width / 2, rect.top + 40);
    } else if (this.intent === 'buff') {
      if (ENEMY_ACTIONS && ENEMY_ACTIONS.buff && ENEMY_ACTIONS.buff.length) {
        const pick = ENEMY_ACTIONS.buff[Math.floor(Math.random() * ENEMY_ACTIONS.buff.length)];
        const apply = pick && pick.apply ? pick.apply : null;
        if (apply) {
          if (apply.strength) game.addStatus('enemy', 'strength', apply.strength);
          if (apply.toughness) game.addStatus('enemy', 'toughness', apply.toughness);
        }
      }
      animateEnemyPlay('enemy');
      game.triggerDefensePulse('enemy');
      const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
      createDamageFloat(`敌人获得增益`, rect.left + rect.width / 2, rect.top + 40);
    } else {
      
      if (ENEMY_ACTIONS && ENEMY_ACTIONS.debuff && ENEMY_ACTIONS.debuff.length) {
        const pick = ENEMY_ACTIONS.debuff[Math.floor(Math.random() * ENEMY_ACTIONS.debuff.length)];
        const apply = pick && pick.apply ? pick.apply : null;
        if (apply) {
          if (apply.weak) game.addStatus('player', 'weak', apply.weak);
          if (apply.frail) game.addStatus('player', 'frail', apply.frail);
        }
      } else {
        
        game.addStatus('player', 'weak', 1);
      }
      animateEnemyPlay('player');
      const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
      createDamageFloat(`敌人施加减益`, rect.left + rect.width / 2, rect.top + 40);
    }
    // 敌人回合结束：衰减自身的一次性减益
    game.onStartTurn('enemy');
    this.rollIntent();
    game.updateUI();
  }
}

// 游戏类
class Game {
  constructor() {
    this.player = { hp: 70, maxHp: 70, block: 0, statuses: { weak: 0, frail: 0, strength: 0, toughness: 0 }, gold: 0 };
    this.encounteredEvents = [];
    this.energy = CONFIG.energyPerTurn;
    this.turn = 1;
    // UI：手牌选中态
    this.selectedCardId = null;
    this.UI_CARD_SHIFT = 24; // 邻牌让位偏移（px）
    this.deck = [];
    this.drawPile = [];
    this.discardPile = [];
    // 敌方牌堆
    this.enemyDeck = [];
    this.enemyDrawPile = [];
    this.enemyDiscardPile = [];
    this.hand = [];
    this.enemy = null;
    this.currentCombo = { prefix: null, root: null, suffix: null };
    this.comboZone = [];
    this.isLinking = false;
    this.linkSelection = [];
    this.linkCandidates = new Set();
    this._linkPointer = null;
    this._onLinkPointerMove = null;
    this._linkTimeoutId = null;
    this._linkDocClickHandler = null;
    this._linkPointer = null;
    this._onLinkPointerMove = null;
    this.nextTurnEnergyPenalty = 0;
    this.nextTurnDrawPenalty = 0; // 下回合抽牌惩罚（由组合副作用设置）
    this.dragLastPoint = null; // 记录桌面拖拽的最后坐标
    this.isDragging = false;
    this.dragArrow = null;
    this.didIntroScroll = false;
    // 效果联动与增益
    this.nextEffectDouble = false; // over：下一张牌效果翻倍（不包含组合）
    // reaction：两回合窗口内受伤则反击 20；否则第三回合扣 1 能量
    this.reactionStatus = { active: false, turnsRemaining: 0, retaliateDamage: 20, hasTriggered: false, applyPenaltyAtStart: false };

    this.hasStarted = false;
    this.tower = { rows: 20, lanes: 5, nodes: [], pos: { row: -1, idx: null }, visited: [] };
    this.stats = this.loadStats();
    this.bindUI();
    this.initTowerMapConstrained();
    this.updateUI();

    this._audioCache = {};
    this.preloadAudio('music/zhucaidan.mp3');
    this.preloadAudio('sound/zhandoukaishi.mp3');
    this.preloadAudio('music/zhandou.mp3');
    this.preloadAudio('sound/attack.mp3');
    this.preloadAudio('sound/deffent.mp3');
    this.installAudioUnlocker();
    this._bgmAutoplayBlocked = false;
    this._audioCtx = null;
    this._audioCtxUnlocked = false;
    this.setupVisibilityHandlers();
    this._pendingMapBgmDelayMs = 0;
  }
  applyOutgoingDamageModifiers(amount, who = 'player') {
    const actor = who === 'player' ? this.player : this.enemy;
    if (!actor) return Math.max(0, Math.floor(amount));
    let v = Math.max(0, Math.floor(amount));
    const st = actor.statuses || {};
    if (st.weak && st.weak > 0) {
      v = Math.floor(v * 0.8);
    }
    if (st.strength && st.strength > 0) {
      const layers = Math.min(10, st.strength);
      v = Math.floor(v * (1 + 0.05 * layers));
    }
    return Math.max(0, v);
  }

  applyBlockAbsorbModifiers(blockedAmount, whoTarget = 'enemy') {
    const target = whoTarget === 'player' ? this.player : this.enemy;
    if (!target) return Math.max(0, Math.floor(blockedAmount));
    let absorb = Math.max(0, Math.floor(blockedAmount));
    absorb = Math.min(absorb, blockedAmount);
    return Math.max(0, absorb);
  }

  applyBlockGainModifiers(who = 'player', gain) {
    const target = who === 'player' ? this.player : this.enemy;
    if (!target) return Math.max(0, Math.floor(gain));
    const st = target.statuses || {};
    let v = Math.max(0, Math.floor(gain));
    if (st.frail && st.frail > 0) {
      v = Math.floor(v * 0.5);
    }
    if (st.toughness && st.toughness > 0) {
      const layers = Math.min(5, st.toughness);
      v = Math.floor(v * (1 + 0.10 * layers));
    }
    return Math.max(0, v);
  }

  addStatus(who = 'player', key, stacks = 1) {
    const target = who === 'player' ? this.player : this.enemy;
    if (!target) return;
    if (!target.statuses) target.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
    const s = target.statuses;
    const n = Math.max(0, Math.floor(stacks || 1));
    if (key === 'weak' || key === 'frail') {
      s[key] = (s[key] || 0) + n;
      return;
    }
    if (key === 'strength' || key === 'toughness') {
      const max = key === 'strength' ? 10 : 5;
      s[key] = Math.min(max, (s[key] || 0) + n);
      return;
    }
  }

  onStartTurn(who = 'player') {
    const target = who === 'player' ? this.player : this.enemy;
    if (!target || !target.statuses) return;
    ['weak','frail'].forEach(k => {
      if (target.statuses[k] && target.statuses[k] > 0) {
        target.statuses[k] = Math.max(0, target.statuses[k] - 1);
      }
    });
  }

  playBgm(src, { loop = true, volume = 1 } = {}) {
    try {
      if (!src) return;
      const url = src.startsWith('/') ? src : ((src.startsWith('sound/') || src.startsWith('music/')) ? `/${src}` : src);
      this._bgmMutedAutoplayTried = false;
      const tryMutedAutoplay = () => {
        if (!this.bgm || this._bgmMutedAutoplayTried) return;
        this._bgmMutedAutoplayTried = true;
        try {
          this.bgm.muted = true;
          this.bgm.volume = 0;
          const p2 = this.bgm.play();
          if (p2 && p2.catch) p2.catch(() => {});
          setTimeout(() => {
            try {
              this.bgm.muted = false;
              this.bgm.volume = volume;
              const p3 = this.bgm.play();
              if (p3 && p3.catch) p3.catch(() => {});
            } catch (_) {}
          }, 200);
        } catch (_) {}
      };
      if (this.bgm && this.bgm.src && this.bgm.src.endsWith(src)) {
        this.bgm.loop = loop;
        this.bgm.volume = volume;
        const pr = this.bgm.play();
        if (pr && pr.catch) pr.catch(() => { this._bgmAutoplayBlocked = true; tryMutedAutoplay(); });
        try { this.bgm.addEventListener('canplaythrough', () => { if (this._bgmAutoplayBlocked) tryMutedAutoplay(); }, { once: true }); } catch (_) {}
        return;
      }
      if (this.bgm) { try { this.bgm.pause(); } catch (_) {} }
      this.bgm = new Audio(url);
      this.bgm.loop = loop;
      this.bgm.volume = volume;
      this.bgm.addEventListener('playing', () => { this._bgmAutoplayBlocked = false; });
      const pr = this.bgm.play();
      if (pr && pr.catch) pr.catch(() => { this._bgmAutoplayBlocked = true; tryMutedAutoplay(); });
      try { this.bgm.addEventListener('canplaythrough', () => { if (this._bgmAutoplayBlocked) tryMutedAutoplay(); }, { once: true }); } catch (_) {}
    } catch (_) {}
  }

  installAudioUnlocker() {
    if (this._audioUnlockInstalled) return;
    this._audioUnlockInstalled = true;
    const tryResume = () => {
      this.ensureAudioContext();
      try { this.bgm && this.bgm.play().catch(() => {}); } catch (_) {}
      window.removeEventListener('click', tryResume, true);
      window.removeEventListener('keydown', tryResume, true);
      window.removeEventListener('touchstart', tryResume, true);
      window.removeEventListener('pointerdown', tryResume, true);
    };
    window.addEventListener('click', tryResume, true);
    window.addEventListener('keydown', tryResume, true);
    window.addEventListener('touchstart', tryResume, true);
    window.addEventListener('pointerdown', tryResume, true);
  }

  ensureAudioContext() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this._audioCtx) this._audioCtx = new AC();
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(() => {});
      }
      if (!this._audioCtxUnlocked) {
        const ctx = this._audioCtx;
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this._audioCtxUnlocked = true;
      }
    } catch (_) {}
  }

  setupVisibilityHandlers() {
    const onVis = () => {
      if (document.hidden) {
        try { this.bgm && this.bgm.pause(); } catch (_) {}
      } else {
        try { if (this.bgm && !this._bgmAutoplayBlocked) this.bgm.play().catch(() => {}); } catch (_) {}
      }
    };
    document.addEventListener('visibilitychange', onVis, true);
  }

  preloadAudio(src) {
    try {
      if (this._audioCache[src]) return this._audioCache[src];
      const url = src.startsWith('/') ? src : ((src.startsWith('sound/') || src.startsWith('music/')) ? `/${src}` : src);
      const a = new Audio(url);
      a.preload = 'metadata';
      try { a.addEventListener('error', () => { this._audioCache[src] = null; }, { once: true }); } catch (_) {}
      a.load();
      this._audioCache[src] = a;
      return a;
    } catch (_) { return null; }
  }

  fadeOutBgm(ms = 3000) {
    if (!this.bgm) return;
    if (this._bgmFadeTimer) { cancelAnimationFrame(this._bgmFadeTimer); this._bgmFadeTimer = null; }
    const a = this.bgm;
    const start = a.volume;
    const t0 = performance.now();
    const step = (ts) => {
      const elapsed = ts - t0;
      const v = Math.max(0, start * (1 - Math.min(1, elapsed / ms)));
      try { a.volume = v; } catch (_) {}
      if (elapsed >= ms) {
        try { a.pause(); a.currentTime = 0; } catch (_) {}
        this._bgmFadeTimer = null;
        return;
      }
      this._bgmFadeTimer = requestAnimationFrame(step);
    };
    this._bgmFadeTimer = requestAnimationFrame(step);
  }

  stopBgmImmediate() {
    if (!this.bgm) return;
    try { this.bgm.volume = 0; this.bgm.pause(); this.bgm.currentTime = 0; } catch (_) {}
  }

  sceneTransition(onMid, totalMs = 1000) {
    try {
      const overlay = document.createElement('div');
      overlay.className = 'map-overlay';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 500ms ease';
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        setTimeout(() => {
          try { onMid && onMid(); } catch (_) {}
          overlay.style.opacity = '0';
          setTimeout(() => { try { overlay.remove(); } catch (_) {} }, Math.max(0, totalMs - 500));
        }, 500);
      });
    } catch (_) {
      try { onMid && onMid(); } catch (_) {}
    }
  }

  playCue(src, { volume = 1 } = {}) {
    try {
      const url = src.startsWith('/') ? src : ((src.startsWith('sound/') || src.startsWith('music/')) ? `/${src}` : src);
      const sfx = this._audioCache[src] || new Audio(url);
      sfx.volume = volume;
      try { sfx.currentTime = 0; } catch (_) {}
      sfx.play().catch(() => {});
      this._audioCache[src] = sfx;
    } catch (_) {}
  }

  triggerAttackDash(who = 'player') {
    const el = document.getElementById(who === 'player' ? 'playerAvatar' : 'enemyAvatar');
    if (!el) return;
    const cls = who === 'player' ? 'dash-player' : 'dash-enemy';
    el.classList.add(cls);
    const remove = () => { el.classList.remove(cls); el.removeEventListener('animationend', remove); };
    el.addEventListener('animationend', remove);
  }

  triggerDefensePulse(who = 'player') {
    const el = document.getElementById(who === 'player' ? 'playerAvatar' : 'enemyAvatar');
    if (!el) return;
    try { this.playCue('sound/deffent.mp3'); } catch (_) {}
    const cls = 'def-pulse';
    el.classList.add(cls);
    const remove = () => { el.classList.remove(cls); el.removeEventListener('animationend', remove); };
    el.addEventListener('animationend', remove);
  }

  isDefenseCard(card) {
    return !!card && card.type === 'root' && card.morphemeId === 'struct';
  }

  animateDefenseUse(cardEl, amount) {
    if (!cardEl) return Promise.resolve();
    const start = cardEl.getBoundingClientRect();
    const overlay = cardEl.cloneNode(true);
    overlay.style.position = 'fixed';
    overlay.style.left = `${start.left + start.width / 2}px`;
    overlay.style.top = `${start.top + start.height / 2}px`;
    overlay.style.transform = 'translate(-50%,-50%) scale(1)';
    overlay.style.zIndex = '10000';
    overlay.style.pointerEvents = 'none';
    overlay.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)';
    document.body.appendChild(overlay);
    const hp = document.getElementById('playerHpStage') || document.getElementById('playerAvatar');
    const blockOverlay = document.getElementById('playerBlockOverlay');
    const trash = document.getElementById('discardStack');
    const targetHp = hp ? hp.getBoundingClientRect() : start;
    const targetTrash = trash ? trash.getBoundingClientRect() : start;
    // 放大悬停
    overlay.style.transition = 'transform 260ms ease-out';
    overlay.style.transform = 'translate(-50%,-50%) scale(1.15)';
    const actualGain = this.applyBlockGainModifiers('player', amount);
    const N = Math.max(18, Math.min(48, actualGain * 12));
    const particles = [];
    const dwell = 380;
    const fly = 420;
    const cx = start.left + start.width / 2;
    const cy = start.top + start.height / 2;
    const halfDiagCard = Math.hypot(start.width / 2, start.height / 2);
    const rMinCard = halfDiagCard + 20;
    const rMaxCard = halfDiagCard + 120;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('div');
      p.className = 'def-particle';
      const angle = Math.random() * Math.PI * 2;
      const radius = rMinCard + Math.random() * (rMaxCard - rMinCard);
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * radius;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.transform = 'translate(0,0)';
      document.body.appendChild(p);
      
      let tx = targetHp.left + targetHp.width * 0.35;
      let ty = targetHp.top + targetHp.height * 0.5;
      if (blockOverlay) {
        const br = blockOverlay.getBoundingClientRect();
        // 汇入护盾条末端（若护盾为0则从左侧开始）
        tx = br.right;
        ty = br.top + br.height / 2;
        // 增加一点垂直随机抖动，使汇入效果更自然
        ty += (Math.random() - 0.5) * (br.height * 0.8);
      }

      const expStart = 20 + i * (180 / N);
      setTimeout(() => {
        p.style.transition = 'transform 240ms ease-out';
        p.style.transform = `translate(${sx - cx}px, ${sy - cy}px)`;
      }, expStart);
      const flightDelay = expStart + 240 + dwell + (20 + i * (520 / N));
      setTimeout(() => {
        p.style.transition = `transform ${fly}ms ease-in, opacity 260ms ease-in`;
        p.style.transform = `translate(${tx - cx}px, ${ty - cy}px)`;
        p.style.opacity = '0';
      }, flightDelay);
      particles.push(p);
    }
    return new Promise((resolve) => {
      const maxExpStart = 20 + (180 * (N - 1) / N);
      const maxFlightStagger = 20 + (520 * (N - 1) / N);
      const arrive = maxExpStart + 240 + dwell + maxFlightStagger + fly + 80;
      setTimeout(() => {
        // 更新防御并刷新
        this.player.block += actualGain;
        this.updateUI();
        this.triggerDefensePulse('player');
        const pv = document.getElementById('playerAvatar');
        if (pv) {
          const r = pv.getBoundingClientRect();
          createDamageFloat(`护盾 +${actualGain}`, r.left + r.width / 2, r.top + 30);
        }
        // 收尾：缩小卡并飞入弃牌堆
        overlay.style.transition = 'transform 360ms ease-in, opacity 220ms ease-in';
        const tx = targetTrash.left + targetTrash.width / 2;
        const ty = targetTrash.top + targetTrash.height / 2;
        const dx = tx - (start.left + start.width / 2);
        const dy = ty - (start.top + start.height / 2);
        overlay.style.transform = `translate(${dx}px, ${dy}px) scale(0.75)`;
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          particles.forEach(el => el.remove());
          resolve();
        }, 400);
      }, arrive);
    });
  }

  animateDefenseFromSlots(amount) {
    const hp = document.getElementById('playerHpStage') || document.getElementById('playerAvatar');
    const targetHp = hp ? hp.getBoundingClientRect() : null;
    const origins = [];
    const rootContent = document.querySelector('#slotRoot .slot-content');
    const suffixContent = document.querySelector('#slotSuffix .slot-content');
    if (rootContent) origins.push(rootContent.getBoundingClientRect());
    if (suffixContent) origins.push(suffixContent.getBoundingClientRect());
    if (origins.length === 0) {
      const handEl = document.getElementById('hand');
      let srcRect = null;
      if (handEl) {
        const linkedEls = Array.from(handEl.querySelectorAll('.card.linked'));
        if (linkedEls.length) {
          srcRect = linkedEls[linkedEls.length - 1].getBoundingClientRect();
        } else {
          srcRect = handEl.getBoundingClientRect();
        }
      }
      if (srcRect) origins.push(srcRect);
    }
    const actualGain = this.applyBlockGainModifiers('player', amount);
    const N = Math.max(18, Math.min(48, actualGain * 12));
    const per = origins.length ? Math.ceil(N / origins.length) : N;
    const particles = [];
    const dwell = 380;
    const fly = 420;
    origins.forEach(start => {
      for (let i = 0; i < per; i++) {
        const p = document.createElement('div');
        p.className = 'def-particle';
        const angle = Math.random() * Math.PI * 2;
        const halfDiag = Math.hypot(start.width / 2, start.height / 2);
        const rMin = halfDiag + 20;
        const rMax = halfDiag + 120;
        const radius = rMin + Math.random() * (rMax - rMin);
        const cx = start.left + start.width / 2;
        const cy = start.top + start.height / 2;
        const sx = cx + Math.cos(angle) * radius;
        const sy = cy + Math.sin(angle) * radius;
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        p.style.transform = 'translate(0,0)';
        document.body.appendChild(p);
        if (targetHp) {
          const tx = targetHp.left + targetHp.width * 0.35;
          const ty = targetHp.top + targetHp.height * 0.5;
          const expStart = 20 + i * (180 / per);
          setTimeout(() => {
            p.style.transition = 'transform 240ms ease-out';
            p.style.transform = `translate(${sx - cx}px, ${sy - cy}px)`;
          }, expStart);
          const flightDelay = expStart + 240 + dwell + (20 + i * (520 / per));
          setTimeout(() => {
            p.style.transition = `transform ${fly}ms ease-in, opacity 260ms ease-in`;
            p.style.transform = `translate(${tx - cx}px, ${ty - cy}px)`;
            p.style.opacity = '0';
          }, flightDelay);
        }
        particles.push(p);
      }
    });
    return new Promise((resolve) => {
      const maxExpStart = 20 + (180 * (per - 1) / per);
      const maxFlightStagger = 20 + (520 * (per - 1) / per);
      const arrive = maxExpStart + 240 + dwell + maxFlightStagger + fly + 80;
      setTimeout(() => {
        this.player.block += actualGain;
        this.triggerDefensePulse('player');
        this.updateUI();
        const pv = document.getElementById('playerAvatar');
        if (pv) {
          const r = pv.getBoundingClientRect();
          createDamageFloat(`护盾 +${actualGain}`, r.left + r.width / 2, r.top + 30);
        }
        particles.forEach(el => el.remove());
        resolve();
      }, arrive);
    });
  }


  createDragArrow(sx, sy) {
    if (this.dragArrow && this.dragArrow.svg) {
      try { this.dragArrow.svg.remove(); } catch (_) {}
      this.dragArrow = null;
    }
    const stray = document.querySelectorAll('.drag-arrow');
    stray.forEach(el => { try { el.remove(); } catch (_) {} });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('drag-arrow');
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${sx} ${sy} C ${sx} ${sy} ${sx} ${sy} ${sx} ${sy}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'none');
    svg.appendChild(path);
    const balls = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    balls.setAttribute('fill', '#e0c080');
    svg.appendChild(balls);
    // 固定向上的箭头头部（不随路径方向改变）
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    head.setAttribute('points', '24,0 48,48 0,48');
    head.setAttribute('fill', '#e0c080');
    head.setAttribute('transform', `translate(${sx - 24}, ${sy - 48})`);
    svg.appendChild(head);
    document.body.appendChild(svg);
    this.dragArrow = { svg, path, balls, head, sx, sy, ex: sx, ey: sy };
  }

  updateDragArrow(ex, ey, target) {
    if (!this.dragArrow) return;
    const { path, balls, head, sx, sy } = this.dragArrow;
    // 若坐标缺失则维持在起点，避免回到左上角
    if (ex == null || ey == null) {
      path.setAttribute('d', `M ${sx} ${sy} C ${sx} ${sy} ${sx} ${sy} ${sx} ${sy}`);
      while (balls.firstChild) balls.removeChild(balls.firstChild);
      return;
    }
    // 移除平滑延迟以确保箭头紧跟鼠标，避免“黏手”感
    // const k = 0.3;
    // const prevEx = this.dragArrow.ex, prevEy = this.dragArrow.ey;
    // let stepX = ex - prevEx;
    // let stepY = ey - prevEy;
    // const maxStep = 90;
    // const stepLen = Math.hypot(stepX, stepY);
    // if (stepLen > maxStep) {
    //   const s = maxStep / stepLen;
    //   stepX *= s; stepY *= s;
    // }
    // const smEx = prevEx + stepX * k;
    // const smEy = prevEy + stepY * k;
    const smEx = ex;
    const smEy = ey;
    this.dragArrow.ex = smEx; this.dragArrow.ey = smEy;
    const dx = smEx - sx, dy = smEy - sy;
    const bend = Math.min(120, Math.hypot(dx, dy) / 2);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle + Math.PI / 2) * bend;
    const ny = Math.sin(angle + Math.PI / 2) * bend;
    const c1x = sx + nx * 0.6;
    const c1y = sy + ny * 0.6;
    const c2x = smEx - nx * 0.4;
    const c2y = smEy - ny * 0.4;
    path.setAttribute('d', `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${smEx} ${smEy}`);
    // 依据曲线长度自适应小球间隔与半径（仅一次弯曲）
    // 先估算长度
    let length = 0;
    let prevX = sx, prevY = sy;
    const segsLen = 42;
    for (let i = 1; i <= segsLen; i++) {
      const t = i / segsLen;
      const omt = 1 - t;
      const px = omt*omt*omt*sx + 3*omt*omt*t*c1x + 3*omt*t*t*c2x + t*t*t*smEx;
      const py = omt*omt*omt*sy + 3*omt*omt*t*c1y + 3*omt*t*t*c2y + t*t*t*smEy;
      length += Math.hypot(px - prevX, py - prevY);
      prevX = px; prevY = py;
    }
    const spacing = Math.max(20, Math.min(60, (length / 12) * 1.5));
    const count = Math.max(3, Math.min(80, Math.floor(length / spacing)));
    const radius = Math.max(6, Math.min(14, (4 + length / 120) * 1.5));
    while (balls.firstChild) balls.removeChild(balls.firstChild);
    for (let i = 0; i <= count; i++) {
      const t = i / Math.max(1, count);
      const omt = 1 - t;
      const px = omt*omt*omt*sx + 3*omt*omt*t*c1x + 3*omt*t*t*c2x + t*t*t*smEx;
      const py = omt*omt*omt*sy + 3*omt*omt*t*c1y + 3*omt*t*t*c2y + t*t*t*smEy;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', py);
      circle.setAttribute('r', String(radius));
      balls.appendChild(circle);
    }
    const tdx = smEx - c2x;
    const tdy = smEy - c2y;
    const targetDeg = Math.atan2(tdy, tdx) * 180 / Math.PI;
    const prevDeg = this.dragArrow.angle ?? targetDeg;
    const smoothDeg = prevDeg + (targetDeg - prevDeg) * 0.5; // 角度平滑，避免抖动
    head.setAttribute('transform', `translate(${smEx}, ${smEy}) rotate(${smoothDeg}) translate(-32, -64)`);
    this.dragArrow.angle = smoothDeg;
    // 色彩提示
    let color = '#e0c080';
    if (target === 'enemy') color = '#e94e42';
    else if (target === 'slot') color = '#6ab0ff';
    balls.setAttribute('fill', color);
    if (head) head.setAttribute('fill', color);
  }

  destroyDragArrow() {
    if (this.dragArrow && this.dragArrow.svg) this.dragArrow.svg.remove();
    this.dragArrow = null;
  }

  detectDragTarget(x, y) {
    const els = document.elementsFromPoint(x, y);
    let enemy = els.find(n => n && (n.id === 'enemyAvatar' || n.id === 'enemyHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('enemy'))));
    if (!enemy) {
      const e1 = document.getElementById('enemyAvatar');
      const e2 = document.getElementById('enemyHpStage');
      const pad = 32;
      const hit = (r) => r && x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
      const r1 = e1 ? e1.getBoundingClientRect() : null;
      const r2 = e2 ? e2.getBoundingClientRect() : null;
      if (hit(r1) || hit(r2)) enemy = e1 || e2;
    }
    if (enemy) return 'enemy';
    let slot = els.find(n => n && n.classList && n.classList.contains('slot'));
    if (!slot) {
      const pads = 24;
      const slots = Array.from(document.querySelectorAll('.slot'));
      for (let i = 0; i < slots.length; i++) {
        const r = slots[i].getBoundingClientRect();
        if (x >= r.left - pads && x <= r.right + pads && y >= r.top - pads && y <= r.bottom + pads) { slot = slots[i]; break; }
      }
    }
    if (slot) {
      document.querySelectorAll('.slot.dragover').forEach(el => el.classList.remove('dragover'));
      slot.classList.add('dragover');
      return 'slot';
    }
    return 'none';
  }

  startClickAim(cardId) {
    const hand = document.getElementById('hand');
    const el = hand ? hand.querySelector(`[data-card-id="${cardId}"]`) : null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const sx = r.left + r.width / 2;
    const sy = r.top + r.height / 2;
    this.aimCardId = cardId;
    this.isAiming = true;
    // 暂时移除全局 document 点击处理，避免与瞄准点击冲突
    if (this._globalDocClickHandlerBound && this._globalDocClickHandler) {
      document.removeEventListener('click', this._globalDocClickHandler, true);
      this._globalDocClickHandlerBound = false;
    }
    this.createDragArrow(sx, sy);
    const onMove = (ev) => {
      const x = ev.clientX ?? (ev.pageX - window.scrollX);
      const y = ev.clientY ?? (ev.pageY - window.scrollY);
      const target = this.detectDragTarget(x, y);
      this.updateDragArrow(x, y, target);
      // 槽位高亮：与拖拽一致
      const els = document.elementsFromPoint(x, y);
      const slotEl = els.find(n => n && n.classList && n.classList.contains('slot'));
      if (this._aimHoverSlot && this._aimHoverSlot !== slotEl) {
        this._aimHoverSlot.classList.remove('dragover');
        this._aimHoverSlot = null;
      }
      if (slotEl && !slotEl.classList.contains('dragover')) {
        slotEl.classList.add('dragover');
        this._aimHoverSlot = slotEl;
      }
    };
    const onClick = (ev) => {
      const id = this.aimCardId;
      const card = this.hand.find(c => c && c.id === id);
      if (!id || !card) { this.stopClickAim(); return; }
      const slotEl = ev.target && ev.target.closest ? ev.target.closest('.slot') : null;
      if (slotEl) {
        this.playCardToSlot(id);
        this.renderComboSlots();
        this.stopClickAim();
        return;
      }
      const x = ev.clientX ?? (ev.pageX - window.scrollX);
      const y = ev.clientY ?? (ev.pageY - window.scrollY);
      const target = this.detectDragTarget(x, y);
      if (target === 'enemy') {
        this.playCard(id);
      } else if (target === 'slot') {
        this.playCardToSlot(id);
        this.renderComboSlots();
      } else {
        const els = document.elementsFromPoint(x, y);
        const onPlayer = els.find(n => n && (n.id === 'playerAvatar' || n.id === 'playerHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('player'))));
        if (onPlayer) {
          if (this.isEnemyTargeting(card)) {
            Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: card.type, morphemeId: card.morphemeId });
          } else {
            this.playCard(id);
          }
        }
      }
      this.stopClickAim();
    };
    this._aimHandlers = { onMove, onClick };
    document.addEventListener('mousemove', onMove, { capture: true });
    document.addEventListener('click', onClick, { capture: true, once: true });
  }

  stopClickAim() {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.aimCardId = null;
    const h = this._aimHandlers;
    if (h && h.onMove) document.removeEventListener('mousemove', h.onMove, { capture: true });
    this._aimHandlers = null;
    if (this._aimHoverSlot) { this._aimHoverSlot.classList.remove('dragover'); this._aimHoverSlot = null; }
    this.destroyDragArrow();
    // 恢复全局 document 点击处理
    if (!this._globalDocClickHandlerBound && this._globalDocClickHandler) {
      document.addEventListener('click', this._globalDocClickHandler, true);
      this._globalDocClickHandlerBound = true;
    }
  }

  bindUI() {
    initKaishi(document.body, () => {
      this.showMap(true);
    });

    const btnEndTurn = document.getElementById('btnEndTurn');
    if (btnEndTurn) btnEndTurn.addEventListener('click', () => this.endTurn());
    const btnShowMap = document.getElementById('btnShowMap');
    if (btnShowMap) btnShowMap.addEventListener('click', () => {
      if (this.enemy) return; // 战斗中禁用地图
      this.showMap(true);
    });
    // 记录拖拽移动的最后坐标（桌面浏览器）；用于在 dragend 时判断是否拖出了手牌区域
    document.addEventListener('dragover', (e) => {
      this.dragLastPoint = { x: e.clientX, y: e.clientY };
    }, true);
    // 在容器级别做点击委托：点击卡片进入“点击瞄准”（显示箭头并跟随鼠标）
    const handContainer = document.getElementById('hand');
    if (handContainer && !handContainer.__delegatedClick) {
      handContainer.addEventListener('click', (e) => {
        if (this.isDragging) return;
        const cardEl = e.target.closest('.card');
        if (cardEl) {
          const r = cardEl.getBoundingClientRect();
          const x = e.clientX ?? (e.pageX - window.scrollX);
          if (x < r.left + 15 || x > r.right - 15) return;
          e.preventDefault();
          e.stopPropagation();
          const id = cardEl.getAttribute('data-card-id');
          if (!id) return;
          if (this.isLinking) {
            this.toggleLinkSelect(id);
            return;
          }
          this.startClickAim(id);
        } else {
          this.stopClickAim();
        }
      }, true);
      handContainer.__delegatedClick = true;
    }
    // 点击页面其他地方也能清除选中（避免选中态残留）——保存句柄，便于瞄准期间临时移除
    if (!this._globalDocClickHandlerBound) {
      this._globalDocClickHandler = (e) => {
        const hand = document.getElementById('hand');
        if (!hand) return;
        if (!hand.contains(e.target)) {
          this.stopClickAim();
        }
      };
      document.addEventListener('click', this._globalDocClickHandler, true);
      this._globalDocClickHandlerBound = true;
    }
    // 地图按钮事件（原型占位）
    const mapEl = document.getElementById('towerMap');
    if (mapEl && !mapEl.__bound) {
      mapEl.__bound = true;
    }

    // 点击右下角弃牌堆，打开只读查看器
    const discardStackEl = document.getElementById('discardStack');
    if (discardStackEl) discardStackEl.addEventListener('click', () => this.openDiscardViewer());
    const drawStackEl = document.getElementById('drawStack');
    if (drawStackEl) drawStackEl.addEventListener('click', () => this.openStackViewer('draw'));

    // 词典栏底部：打开卡牌图鉴
    const btnOpenComp = document.getElementById('btnOpenCompendium');
    if (btnOpenComp) btnOpenComp.addEventListener('click', () => this.openCompendium());
    const btnLinkCombo = document.getElementById('btnLinkCombo');
    if (btnLinkCombo) btnLinkCombo.addEventListener('click', () => this.toggleLinkMode());

    // 词典丝滑收起：点击标题切换折叠状态，并持久化到 localStorage
    const wordGuide = document.getElementById('wordGuide');
    const guideTitle = wordGuide ? wordGuide.querySelector('.guide-title') : null;
    const collapsedSaved = localStorage.getItem('wordGuideCollapsed');
    if (wordGuide && collapsedSaved === '1') {
      wordGuide.classList.add('collapsed');
    }
    if (guideTitle && !guideTitle.__bound) {
      guideTitle.addEventListener('click', () => {
        if (!wordGuide) return;
        const willCollapse = !wordGuide.classList.contains('collapsed');
        // 先设置一个较大的 max-height 以便动画到收起状态
        if (!willCollapse) {
          // 展开时临时允许容器有更大高度，避免截断
          wordGuide.style.maxHeight = '';
        }
        wordGuide.classList.toggle('collapsed');
        localStorage.setItem('wordGuideCollapsed', wordGuide.classList.contains('collapsed') ? '1' : '0');
      });
      guideTitle.__bound = true;
    }
    const btnSkip = document.getElementById('btnSkipBattle');
    if (btnSkip) btnSkip.addEventListener('click', () => this.endBattle(true));

    const mapEventTestBtn = document.getElementById('mapEventTestBtn');
    if (mapEventTestBtn && !mapEventTestBtn.__bound) {
      mapEventTestBtn.addEventListener('click', () => {
        this.openEventTestPicker();
      });
      mapEventTestBtn.__bound = true;
    }

    // 拖拽目标：敌人头像（造成打击）
    const enemyDrop = document.getElementById('enemyAvatar');
    if (enemyDrop) {
      ['dragover','dragenter'].forEach(ev => enemyDrop.addEventListener(ev, e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }));
      // Drop a card on the enemy avatar to play it as an attack
      enemyDrop.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) this.playCard(id);
        Logger.info('Card dropped on enemy avatar', { cardId: id });
        // 冲击特效改由 dealDamage 统一触发
      });
    }
    
    const enemyArea = document.querySelector('.combatant.enemy');
    if (enemyArea) {
      ['dragover','dragenter'].forEach(ev => enemyArea.addEventListener(ev, e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }));
      enemyArea.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id) this.playCard(id);
        Logger.info('Card dropped on enemy area', { cardId: id });
      });
    }

    // 拖拽目标：玩家头像（非对敌效果在此使用）
    const playerDrop = document.getElementById('playerAvatar');
    if (playerDrop) {
      ['dragover','dragenter'].forEach(ev => playerDrop.addEventListener(ev, e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }));
      playerDrop.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const card = this.hand.find(c => c.id === id);
        if (!card) return;
        if (this.isEnemyTargeting(card)) {
          Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: card.type, morphemeId: card.morphemeId });
          return;
        }
        this.playCard(id);
        Logger.info('Card dropped on player avatar', { cardId: id });
      });
    }
    const playerArea = document.querySelector('.combatant.player');
    if (playerArea) {
      ['dragover','dragenter'].forEach(ev => playerArea.addEventListener(ev, e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }));
      playerArea.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const card = this.hand.find(c => c.id === id);
        if (!card) return;
        if (this.isEnemyTargeting(card)) {
          Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: card.type, morphemeId: card.morphemeId });
          return;
        }
        this.playCard(id);
        Logger.info('Card dropped on player area', { cardId: id });
      });
    }

    // 组合槽位拖拽
    const slots = [
      { el: document.getElementById('slotRoot') },
      { el: document.getElementById('slotSuffix') },
    ];
    slots.forEach(({ el }) => {
      if (!el) return;
      ['dragover','dragenter'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; el.classList.add('dragover'); }));
      ['dragleave','drop'].forEach(ev => el.addEventListener(ev, () => el.classList.remove('dragover')));
      // Drop a card into a combo slot (prefix/root or suffix)
      el.addEventListener('drop', e => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const card = this.hand.find(c => c.id === id);
        if (!card) return;
        this.playCardToSlot(id); // 暂存到组合区，可按按钮归还
        Logger.info('Card dropped into combo slot', { cardId: id, slot: el.id });
        this.renderComboSlots();
      });
    });

  }

  // 选择某张手牌并应用邻牌让位布局
  selectCard(cardId) {
    if (this.selectedCardId === cardId) {
      this.selectedCardId = null; // 再次点击则取消选中
    } else {
      this.selectedCardId = cardId;
    }
    this.applyHandSelectionLayout();
  }

  // 清除选中状态并还原所有手牌的位移与样式
  clearSelection() {
    this.selectedCardId = null;
    const hand = document.getElementById('hand');
    const cards = Array.from(hand ? hand.children : []);
    cards.forEach(el => {
      el.classList.remove('selected');
      if (!el.classList.contains('dragging')) {
        el.style.transform = '';
      }
    });
  }

  applyHandSelectionLayout() {
    const cards = Array.from(document.getElementById('hand').children);
    cards.forEach(el => {
      el.classList.remove('selected');
      if (!el.classList.contains('dragging')) el.style.transform = '';
    });
  }

  // 能量变动，限制下限为 0，上限为 energyPerTurn + 2（与原设定一致）
  changeEnergy(delta) {
    const cap = CONFIG.energyPerTurn + 2;
    this.energy = Math.max(0, Math.min(cap, this.energy + delta));
  }

  loadStats() {
    const raw = localStorage.getItem('wordsSpireStats');
    if (raw) {
      try { return JSON.parse(raw); } catch (_) {}
    }
    return { morphemesMastered: 0, wordsFormed: 0 };
  }

  saveStats() {
    localStorage.setItem('wordsSpireStats', JSON.stringify(this.stats));
  }

  buildStarterDeck() {
    this.deck = STARTER_DECK.map(({ ref, kind }) => new Card(findMorpheme(kind, ref)));
    // 适当复制一些常用卡以保证可玩性
    this.deck.push(new Card(findMorpheme('root', 'port')));
    this.deck.push(new Card(findMorpheme('root', 'act')));
    this.deck.push(new Card(findMorpheme('suffix', 'ion')));
    this.deck.push(new Card(findMorpheme('prefix', 're')));
    shuffle(this.deck);
  }

  // 敌人牌堆（简版）：复用起始牌组，保证与玩家卡兼容，便于偷取
  buildEnemyDeck() {
    // 随机挑选 7 张起始卡，保证包含新加入的前缀/后缀
    const pool = [...STARTER_DECK];
    shuffle(pool);
    const picks = pool.slice(0, Math.min(7, pool.length));
    this.enemyDeck = picks.map(({ ref, kind }) => new Card(findMorpheme(kind, ref)));
    shuffle(this.enemyDeck);
    this.enemyDrawPile = [...this.enemyDeck];
    this.enemyDiscardPile = [];
  }

  initTowerMap() {
    const rows = this.tower.rows;
    const nodes = [];
    const bossX = 0.5;
    nodes[0] = [{ row: 0, idx: 0, x: bossX, type: 'boss', edges: [] }];
    const starts = [0.08, 0.25, 0.42, 0.58, 0.75];
    nodes[rows - 1] = starts.map((x, i) => ({ row: rows - 1, idx: i, x, type: 'fight', edges: [] }));
    let widestSet = false;
    for (let r = 1; r < rows - 1; r++) {
      let count = randInt(3, 6);
      if (!widestSet && r === Math.floor(rows / 2)) { count = Math.max(count, 5); widestSet = true; }
      const xs = [];
      const minSep = 0.12;
       let attempts = 0;
      while (xs.length < count && attempts < 100) {
        attempts++;
        const v = 0.06 + Math.random() * 0.88;
        if (xs.every(u => Math.abs(u - v) >= minSep)) xs.push(v);
      }
      xs.sort((a,b)=>a-b);
      const row = xs.map((x, i) => ({ row: r, idx: i, x, type: 'fight', edges: [] }));
      nodes[r] = row;
    }
    const eliteA = 7;
    const eliteB = 15;
    if (eliteA > 0 && eliteA < rows - 1) nodes[eliteA].forEach(n => n.type = 'elite');
    if (eliteB > 0 && eliteB < rows - 1) nodes[eliteB].forEach(n => n.type = 'elite');
    const restShopRows = [4, 10, 18].filter(r => r > 0 && r < rows - 1);
    restShopRows.forEach((r, idx) => { nodes[r].forEach((n, i) => { n.type = (idx + i) % 2 === 0 ? 'rest' : 'shop'; }); });
    for (let r = 1; r < rows - 1; r++) {
      if (r === eliteA || r === eliteB || restShopRows.includes(r)) continue;
      nodes[r].forEach(n => { n.type = Math.random() < 0.4 ? 'event' : 'fight'; });
    }
    for (let r = 1; r < rows - 1; r++) {
      const prevT = nodes[r - 1][0].type;
      const curT = nodes[r][0].type;
      const prevSpecial = prevT !== 'fight' && prevT !== 'event' && prevT !== 'boss';
      const curSpecial = curT !== 'fight' && curT !== 'event' && curT !== 'boss';
      if (curSpecial && prevSpecial && r !== eliteA && r !== eliteB) nodes[r].forEach(n => { n.type = 'fight'; });
    }
    let runType = null, runLen = 0;
    for (let r = 1; r < rows - 1; r++) {
      const t = nodes[r][0].type;
      if (t === runType) runLen++; else { runType = t; runLen = 1; }
      if (runLen >= 4 && r !== eliteA && r !== eliteB) { nodes[r].forEach(n => { n.type = t === 'fight' ? 'event' : 'fight'; }); runType = nodes[r][0].type; runLen = 1; }
    }
    for (let r = rows - 1; r >= 1; r--) {
      const lower = [...nodes[r]].sort((a,b)=>a.x - b.x);
      const upper = [...nodes[r - 1]].sort((a,b)=>a.x - b.x);
      const m = lower.length;
      const n = upper.length;
      for (let i = 0; i < m; i++) {
        const sel = Math.min(n - 1, Math.floor(i * n / m));
        const targetIdx = upper[sel].idx;
        const edges = nodes[r][lower[i].idx].edges || [];
        if (!edges.includes(targetIdx)) edges.push(targetIdx);
        nodes[r][lower[i].idx].edges = edges;
      }
      let lastLi = 0;
      for (let k = 0; k < n; k++) {
        const li = Math.min(m - 1, Math.max(lastLi, Math.floor(k * m / n)));
        const srcIdx = lower[li].idx;
        const dstIdx = upper[k].idx;
        const edges = nodes[r][srcIdx].edges || [];
        if (!edges.includes(dstIdx)) edges.push(dstIdx);
        nodes[r][srcIdx].edges = edges;
        lastLi = li;
      }
    }
    this.tower.nodes = nodes;
    this.tower.pos = { row: -1, idx: null };
  }

  initTowerMapConstrained() {
    const rows = this.tower.rows;
    const nodes = [];
    const bossX = 0.5;
    // 顶层 Boss（居中）
    nodes[0] = [{ row: 0, idx: 0, x: bossX, type: 'boss', edges: [] }];
    // 底层：五个出发点
    const starts = [0.08, 0.25, 0.42, 0.58, 0.75];
    nodes[rows - 1] = starts.map((x, i) => ({ row: rows - 1, idx: i, x, type: 'fight', edges: [] }));
    // 中间各层：3-6 个节点，保证最宽处 ≥ 5
    let widestPlaced = false;
    for (let r = 1; r < rows - 1; r++) {
      let count = randInt(3, 6);
      if (!widestPlaced && r === Math.floor(rows / 2)) { count = Math.max(count, 5); widestPlaced = true; }
      const xs = [];
      const minSep = 0.12;
      while (xs.length < count) {
        const v = 0.06 + Math.random() * 0.88;
        if (xs.every(u => Math.abs(u - v) >= minSep)) xs.push(v);
      }
      xs.sort((a,b)=>a-b);
      const row = xs.map((x, i) => ({ row: r, idx: i, x, type: 'fight', edges: [] }));
      nodes[r] = row;
    }
    // 精英分布：在 [7..9] 与 [14..17] 两个窗口中随机选 2-3 层分布（避免集中在单层）
    const pickRowsInRange = (a, b, cnt) => {
      const pool = [];
      for (let r = a; r <= b; r++) if (r > 0 && r < rows - 1) pool.push(r);
      const sel = [];
      while (sel.length < Math.min(cnt, pool.length)) {
        const i = Math.floor(Math.random() * pool.length);
        const val = pool.splice(i, 1)[0];
        sel.push(val);
      }
      return sel.sort((x,y)=>x-y);
    };
    const eliteRows = [
      ...pickRowsInRange(7, 9, Math.floor(2 + Math.random() * 2)),
      ...pickRowsInRange(14, 17, Math.floor(2 + Math.random() * 2))
    ];
    eliteRows.forEach(er => { nodes[er].forEach(n => n.type = 'elite'); });

    // 休息/商店：在三个 4-5 层的窗口中分布（每层部分节点为休息或商店，避免整层集中）
    const restWindows = [ [4, 8], [10, 14], [16, 19] ];
    restWindows.forEach((rng, idxWin) => {
      const [a, b] = rng;
      for (let r = a; r <= b; r++) {
        if (r <= 0 || r >= rows - 1) continue;
        const rowNodes = nodes[r] || [];
        rowNodes.forEach((n, i) => {
          if (Math.random() < 0.45) {
            n.type = ((idxWin + i) % 2 === 0) ? 'rest' : 'shop';
          }
        });
      }
    });

    // 其它层：30% 事件，70% 战斗（仅对仍为默认战斗的节点生效）
    for (let r = 1; r < rows - 1; r++) {
      const rowNodes = nodes[r] || [];
      rowNodes.forEach(n => {
        if (n.type === 'fight') {
          n.type = Math.random() < 0.4 ? 'event' : 'fight';
        }
      });
    }
    // 约束：不允许两层连续为“整层特殊”（休息/商店/精英），Boss 层除外
    for (let r = 1; r < rows - 1; r++) {
      const prevAllSpecial = (nodes[r - 1] || []).every(n => n.type !== 'fight' && n.type !== 'event' && n.type !== 'boss');
      const curAllSpecial  = (nodes[r]     || []).every(n => n.type !== 'fight' && n.type !== 'event' && n.type !== 'boss');
      if (prevAllSpecial && curAllSpecial) nodes[r].forEach(n => { n.type = 'fight'; });
    }
    // 约束：不得出现连续四层同种“主导类型”（以该层中数量最多的类型判断）
    const dominantType = (row) => {
      const cnt = { fight:0, event:0, rest:0, shop:0, elite:0, boss:0 };
      row.forEach(n => { cnt[n.type] = (cnt[n.type]||0) + 1; });
      let best = 'fight', bestV = -1;
      Object.keys(cnt).forEach(k => { if (cnt[k] > bestV) { bestV = cnt[k]; best = k; } });
      return best;
    };
    let runType = null, runLen = 0;
    for (let r = 1; r < rows - 1; r++) {
      const t = dominantType(nodes[r] || []);
      if (t === runType) runLen++; else { runType = t; runLen = 1; }
      if (runLen >= 4) { nodes[r].forEach(n => { n.type = t === 'fight' ? 'event' : 'fight'; }); runType = dominantType(nodes[r] || []); runLen = 1; }
    }
    // 建立无交叉的边：自下而上保持左右顺序
    for (let r = rows - 1; r >= 1; r--) {
      const lower = [...nodes[r]].sort((a,b)=>a.x - b.x);
      const upper = [...nodes[r - 1]].sort((a,b)=>a.x - b.x);
      const m = lower.length;
      const n = upper.length;
      // 下层到上层：每个下层至少一条边
      for (let i = 0; i < m; i++) {
        const sel = Math.min(n - 1, Math.floor(i * n / m));
        const targetIdx = upper[sel].idx;
        const edges = nodes[r][lower[i].idx].edges || [];
        if (!edges.includes(targetIdx)) edges.push(targetIdx);
        nodes[r][lower[i].idx].edges = edges;
      }
      // 上层至少有一条来自下层的入边
      let lastLi = 0;
      for (let k = 0; k < n; k++) {
        const li = Math.min(m - 1, Math.max(lastLi, Math.floor(k * m / n)));
        const srcIdx = lower[li].idx;
        const dstIdx = upper[k].idx;
        const edges = nodes[r][srcIdx].edges || [];
        if (!edges.includes(dstIdx)) edges.push(dstIdx);
        nodes[r][srcIdx].edges = edges;
        lastLi = li;
      }
    }
    this.tower.nodes = nodes;
    this.tower.pos = { row: -1, idx: null };
  }

  pickNodeType(r) {
    const w = [{ t: 'fight', p: 0.5 }, { t: 'event', p: 0.2 }, { t: 'rest', p: 0.15 }, { t: 'shop', p: 0.15 }];
    let x = Math.random();
    for (const i of w) { if ((x -= i.p) < 0) return i.t; }
    return 'fight';
  }

  renderTowerMap() {
    const container = document.getElementById('towerMap');
    if (!container) return;
    container.innerHTML = '';
    const elMap = new Map();
    const rowGap = 210; // 垂直间隔缩小 150px
    const topPad = 200;
    const bottomPad = 200;
    const totalHeight = topPad + bottomPad + rowGap * Math.max(0, this.tower.rows - 1);
    const mapViewEl = document.getElementById('mapView');
    const minHeight = mapViewEl ? mapViewEl.clientHeight : 0;
    container.style.minHeight = (minHeight > 0 ? minHeight : 0) + 'px';
    container.style.height = Math.max(totalHeight, minHeight) + 'px';
    const rect = container.getBoundingClientRect();
    for (let r = 0; r < this.tower.rows; r++) {
      const rowNodes = this.tower.nodes[r] || [];
      for (let i = 0; i < rowNodes.length; i++) {
        const n = rowNodes[i];
        const el = document.createElement('button');
        el.className = `tower-node node-${n.type}`;
        el.innerHTML = `<div class="icon"></div><div class="label">${this.nodeLabel(n.type)}</div>`;
        el.dataset.row = String(r);
        el.dataset.idx = String(n.idx);
        const available = this.isNodeAvailable(n);
        el.classList.add(available ? 'available' : 'locked');
        el.disabled = !available;
        el.addEventListener('click', () => this.chooseMapNode(n));
        el.addEventListener('mouseenter', () => this.highlightPath(r, n.idx, true));
        el.addEventListener('mouseleave', () => this.highlightPath(r, n.idx, false));
        // 绝对定位：固定行间距 60px
        const yPos = topPad + r * rowGap;
        el.style.left = `${n.x * rect.width}px`;
        el.style.top = `${yPos}px`;
        container.appendChild(el);
        elMap.set(`${r}-${n.idx}`, el);
      }
    }
    this.drawTowerLines(container, elMap);
    // 复原所有已访问节点的 X 贴图（静态）
    if (this.tower.visited && this.tower.visited.length) {
      this.tower.visited.forEach(({ row, idx }) => {
        const el = elMap.get(`${row}-${idx}`);
        if (el) {
          const box = el.getBoundingClientRect();
          const crect = container.getBoundingClientRect();
          const x = box.left - crect.left + box.width / 2;
          const y = box.top - crect.top + box.height / 2;
          const mark = document.createElement('div');
          mark.className = 'map-x static';
          mark.style.left = `${x}px`;
          mark.style.top = `${y}px`;
          container.appendChild(mark);
        }
      });
    }
  }

  drawTowerLines(container, elMap) {
    const rect = container.getBoundingClientRect();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tower-lines');
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.setAttribute('width', String(rect.width));
    svg.setAttribute('height', String(rect.height));
    for (let r = 1; r < this.tower.rows; r++) {
      const rowNodes = this.tower.nodes[r] || [];
      for (let i = 0; i < rowNodes.length; i++) {
        const fromEl = elMap.get(`${r}-${i}`);
        if (!fromEl) continue;
        const fromBox = fromEl.getBoundingClientRect();
        const fx = fromBox.left - rect.left + fromBox.width / 2;
        const fy = fromBox.top - rect.top + fromBox.height / 2;
        const edges = this.tower.nodes[r][i].edges || [];
        edges.forEach(nextLane => {
          const toEl = elMap.get(`${r-1}-${nextLane}`);
          if (!toEl) return;
          const toBox = toEl.getBoundingClientRect();
          const tx = toBox.left - rect.left + toBox.width / 2;
          const ty = toBox.top - rect.top + toBox.height / 2;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', String(fx));
          line.setAttribute('y1', String(fy));
          line.setAttribute('x2', String(tx));
          line.setAttribute('y2', String(ty));
          line.setAttribute('data-from', `${r}-${i}`);
          line.setAttribute('data-to', `${r-1}-${nextLane}`);
          svg.appendChild(line);
        });
      }
    }
    container.appendChild(svg);
  }

  highlightPath(r, l, on) {
    const container = document.getElementById('towerMap');
    const svg = container ? container.querySelector('.tower-lines') : null;
    if (!svg) return;
    let cr = r, cl = l;
    while (cr > 0) {
      const edges = this.tower.nodes[cr][cl].edges || [];
      if (!edges.length) break;
      edges.forEach(t => {
        const sel = svg.querySelector(`line[data-from="${cr}-${cl}"][data-to="${cr-1}-${t}"]`);
        if (sel) sel.classList.toggle('highlight', on);
      });
      const nextIdx = Math.min(...edges);
      cl = nextIdx;
      cr -= 1;
    }
  }

  nodeLabel(t) {
    if (t === 'fight') return '战斗';
    if (t === 'event') return '事件';
    if (t === 'rest') return '休息';
    if (t === 'shop') return '商店';
    if (t === 'elite') return '精英';
    if (t === 'boss') return 'Boss';
    return t;
  }

  nodeIcon(t) {
    if (t === 'fight') return '⚔️';
    if (t === 'event') return '?';
    if (t === 'rest') return '🔥';
    if (t === 'shop') return '🛍️';
    if (t === 'elite') return '💀';
    if (t === 'boss') return '👑';
    return '•';
  }

  isNodeAvailable(n) {
    if (this.tower.pos.row === -1) return n.row === this.tower.rows - 1;
    const prev = this.tower.nodes[this.tower.pos.row][this.tower.pos.idx];
    return n.row === this.tower.pos.row - 1 && prev.edges.includes(n.idx);
  }

  chooseMapNode(n) {
    if (this.isMapTransitioning) return;
    this.isMapTransitioning = true;

    this.tower.pos = { row: n.row, idx: n.idx };
    // 点击效果：在节点位置落下红色 X
    try {
      const tower = document.getElementById('towerMap');
      const el = tower ? tower.querySelector(`.tower-node[data-row="${n.row}"][data-idx="${n.idx}"]`) : null;
      const box = el ? el.getBoundingClientRect() : null;
      const crect = tower ? tower.getBoundingClientRect() : null;
      if (box && crect && tower) {
        const x = box.left - crect.left + box.width / 2;
        const y = box.top - crect.top + box.height / 2;
        const mark = document.createElement('div');
        mark.className = 'map-x';
        mark.style.left = `${x}px`;
        mark.style.top = `${y}px`;
        // 不移除旧标记，允许多个标记共存
        tower.appendChild(mark);
        // 尘土粒子效果
        const pCount = 8;
        for (let i = 0; i < pCount; i++) {
          const d = document.createElement('div');
          d.className = 'map-dust';
          d.style.left = `${x}px`;
          d.style.top = `${y}px`;
          const ang = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 70;
          d.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
          d.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
          tower.appendChild(d);
          setTimeout(() => d.remove(), 500);
        }

        if (!this.tower.visited) this.tower.visited = [];
        // 避免重复添加同一位置
        const exists = this.tower.visited.find(v => v.row === n.row && v.idx === n.idx);
        if (!exists) {
          this.tower.visited.push({ row: n.row, idx: n.idx });
        }
        setTimeout(() => { if (mark && mark.parentNode) mark.classList.add('static'); }, 520);
      }
    } catch(_) {}
    const proceed = () => {
      this.isMapTransitioning = false;
      if (n.type === 'fight' || n.type === 'elite' || n.type === 'boss') {
        this.playCue('sound/zhandoukaishi.mp3');
        this.fadeOutBgm(3000);
        this.sceneTransition(() => {
          this.showMap(false);
          this.startBattle(n.type);
        }, 1000);
        setTimeout(() => {
          this.playBgm('music/zhandou.mp3', { loop: true, volume: 1 });
        }, 3000);
      } else if (n.type === 'rest') {
        this.openRestCampfire();
      } else if (n.type === 'shop') {
        alert('商店占位');
      } else if (n.type === 'event') {
        this.triggerEvent();
      }
      if (document.getElementById('mapView') && !document.getElementById('mapView').classList.contains('hidden')) {
        this.renderTowerMap();
      }
    };
    // 略微延迟以便红色 X 动画可见
    setTimeout(proceed, 360);
  }

  enemyDraw(n = 1) {
    for (let i = 0; i < n; i++) {
      const c = this.enemyDrawPile.shift();
      if (c) this.enemyDiscardPile.push(c);
      // 敌人抽牌简易动画（从头像左侧弹出）
      const av = document.getElementById('enemyAvatar');
      if (av) {
        const r = av.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost enemy';
        ghost.style.left = `${r.left + 10}px`;
        ghost.style.top = `${r.top + r.height / 2}px`;
        ghost.style.setProperty('--ghost-dur', '380ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(${r.left + r.width / 2}px, ${r.top - 12}px)`;
        });
        setTimeout(() => ghost.remove(), 420);
      }
    }
  }

  stealFromEnemyDeck() {
    const c = this.enemyDrawPile.shift();
    if (c) {
      const enemyAv = document.getElementById('enemyAvatar');
      const handEl = document.getElementById('hand');
      if (enemyAv && handEl) {
        const src = enemyAv.getBoundingClientRect();
        const dst = handEl.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost enemy';
        const sx = src.left + src.width / 2;
        const sy = src.top + src.height / 2;
        const ex = dst.left + dst.width / 2;
        const ey = dst.top + dst.height / 2;
        ghost.style.left = `${sx}px`;
        ghost.style.top = `${sy}px`;
        ghost.style.setProperty('--ghost-dur', '500ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
        });
        setTimeout(() => ghost.remove(), 540);
      }
      c.__justDrawn = true;
      this.hand.push(c);
      Logger.info('Stole enemy card', { cardId: c.id, text: c.text, type: c.type });
      this.updateUI();
    }
  }

  // 从弃牌堆抽牌（顶部）
  drawFromDiscard(n = 1) {
    const handEl = document.getElementById('hand');
    const discardEl = document.getElementById('discardStack');
    const handRect = handEl ? handEl.getBoundingClientRect() : null;
    const discardRect = discardEl ? discardEl.getBoundingClientRect() : null;
    for (let i = 0; i < n; i++) {
      const card = this.discardPile.pop();
      if (!card) break;
      if (handRect && discardRect) {
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost player';
        const sx = discardRect.left + discardRect.width / 2;
        const sy = discardRect.top + discardRect.height / 2;
        const finalTotal = this.hand.length + 1;
        const targetIdx = this.hand.length;
        const spacing = 60;
        const offset = (targetIdx - (finalTotal - 1) / 2) * spacing;
        const ex = handRect.left + handRect.width / 2 + offset;
        const ey = handRect.top + handRect.height - 80;
        ghost.style.left = `${sx}px`;
        ghost.style.top = `${sy}px`;
        ghost.style.setProperty('--ghost-dur', '480ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
        });
        setTimeout(() => ghost.remove(), 520);
      }
      card.__justDrawn = true;
      this.hand.push(card);
      this.updateUI();
    }
  }

  // 从牌堆随机抽牌（不足则洗入弃牌补充）
  drawRandomFromDeck(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.drawPile.length === 0) {
        this.drawPile = shuffle([...this.discardPile]);
        this.discardPile = [];
      }
      if (this.drawPile.length === 0) break;
      const idx = Math.floor(Math.random() * this.drawPile.length);
      const card = this.drawPile.splice(idx, 1)[0];
      if (card) {
        // 动画：从抽牌堆飞向手牌
        const drawEl = document.getElementById('drawStack');
        const handEl = document.getElementById('hand');
        if (drawEl && handEl) {
          const src = drawEl.getBoundingClientRect();
          const dst = handEl.getBoundingClientRect();
          const ghost = document.createElement('div');
          ghost.className = 'deal-ghost player';
          const sx = src.left + src.width / 2;
          const sy = src.top + src.height / 2;
          const finalTotal = this.hand.length + 1;
          const targetIdx = this.hand.length;
          const spacing = 60;
          const offset = (targetIdx - (finalTotal - 1) / 2) * spacing;
          const ex = dst.left + dst.width / 2 + offset;
          const ey = dst.top + dst.height - 80;
          ghost.style.left = `${sx}px`;
          ghost.style.top = `${sy}px`;
          ghost.style.setProperty('--ghost-dur', '480ms');
          document.body.appendChild(ghost);
          requestAnimationFrame(() => {
            ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
          });
          setTimeout(() => ghost.remove(), 520);
        }
        card.__justDrawn = true;
        this.hand.push(card);
      }
    }
    this.updateUI();
  }

  async startBattle(nodeType = 'fight') {
    this.currentBattleType = nodeType;
    let maxHp;
    let name;
    if (nodeType === 'elite') { maxHp = randInt(60, 120); name = '精英敌人'; }
    else if (nodeType === 'boss') { maxHp = CONFIG.enemyBaseHp; name = 'Boss'; }
    else { maxHp = randInt(20, 60); name = '敌人'; }
    this.enemy = new Enemy(name, maxHp);
    const enemyAvatar = document.getElementById('enemyAvatar');
    if (enemyAvatar) {
      const img = nodeType === 'boss' ? 'styles/enemy/player ab.png' : `styles/enemy/${ENEMY_IMAGE_FILES[Math.floor(Math.random() * ENEMY_IMAGE_FILES.length)]}`;
      enemyAvatar.style.background = `url('${img}') center/contain no-repeat`;
      enemyAvatar.style.border = 'none';
      enemyAvatar.style.backgroundColor = 'transparent';
    }
    if (!this.hasStarted) { this.player.hp = 70; this.hasStarted = true; }
    this.player.block = 0;
    this.player.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
    if (this.enemy) this.enemy.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
    this.energy = CONFIG.energyPerTurn;
    this.turn = 1;
    this.nextTurnEnergyPenalty = 0;
    this.nextTurnDrawPenalty = 0;
    this.currentCombo = { prefix: null, root: null, suffix: null };

    this.buildStarterDeck();
    this.buildEnemyDeck();
    this.drawPile = [...this.deck];
    this.discardPile = [];
    this.hand = [];
    this.enemy.rollIntent();
    this.updateUI();
    Logger.info('Battle started; switching view then dealing');
    await this.dealCards(CONFIG.handSize, 800);
  }

  endBattle(victory) {
    this.fadeOutBgm(3000);
    this._pendingMapBgmDelayMs = 3000;
    if (victory) {
      const isElite = this.currentBattleType === 'elite';
      const min = isElite ? 20 : 12;
      const max = isElite ? 40 : 27;
      const goldReward = randInt(min, max);
      this.player.gold = (this.player.gold || 0) + goldReward;
    }
    this.player.block = 0;
    // 清除战斗增益/减益（力量/坚韧保留到战斗结束即清空）
    this.player.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
    // 一局结束：清空组合槽
    this.currentCombo = { prefix: null, root: null, suffix: null };
    while (this.comboZone.length) this.comboZone.shift();
    this.renderComboSlots();
    this.scrollToNextOnMap = true;
    this.sceneTransition(() => { this.showMap(true); }, 1000);
    this.updateUI();
  }

  handleDeath() {
    if (this._deathAnimating) return;
    this._deathAnimating = true;
    this.fadeOutBgm(2000);
    const overlay = document.createElement('div');
    overlay.className = 'death-overlay';
    document.body.appendChild(overlay);
    const sigil = document.createElement('div');
    sigil.className = 'death-sigil';
    overlay.appendChild(sigil);
    requestAnimationFrame(() => { overlay.classList.add('darken'); });
    const unlockAt = Date.now() + 4500;
    const onClick = (e) => {
      if (Date.now() < unlockAt) return;
      overlay.removeEventListener('click', onClick);
      overlay.classList.add('to-black');
      let done = false;
      const after = () => {
        if (done) return; done = true;
        setTimeout(() => {
          overlay.remove();
          this.enemy = null;
          this.player.block = 0;
          this.player.statuses = { weak: 0, frail: 0, strength: 0, toughness: 0 };
          this.player.hp = this.player.maxHp;
          this.energy = CONFIG.energyPerTurn;
          this.turn = 1;
          this.nextTurnEnergyPenalty = 0;
          this.nextTurnDrawPenalty = 0;
          this.reactionStatus = { active: false, turnsRemaining: 0, retaliateDamage: 20, hasTriggered: false, applyPenaltyAtStart: false };
          this.deck = [];
          this.drawPile = [];
          this.discardPile = [];
          this.hand = [];
          this.currentCombo = { prefix: null, root: null, suffix: null };
          while (this.comboZone.length) this.comboZone.shift();
          this.renderComboSlots();
          this.encounteredEvents = [];
          this.didIntroScroll = false;
          this.scrollToNextOnMap = false;
          if (this.tower) this.tower.visited = [];
          this.initTowerMapConstrained();
          try {
            initKaishi(document.body, () => { this.showMap(true); }, { autoStart: true, skipVideo: true });
          } catch (_) {
            this.sceneTransition(() => { this.showMap(true); }, 800);
          }
          this.updateUI();
          this._deathAnimating = false;
        }, 1000);
      };
      try {
        setTimeout(() => { sigil.style.transition = 'opacity 600ms ease-in'; sigil.style.opacity = '0'; }, 600);
        const onEnd = () => { sigil.removeEventListener('transitionend', onEnd); after(); };
        sigil.addEventListener('transitionend', onEnd);
        setTimeout(after, 1800);
      } catch (_) {
        setTimeout(after, 1800);
      }
    };
    overlay.addEventListener('click', onClick);
  }

  async dealCards(n = 1, totalMs = 1000) {
    const handEl = document.getElementById('hand');
    const drawEl = document.getElementById('drawStack');
    if (!handEl || !drawEl) return;
    // 先用一张牌背贴图从牌堆中心飞到手牌中心
    const src = drawEl.getBoundingClientRect();
    const dst = handEl.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'deal-ghost player';
    const sx = src.left + src.width / 2;
    const sy = src.top + src.height / 2;
    const hx = dst.left + dst.width / 2;
    const hy = dst.top + dst.height / 2;
    ghost.style.left = `${sx}px`;
    ghost.style.top = `${sy}px`;
    const ghostDur = Math.min(800, Math.max(360, totalMs - 420));
    ghost.style.setProperty('--ghost-dur', `${ghostDur}ms`);
    ghost.style.transition = `transform ${ghostDur}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 280ms ease-out`;
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(-50%,-50%) translate(${hx - sx}px, ${hy - sy}px)`;
    });
    await delay(ghostDur + 40);
    ghost.remove();

    // 抽取 n 张，直到抽够或牌堆耗尽；在散开之前手牌区保持无新牌
    const newCards = [];
    for (let i = 0; i < n; i++) {
      if (this.drawPile.length === 0) {
        this.drawPile = shuffle([...this.discardPile]);
        this.discardPile = [];
      }
      const card = this.drawPile.shift();
      if (!card) break;
      card.__justDrawn = true;
      newCards.push(card);
    }
    // 一次性加入并渲染
    this.hand.push(...newCards);
    this.updateUI();

    // 散开动画：从手牌中心同时向各自位置展开
    const handCenterX = hx;
    const handCenterY = hy;
    const duration = Math.max(420, Math.min(820, totalMs - ghostDur));
    newCards.forEach((c, i) => {
      const el = handEl.querySelector(`[data-card-id="${c.id}"]`);
      if (!el) return;
      // 避免与内置 dealFan 冲突
      el.classList.remove('card-deal');
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = handCenterX - cx;
      const dy = handCenterY - cy;
      const stagger = Math.min(60, i * 18);
      el.style.transition = `transform ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 240ms ease-out`;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(var(--deal-rot, 0deg))`;
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = `translate(0, 0) rotate(var(--deal-rot, 0deg))`;
      }, stagger);
    });
    await delay(duration + 180);
    newCards.forEach(c => {
      const el = handEl.querySelector(`[data-card-id="${c.id}"]`);
      if (el) {
        el.style.transition = '';
        el.style.transform = '';
      }
      delete c.__justDrawn;
    });
  }

  playCard(cardId) {
    const idx = this.hand.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const card = this.hand[idx];
    if (this.energy < card.cost) {
      alert('能量不足！');
      return;
    }
    this.energy -= card.cost;

    if (card.type === 'linked') {
      // 打出组合组卡：在舞台结算 combo 效果，并将组卡移入弃牌堆
      this.commitLinkCombo(card.comboMatch);
      const handEl = document.getElementById('hand');
      const cardEl = handEl ? handEl.querySelector(`[data-card-id="${card.id}"]`) : null;
      const discardStack = document.getElementById('discardStack');
      if (cardEl && discardStack) {
        const src = cardEl.getBoundingClientRect();
        const dst = discardStack.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost player';
        const sx = src.left + src.width / 2;
        const sy = src.top + src.height / 2;
        const ex = dst.left + dst.width / 2;
        const ey = dst.top + dst.height / 2;
        ghost.style.left = `${sx}px`;
        ghost.style.top = `${sy}px`;
        ghost.style.setProperty('--ghost-dur', '480ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
        });
        setTimeout(() => ghost.remove(), 520);
      }
      this.hand.splice(idx, 1);
      this.discardPile.push(card);
      this.updateUI();
      return;
    }

    // 出牌动画：仅在造成伤害（攻击）时显示
    const handEl = document.getElementById('hand');
    const cardEl = handEl ? handEl.querySelector(`[data-card-id="${card.id}"]`) : null;
    // 直接使用的牌不进入组合槽，不累积组合状态（仅拖拽进槽才累积）

    // 出牌效果（按设定）
    let consumedDouble = false;
    if (card.type === 'prefix') {
      if (card.morphemeId === 're') {
        // re：随机抽牌（从牌堆随机）——不触发翻倍
        for (let i = 0; i < 1; i++) this.drawRandomFromDeck(1);
      } else if (card.morphemeId === 'con') {
        // con：抽一张牌——不触发翻倍
        this.dealCards(1, 600);
      } else {
        // 其他前缀：小幅能量回复——不触发翻倍
        this.changeEnergy(1);
      }
      // over：设置下一次「非组合」效果翻倍（限定 struct/ion/power）
      if (card.morphemeId === 'over') {
        this.nextEffectDouble = true;
      }
  } else if (card.type === 'root') {
    if (card.morphemeId === 'port') {
        // port：抽 2 张普通牌（若抽到组合牌则仅 1 张）。当前牌堆仅含普通牌，因此抽 2 张。
        this.dealCards(2, 600);
    } else if (card.morphemeId === 'struct') {
        // struct：视觉化防御动画（不显示箭头），粒子汇入血槽后再加防御
        const handEl = document.getElementById('hand');
        const cardEl = handEl ? handEl.querySelector(`[data-card-id="${card.id}"]`) : null;
        const gain = (this.nextEffectDouble ? 4 : 2);
        if (this.nextEffectDouble) consumedDouble = true;
        this.animateDefenseUse(cardEl, gain).then(() => {
          // 将牌移动到弃牌堆
          const discardStack = document.getElementById('discardStack');
          if (cardEl && discardStack) {
            const src = cardEl.getBoundingClientRect();
            const dst = discardStack.getBoundingClientRect();
            const ghost = document.createElement('div');
            ghost.className = 'deal-ghost player';
            const sx = src.left + src.width / 2;
            const sy = src.top + src.height / 2;
            const ex = dst.left + dst.width / 2;
            const ey = dst.top + dst.height / 2;
            ghost.style.left = `${sx}px`;
            ghost.style.top = `${sy}px`;
            ghost.style.setProperty('--ghost-dur', '480ms');
            document.body.appendChild(ghost);
            requestAnimationFrame(() => {
              ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
            });
            setTimeout(() => ghost.remove(), 520);
          }
        });
      } else if (card.morphemeId === 'act') {
        const amount = this.nextEffectDouble ? 10 : 5;
        if (cardEl) {
          cardEl.classList.add('fly-to-enemy');
          const removeAnim = () => {
            cardEl.classList.remove('fly-to-enemy');
            cardEl.removeEventListener('animationend', removeAnim);
          };
          cardEl.addEventListener('animationend', removeAnim);
        }
        this.dealDamage(amount);
        if (this.nextEffectDouble) consumedDouble = true;
      } else {
        // 其他词根：基础伤害——不触发翻倍
        if (cardEl) {
          cardEl.classList.add('fly-to-enemy');
          const removeAnim = () => {
            cardEl.classList.remove('fly-to-enemy');
            cardEl.removeEventListener('animationend', removeAnim);
          };
          cardEl.addEventListener('animationend', removeAnim);
        }
        this.dealDamage(CONFIG.baseDamage);
      }
    } else if (card.type === 'suffix') {
      if (card.morphemeId === 'able') {
        // able：随机能量 -1 到 +2——不触发翻倍
        const base = randInt(-1, 2);
        this.changeEnergy(base);
      } else if (card.morphemeId === 'ion') {
        // ion：回复 1 点能量；如被 over 标记，则翻倍到 2
        this.changeEnergy(this.nextEffectDouble ? 2 : 1);
        if (this.nextEffectDouble) consumedDouble = true;
      } else if (card.morphemeId === 'ure') {
        // ure：回复 1 点能量——不触发翻倍
        this.changeEnergy(1);
      } else if (card.morphemeId === 'power') {
        // power 后缀：随机 3-9 伤害；如被 over 标记，则翻倍到 6-18
        const base = randInt(3, 9);
        const amount = this.nextEffectDouble ? base * 2 : base;
        this.dealDamage(amount);
        if (this.nextEffectDouble) consumedDouble = true;
      } else if (card.morphemeId === 'see') {
        // see：预览敌人下一回合意图——不触发翻倍
        this.peekEnemyIntents(1);
      }
    }

    const discardStack = document.getElementById('discardStack');
    if (card.morphemeId !== 'struct') {
      if (cardEl && discardStack) {
        const src = cardEl.getBoundingClientRect();
        const dst = discardStack.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost player';
        const sx = src.left + src.width / 2;
        const sy = src.top + src.height / 2;
        const ex = dst.left + dst.width / 2;
        const ey = dst.top + dst.height / 2;
        ghost.style.left = `${sx}px`;
        ghost.style.top = `${sy}px`;
        ghost.style.setProperty('--ghost-dur', '480ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transform = `translate(-50%,-50%) translate(${ex - sx}px, ${ey - sy}px)`;
        });
        setTimeout(() => ghost.remove(), 520);
      }
    }
    this.hand.splice(idx, 1);
    this.discardPile.push(card);
    Logger.info('Card played', { cardId: card.id, type: card.type, cost: card.cost });

    // 检测组合是否形成有效单词
    // 翻倍效果仅对下一次「非组合」的 struct/ion/power 生效
    if (consumedDouble) this.nextEffectDouble = false;
    this.checkCombo();
    this.updateUI();
    this.renderComboSlots();
  }

  // 是否为需要拖到敌人上使用的“敌方目标牌”（攻击或对敌特殊效果）
  isEnemyTargeting(card) {
    if (!card) return false;
    if (card.type === 'linked' && card.comboMatch) {
      const w = card.comboMatch.word;
      // 需要目标的组合：造成直接伤害或对敌特殊效果
      const need = ['action','conact','overpower'];
      return need.includes(w);
    }
    if (card.type === 'root') {
      // struct/act 为防御，port 为抽牌，不需目标；其余词根默认视为攻击或对敌效果，需要目标
      return card.morphemeId !== 'struct' && card.morphemeId !== 'act' && card.morphemeId !== 'port';
    }
    // power/see 属于对敌效果，需要拖到敌人
    if ((card.type === 'prefix' || card.type === 'suffix') && (card.morphemeId === 'power' || card.morphemeId === 'see')) {
      return true;
    }
    return false; // 其他前缀/后缀默认可在舞台通用区域使用
  }

  // 拖到槽位的出牌：移入组合暂存区，可拖回手牌
  playCardToSlot(cardId) {
    const idx = this.hand.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const card = this.hand[idx];
    // 若该类型的槽中已有卡，先归还到手牌（不吞卡）
    const existingIdx = this.comboZone.findIndex(c => c.type === card.type);
    if (existingIdx !== -1) {
      const prev = this.comboZone.splice(existingIdx, 1)[0];
      if (prev) this.hand.push(prev);
    }
    // 累积组合状态（不消耗能量、不触发即时效果，仅暂存）
    this.currentCombo[card.type] = card.morphemeId;

    // 移入组合暂存区，不进弃牌堆
    const staged = this.hand.splice(idx, 1)[0];
    this.comboZone.push(staged);
    this.updateUI();
    this.renderComboSlots();
    // 检测组合
    this.checkCombo();
  }

  checkCombo() {
    // 特例：支持无词根的两件套组合「over- + -see」=> oversee（预测 5 回合，10% 概率失败）
    if (!this.currentCombo.root && this.currentCombo.prefix === 'over' && this.currentCombo.suffix === 'see') {
      const usedCards = [];
      ['prefix','suffix'].forEach(t => {
        const id = this.currentCombo[t];
        if (id) {
          const idx = this.comboZone.findIndex(c => c.type === t && c.morphemeId === id);
          if (idx !== -1) usedCards.push(this.comboZone[idx]);
        }
      });
      // 统一组合能量消耗为 1 点
      const totalCost = 1;
      if (this.energy < totalCost) {
        alert(`能量不足，组合需要 ${totalCost} 点能量`);
        return;
      }
      this.energy -= totalCost;

      const fail = Math.random() < 0.10;
      if (fail) {
        const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
        createDamageFloat(`失败`, rect.left + rect.width / 2, rect.top + 30);
        // 组合失败提示
        const slots = document.getElementById('comboSlots');
        if (slots) {
          const toast = document.createElement('div');
          toast.className = 'combo-error-toast';
          toast.textContent = '组合失败';
          toast.style.position = 'absolute';
          toast.style.left = '50%';
          toast.style.top = '0';
          toast.style.transform = 'translateX(-50%) translateY(-8px)';
          toast.style.background = 'rgba(220,0,0,0.85)';
          toast.style.color = '#fff';
          toast.style.padding = '6px 10px';
          toast.style.borderRadius = '6px';
          toast.style.fontSize = '14px';
          toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          toast.style.zIndex = '1000';
          slots.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        }
      } else {
        this.peekEnemyIntents(5);
        const panel = document.getElementById('comboPanel');
        if (panel) {
          panel.querySelector('.combo-word').textContent = 'oversee';
          panel.querySelector('.combo-meaning').textContent = '监督/俯瞰；预告敌人 5 回合意图（over + see）';
          panel.classList.remove('hidden');
          playAhaSound();
          setTimeout(() => panel.classList.add('hidden'), 1800);
        }
        this.stats.wordsFormed += 1;
        this.saveStats();
      }

      // 复位与收尾（成功或失败均消耗卡牌）
      this.currentCombo = { prefix: null, root: null, suffix: null };
      while (this.comboZone.length) {
        this.discardPile.push(this.comboZone.shift());
      }
      this.renderComboSlots();
      this.updateUI();
      return;
    }
    // 特例：支持无词根的两件套组合「over- + -power」=> overpower
    if (!this.currentCombo.root && this.currentCombo.prefix === 'over' && this.currentCombo.suffix === 'power') {
      // 结算能量：仅前缀与后缀之和
      const usedCards = [];
      ['prefix','suffix'].forEach(t => {
        const id = this.currentCombo[t];
        if (id) {
          const idx = this.comboZone.findIndex(c => c.type === t && c.morphemeId === id);
          if (idx !== -1) usedCards.push(this.comboZone[idx]);
        }
      });
      // 统一组合能量消耗为 1 点
      const totalCost = 1;
      if (this.energy < totalCost) {
        alert(`能量不足，组合需要 ${totalCost} 点能量`);
        return;
      }
      this.energy -= totalCost;
      // 效果：造成固定 20 点伤害，10% 概率失败
      const fail = Math.random() < 0.10;
      if (fail) {
        const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
        createDamageFloat(`失败`, rect.left + rect.width / 2, rect.top + 30);
        // 组合失败提示
        const slots = document.getElementById('comboSlots');
        if (slots) {
          const toast = document.createElement('div');
          toast.className = 'combo-error-toast';
          toast.textContent = '组合失败';
          toast.style.position = 'absolute';
          toast.style.left = '50%';
          toast.style.top = '0';
          toast.style.transform = 'translateX(-50%) translateY(-8px)';
          toast.style.background = 'rgba(220,0,0,0.85)';
          toast.style.color = '#fff';
          toast.style.padding = '6px 10px';
          toast.style.borderRadius = '6px';
          toast.style.fontSize = '14px';
          toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          toast.style.zIndex = '1000';
          slots.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        }
      } else {
        this.dealDamage(20, true);
        // 教育反馈：显示单词与含义
        const panel = document.getElementById('comboPanel');
        if (panel) {
          panel.querySelector('.combo-word').textContent = 'overpower';
          panel.querySelector('.combo-meaning').textContent = '以强力压制；造成 20 伤害（10% 失败）';
          panel.classList.remove('hidden');
          playAhaSound();
          setTimeout(() => panel.classList.add('hidden'), 1800);
        }
        this.stats.wordsFormed += 1;
        this.saveStats();
      }
      this.currentCombo = { prefix: null, root: null, suffix: null };
      while (this.comboZone.length) {
        this.discardPile.push(this.comboZone.shift());
      }
      this.renderComboSlots();
      this.updateUI();
      return;
    }
    if (!this.currentCombo.root) return; // 通常组合至少需要词根
    const match = WORDS.find(w => (
      (w.prefix ?? null) === (this.currentCombo.prefix ?? null) &&
      w.root === this.currentCombo.root &&
      (w.suffix ?? null) === (this.currentCombo.suffix ?? null)
    ));
    if (!match) {
      const hasTwoParts = !!(this.currentCombo.root && (this.currentCombo.prefix || this.currentCombo.suffix));
      const partialOk = WORDS.some(w => (
        w.root === this.currentCombo.root &&
        (this.currentCombo.prefix == null || w.prefix === this.currentCombo.prefix) &&
        (this.currentCombo.suffix == null || w.suffix === this.currentCombo.suffix)
      ));
      if (hasTwoParts && !partialOk) {
        const slots = document.getElementById('comboSlots');
        if (slots) {
          const toast = document.createElement('div');
          toast.className = 'combo-error-toast';
          toast.textContent = '组合错误';
          toast.style.position = 'absolute';
          toast.style.left = '50%';
          toast.style.top = '0';
          toast.style.transform = 'translateX(-50%) translateY(-8px)';
          toast.style.background = 'rgba(220,0,0,0.85)';
          toast.style.color = '#fff';
          toast.style.padding = '6px 10px';
          toast.style.borderRadius = '6px';
          toast.style.fontSize = '14px';
          toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          toast.style.zIndex = '1000';
          slots.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        }
        Logger.info('组合错误：无匹配单词', { combo: this.currentCombo });
      }
      this.renderComboSlots();
      return;
    }
    // 结算能量：统一所有组合消耗 1 点（若不足则阻止组合）
    const usedCards = [];
    ['prefix','root','suffix'].forEach(t => {
      const id = this.currentCombo[t];
      if (id) {
        const idx = this.comboZone.findIndex(c => c.type === t && c.morphemeId === id);
        if (idx !== -1) usedCards.push(this.comboZone[idx]);
      }
    });
    const totalCost = 1;
    if (this.energy < totalCost) {
      alert(`能量不足，组合需要 ${totalCost} 点能量`);
      return;
    }
    this.energy -= totalCost;
    // 组合效果：按设定覆盖默认伤害
    let handled = false;
    switch (match.word) {
      case 'report':
        this.openDiscardPicker(2, () => {});
        handled = true;
        break;
      case 'portable':
        // portable：按词典伤害值结算（与词典显示一致）
        this.dealDamage(match.damage, true);
        handled = true;
        break;
      case 'struction':
        this.animateDefenseFromSlots(5);
        handled = true;
        break;
      case 'structure':
        this.animateDefenseFromSlots(5);
        handled = true;
        break;
      case 'saturation':
        this.animateDefenseFromSlots(5);
        handled = true;
        break;
      case 'portion':
        // 查看牌堆顶 5 张，选 1 入手，剩余弃；副作用：下回合少抽 1 张
        this.openDrawPeekPicker(5, () => {});
        handled = true;
        break;
      case 'action':
        // action：固定造成 15 伤害
        this.dealDamage(15, true);
        handled = true;
        break;
      case 'reaction':
        // 在接下来两回合内若玩家受到伤害则对敌造成 20；否则第三回合扣 1 能量
        this.reactionStatus.active = true;
        this.reactionStatus.turnsRemaining = 2;
        this.reactionStatus.hasTriggered = false;
        this.reactionStatus.applyPenaltyAtStart = false;
        handled = true;
        break;
      case 'conact':
        this.dealDamage(12, true);
        this.changeEnergy(1);
        handled = true;
        break;
      case 'overstruct':
        this.animateDefenseFromSlots(8);
        this.nextTurnDrawPenalty = (this.nextTurnDrawPenalty || 0) - 1;
        handled = true;
        break;
      default:
        break;
    }
    if (!handled) {
      const dmg = match.damage + CONFIG.comboMultiplier * CONFIG.baseDamage;
      this.dealDamage(dmg, true);
    }

    // 教育反馈：显示完整单词和含义
    const panel = document.getElementById('comboPanel');
    panel.querySelector('.combo-word').textContent = `${match.word}`;
    const effectText = match.word === 'report' ? '从弃牌堆抽回 2 张' : `${match.meaning}`;
    panel.querySelector('.combo-meaning').textContent = effectText;
    panel.classList.remove('hidden');
    playAhaSound();

    // 闪光特效占位
    const fx = document.createElement('div');
    fx.className = 'combo-flash';
    document.getElementById('battleArea').appendChild(fx);
    setTimeout(() => fx.remove(), 650);
    setTimeout(() => panel.classList.add('hidden'), 1800);

    // 记录进度
    this.stats.wordsFormed += 1;
    this.saveStats();

    // 重置组合状态
    this.currentCombo = { prefix: null, root: null, suffix: null };
    // 组合成功：槽位中的牌直接消失（进入弃牌堆）
    const discardEl = document.getElementById('discardStack');
    const discardRect = discardEl ? discardEl.getBoundingClientRect() : null;
    const rootRect = document.querySelector('#slotRoot .slot-content')?.getBoundingClientRect() || null;
    const suffixRect = document.querySelector('#slotSuffix .slot-content')?.getBoundingClientRect() || null;
    if (discardRect) {
      this.comboZone.forEach(c => {
        const fromRect = (c.type === 'suffix' ? suffixRect : rootRect);
        if (!fromRect) return;
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost player';
        ghost.style.left = `${fromRect.left + fromRect.width / 2}px`;
        ghost.style.top = `${fromRect.top + fromRect.height / 2}px`;
        ghost.style.setProperty('--ghost-dur', '480ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          const dx = (discardRect.left + discardRect.width / 2) - (fromRect.left + fromRect.width / 2);
          const dy = (discardRect.top + discardRect.height / 2) - (fromRect.top + fromRect.height / 2);
          ghost.style.transform = `translate(-50%,-50%) translate(${dx}px, ${dy}px)`;
        });
        setTimeout(() => ghost.remove(), 520);
      });
    }
    while (this.comboZone.length) {
      this.discardPile.push(this.comboZone.shift());
    }
    this.renderComboSlots();
    this.updateUI();
  }

  // 弃牌选择界面：供 report 组合使用
  openDiscardPicker(count = 1, onDone) {
    const modal = document.getElementById('discardPicker');
    const list = document.getElementById('discardList');
    const btnClose = document.getElementById('discardClose');
    const btnCancelIcon = document.getElementById('discardPickerCancelIcon');
    if (!modal || !list) {
      alert('界面缺失：discardPicker');
      return;
    }
    // 遮罩点击关闭（只绑定一次）
    if (!modal.__overlayBound) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
      modal.__overlayBound = true;
    }
    if (this.discardPile.length === 0) {
      alert('弃牌堆为空');
      return;
    }
    const titleEl = modal.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = `从弃牌堆选择：普通牌最多 ${count} 张；或组合牌 1 张`;
    let selected = 0;
    let pickMode = null; // 'normal' 或 'linked'
    const rebuild = () => {
      list.innerHTML = '';
      this.discardPile.forEach(card => {
        const isLinked = card.type === 'linked';
        const clickable = (
          pickMode == null ||
          (pickMode === 'normal' && !isLinked) ||
          (pickMode === 'linked' && isLinked && selected < 1)
        );
        const tile = this.makeCardTile(card, clickable ? () => {
          // 选择限制：普通牌最多 count 张；组合牌最多 1 张；不可混选
          const i = this.discardPile.findIndex(c => c.id === card.id);
          if (i !== -1) {
            const picked = this.discardPile.splice(i, 1)[0];
            picked.__justDrawn = true;
            this.hand.push(picked);
            this.updateUI();
            selected++;
            if (pickMode == null) pickMode = isLinked ? 'linked' : 'normal';
          }
          const maxSel = pickMode === 'linked' ? 1 : count;
          if (selected >= maxSel || this.discardPile.length === 0) {
            modal.classList.add('hidden');
            if (btnClose) btnClose.onclick = null;
            if (onDone) onDone();
          } else {
            rebuild();
          }
        } : undefined);
        if (!clickable) tile.style.opacity = '0.6';
        list.appendChild(tile);
      });
    };
    rebuild();
    modal.classList.remove('hidden');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancelIcon) btnCancelIcon.onclick = () => modal.classList.add('hidden');
  }

  // 弃牌堆查看（只读）：供玩家点击右下角入口查看历史弃牌
  openDiscardViewer() {
    this.openStackViewer('discard');
  }

  openStackViewer(which = 'discard') {
    const modal = document.getElementById('discardViewer');
    const list = document.getElementById('discardViewerList');
    const btnClose = document.getElementById('discardViewerClose');
    const btnCancelIcon = document.getElementById('discardViewerCancelIcon');
    const titleEl = modal ? modal.querySelector('.modal-title') : null;
    if (!modal || !list) {
      alert('界面缺失：discardViewer');
      return;
    }
    if (!modal.__overlayBound) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
      modal.__overlayBound = true;
    }
    const typeOrder = { prefix: 0, root: 1, suffix: 2 };
    const cards = which === 'draw' ? this.drawPile : this.discardPile;
    list.innerHTML = '';
    if (!cards || cards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = which === 'draw' ? '牌堆为空' : '弃牌堆为空';
      list.appendChild(empty);
    } else {
      const sorted = [...cards].sort((a, b) => {
        const ta = typeOrder[a.type] ?? 9;
        const tb = typeOrder[b.type] ?? 9;
        if (ta !== tb) return ta - tb;
        const xa = (a.text || '').toLowerCase();
        const xb = (b.text || '').toLowerCase();
        return xa.localeCompare(xb);
      });
      sorted.forEach(card => {
        const tile = this.makeCardTile(card);
        list.appendChild(tile);
      });
    }
    if (titleEl) titleEl.textContent = which === 'draw' ? '牌堆（固定排序预览）' : '弃牌堆';
    modal.classList.remove('hidden');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancelIcon) btnCancelIcon.onclick = () => modal.classList.add('hidden');
  }

  // 卡牌图鉴：展示所有卡牌与所有组合（分栏）
  openCompendium() {
    const modal = document.getElementById('compendiumModal');
    const listCards = document.getElementById('compendiumCards');
    const listCombos = document.getElementById('compendiumCombos');
    const btnClose = document.getElementById('compendiumClose');
    const tabCards = document.getElementById('tabCards');
    const tabCombos = document.getElementById('tabCombos');
    if (!modal || !listCards || !listCombos || !tabCards || !tabCombos) {
      alert('界面缺失：compendium');
      return;
    }
    if (!modal.__overlayBound) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
      modal.__overlayBound = true;
    }
    // Tabs 交互绑定
    const switchTab = (tab) => {
      const toCards = tab === 'cards';
      // active 状态
      tabCards.classList.toggle('active', toCards);
      tabCombos.classList.toggle('active', !toCards);
      // 显隐（双保险：class + style）
      listCards.classList.toggle('hidden', !toCards);
      listCombos.classList.toggle('hidden', toCards);
      listCards.style.display = toCards ? '' : 'none';
      listCombos.style.display = toCards ? 'none' : '';
    };
    // 使用 addEventListener 并阻止默认行为与冒泡，避免外层委托干扰
    tabCards.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); switchTab('cards'); });
    tabCombos.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); switchTab('combos'); });

    // 卡牌列表
    listCards.innerHTML = '';
    const allMorphemes = [
      ...PREFIXES.map(m => ({ ...m, type: 'prefix' })),
      ...ROOTS.map(m => ({ ...m, type: 'root' })),
      ...SUFFIXES.map(m => ({ ...m, type: 'suffix' })),
    ];
    allMorphemes.forEach(m => {
      const card = { id: `cmp-${m.type}-${m.id}` , type: m.type, text: m.text, morphemeId: m.id, cost: 1 };
      const tile = this.makeCardTile(card);
      listCards.appendChild(tile);
    });
    if (allMorphemes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = '暂无卡牌数据';
      listCards.appendChild(empty);
    }

    // 组合列表（WORDS + 特例）
    listCombos.innerHTML = '';
    const makeEffectText = (w) => {
      const dmg = w.damage || 0;
      if (w.word === 'report') return `从弃牌堆抽回 2 张`;
      if (w.word === 'portion') return `查看牌堆顶 5 张，选 1 入手；其余弃，下回合少抽 1 张`;
      if (w.word === 'struction') return `获得 5 点护盾`;
      if (w.word === 'structure') return `获得 5 点护盾`;
      if (w.word === 'reaction') return `两回合内若受到伤害则对敌造成 20；否则第三回合扣 1 能量`;
      if (w.word === 'conact') return `造成 12 伤害并获得 1 点能量`;
      if (w.word === 'overstruct') return `获得 8 点护盾并下回合多抽 1 张`;
      return dmg > 0 ? `造成 ${dmg} 伤害` : `无直接伤害`;
    };
    const allCombos = [...WORDS, ...SPECIAL_WORDS];
    allCombos.forEach(w => {
      const comp = [ w.prefix ? findMorpheme('prefix', w.prefix)?.text : '', w.root ? findMorpheme('root', w.root)?.text : '', w.suffix ? findMorpheme('suffix', w.suffix)?.text : '' ].filter(Boolean).join(' + ');
      const item = document.createElement('div');
      item.className = 'modal-item combo';
      const effectText = 'effectText' in w ? w.effectText : makeEffectText(w);
      item.textContent = `${w.word} —— ${comp}；效果：${effectText}`;
      listCombos.appendChild(item);
    });
    if (allCombos.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = '暂无组合数据';
      listCombos.appendChild(empty);
    }

    // 打开、关闭
    modal.classList.remove('hidden');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    switchTab('cards');
  }

  // 牌堆顶查看/选择：供 portion 组合使用
  openDrawPeekPicker(topN = 5, onDone) {
    const modal = document.getElementById('drawPeekPicker');
    const list = document.getElementById('drawPeekList');
    const btnClose = document.getElementById('drawPeekClose');
    const btnCancelIcon = document.getElementById('drawPeekCancelIcon');
    if (!modal || !list) {
      alert('界面缺失：drawPeekPicker');
      return;
    }
    // 遮罩点击关闭（只绑定一次）
    if (!modal.__overlayBound) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
      modal.__overlayBound = true;
    }
    const peekCount = Math.min(topN, this.drawPile.length);
    if (peekCount <= 0) {
      alert('抽牌堆为空');
      return;
    }
    const topCards = this.drawPile.slice(0, peekCount);
    list.innerHTML = '';
    topCards.forEach(card => {
      const tile = this.makeCardTile(card, () => {
        // 从抽牌堆移除这 peekCount 张
        this.drawPile.splice(0, peekCount);
        // 未选中的加入弃牌堆
        topCards.forEach(c => { if (c.id !== card.id) this.discardPile.push(c); });
        // 选中的加入手牌
        const drawEl = document.getElementById('drawStack');
        const handEl = document.getElementById('hand');
        if (drawEl && handEl) {
          const src = drawEl.getBoundingClientRect();
          const dst = handEl.getBoundingClientRect();
          const ghost = document.createElement('div');
          ghost.className = 'deal-ghost player';
          ghost.style.left = `${src.left + src.width / 2}px`;
          ghost.style.top = `${src.top + src.height / 2}px`;
          ghost.style.setProperty('--ghost-dur', '480ms');
          document.body.appendChild(ghost);
          requestAnimationFrame(() => {
            const dx = (dst.left + dst.width / 2) - (src.left + src.width / 2);
            const dy = (dst.top + dst.height / 2) - (src.top + src.height / 2);
            ghost.style.transform = `translate(${dx}px, ${dy}px)`;
          });
          setTimeout(() => ghost.remove(), 520);
        }
        card.__justDrawn = true;
        this.hand.push(card);
        // 副作用：下回合少抽 1 张
        this.nextTurnDrawPenalty = (this.nextTurnDrawPenalty || 0) + 1;
        this.updateUI();
        modal.classList.add('hidden');
        if (btnClose) btnClose.onclick = null;
        if (onDone) onDone();
      });
      list.appendChild(tile);
    });
    modal.classList.remove('hidden');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancelIcon) btnCancelIcon.onclick = () => modal.classList.add('hidden');
  }

  dealDamage(amount, isCombo = false) {
    try { this.playCue('sound/attack.mp3'); } catch (_) {}
    this.triggerAttackDash('player');
    impactStage();
    const outgoing = this.applyOutgoingDamageModifiers(amount, 'player');
    const blockedRaw = Math.min(outgoing, this.enemy.block);
    const absorbed = this.applyBlockAbsorbModifiers(blockedRaw, 'enemy');
    const unblocked = Math.max(0, outgoing - absorbed);
    this.enemy.block = Math.max(0, this.enemy.block - blockedRaw);
    this.enemy.hp = Math.max(0, this.enemy.hp - unblocked);
    // 浮动伤害数字
    const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
    createDamageFloat(`${isCombo ? '组合 ' : ''}-${outgoing}`, rect.left + rect.width / 2, rect.top + 30);

    // 斩击效果
    const slash = document.createElement('div');
    slash.className = 'slash';
    slash.style.left = `${rect.left + rect.width - 200}px`;
    slash.style.top = `${rect.top + 40}px`;
    document.body.appendChild(slash);
    setTimeout(() => slash.remove(), 360);

    // 格挡护盾效果
    if (absorbed > 0) {
      try { this.playCue('sound/deffent.mp3'); } catch (_) {}
      const shield = document.createElement('div');
      shield.className = 'shield';
      const enemyRect = document.getElementById('enemyAvatar').getBoundingClientRect();
      shield.style.left = `${enemyRect.left + enemyRect.width / 2 - 40}px`;
      shield.style.top = `${enemyRect.top + enemyRect.height / 2 - 40}px`;
      document.body.appendChild(shield);
      setTimeout(() => shield.remove(), 420);
    }

    if (this.enemy.hp <= 0) {
      this.endBattle(true);
    }
  }

  async endTurn() {
    if (this.isEndingTurn) return;
    this.isEndingTurn = true;
    this.cancelLinking();
    const btnEnd = document.getElementById('btnEndTurn');
    if (btnEnd) btnEnd.disabled = true;
    try {
      while (this.hand.length) {
        const card = this.hand.shift();
        this.discardPile.push(card);
      }
      const drawCount = Math.max(0, CONFIG.drawPerTurn - (this.nextTurnDrawPenalty || 0));
      await this.dealCards(drawCount, 3000);
      this.nextTurnDrawPenalty = 0;
      const penalty = this.nextTurnEnergyPenalty;
      this.energy = Math.max(1, CONFIG.energyPerTurn - penalty);
      this.nextTurnEnergyPenalty = 0;
      // 玩家结束本回合：衰减一次性减益（虚弱/脆弱）
      this.onStartTurn('player');
      if (this.enemy) this.enemy.takeTurn(this);
      this.turn++;
      if (this.reactionStatus && this.reactionStatus.active && !this.reactionStatus.hasTriggered) {
        if (this.reactionStatus.turnsRemaining > 0) {
          this.reactionStatus.turnsRemaining--;
          if (this.reactionStatus.turnsRemaining === 0) {
            this.reactionStatus.active = false;
            this.changeEnergy(-1);
          }
        }
      }
      this.updateUI();
    } finally {
      this.isEndingTurn = false;
      if (btnEnd) btnEnd.disabled = false;
    }
  }

  updateUI() {
    // 舞台血条与护盾（玩家）
    const pHpBar = document.getElementById('playerHpStageBar');
    const pBlock = document.getElementById('playerBlockOverlay');
    const pHpText = document.getElementById('playerHpTextStage');
    if (pHpBar && pBlock && pHpText) {
      const pMax = this.player?.maxHp || 70;
      pHpBar.style.width = `${(this.player.hp / pMax) * 100}%`;
      pBlock.style.width = `${Math.min(100, (this.player.block / pMax) * 100)}%`;
      pHpText.textContent = this.player.hp;
    }

    // 地图金币显示
    const mapGold = document.getElementById('mapGoldCount');
    if (mapGold) {
      mapGold.textContent = this.player.gold || 0;
    }

    // 事件界面 HP 显示
    const evHp = document.getElementById('eventPlayerHp');
    const evMax = document.getElementById('eventPlayerMaxHp');
    const evGold = document.getElementById('eventPlayerGold');
    if (evHp && evMax) {
      evHp.textContent = this.player.hp;
      evMax.textContent = this.player.maxHp;
    }
    if (evGold) {
      evGold.textContent = this.player.gold || 0;
    }

    // 舞台血条与护盾（敌人）
    const eHpBar = document.getElementById('enemyHpStageBar');
    const eBlock = document.getElementById('enemyBlockOverlay');
    const eHpText = document.getElementById('enemyHpTextStage');
    const intentIcon = document.getElementById('enemyIntentIcon');
    const intentTextEl = document.getElementById('enemyIntentText');
    if (this.enemy && eHpBar && eBlock && eHpText && intentIcon) {
      eHpBar.style.width = `${(this.enemy.hp / this.enemy.maxHp) * 100}%`;
      eBlock.style.width = `${Math.min(100, (this.enemy.block / this.enemy.maxHp) * 100)}%`;
      eHpText.textContent = this.enemy.hp;
      const sym = this.enemy.intent === 'attack' ? '⚔️' : this.enemy.intent === 'defend' ? '🛡️' : this.enemy.intent === 'buff' ? '✨' : '☠️';
      intentIcon.textContent = sym;
      intentIcon.title = `意图：${this.enemy.intent}${(this.enemy.intent === 'attack' || this.enemy.intent === 'defend') ? ' ' + this.enemy.intentValue : ''}`;
      if (intentTextEl) {
        const label = this.enemy.intent === 'attack' ? '攻击' : this.enemy.intent === 'defend' ? '防御' : this.enemy.intent === 'buff' ? '增益' : '减益';
        const currentText = `${label}${(this.enemy.intent === 'attack' || this.enemy.intent === 'defend') ? ' ' + this.enemy.intentValue : ''}`;
        // 预览队列（see/over 联动生成）：显示未来意图简报
        let preview = '';
        if (Array.isArray(this.enemy.intentQueue) && this.enemy.intentQueue.length > 0) {
          const mapLabel = (it) => it.intent === 'attack' ? `攻 ${it.intentValue}` : it.intent === 'defend' ? `防 ${it.intentValue}` : it.intent === 'buff' ? '增益' : '减益';
          preview = ' | 预告：' + this.enemy.intentQueue.map(mapLabel).join(' → ');
        }
        intentTextEl.textContent = currentText + preview;
      }
    } else if (intentIcon) {
      intentIcon.textContent = '?';
      intentIcon.title = '意图：—';
      if (intentTextEl) intentTextEl.textContent = '—';
    }

    const renderBadges = (who) => {
      const el = document.getElementById(who === 'player' ? 'playerAvatar' : 'enemyAvatar');
      if (!el) return;
      let box = el.querySelector('.status-badges');
      if (!box) { box = document.createElement('div'); box.className = 'status-badges'; el.appendChild(box); }
      box.innerHTML = '';
      const st = (who === 'player' ? this.player : this.enemy)?.statuses || {};
      const entries = [
        ['weak','弱'], ['frail','脆'], ['strength','力'], ['toughness','韧']
      ];
      entries.forEach(([key, label]) => {
        const v = st[key] || 0;
        if (v > 0) {
          const b = document.createElement('div');
          b.className = `status-badge ${key}`;
          b.textContent = `${label}${v}`;
          box.appendChild(b);
        }
      });
    };
    renderBadges('player');
    if (this.enemy) renderBadges('enemy');

    // 独立能量面板
    const energyCountEl = document.getElementById('energyPanelCount');
    if (energyCountEl) {
      energyCountEl.textContent = this.energy;
    }

    // 头部能量圆点（与能量面板同步）
    const orbsEl = document.getElementById('energyOrbs');
    if (orbsEl) {
      orbsEl.innerHTML = '';
      for (let i = 0; i < this.energy; i++) {
        const orb = document.createElement('div');
        orb.className = 'orb';
        orbsEl.appendChild(orb);
      }
    }

    // 牌堆计数（舞台）
    const drawCountEl = document.getElementById('drawStackCount');
    const discardCountEl = document.getElementById('discardStackCount');
    if (drawCountEl) drawCountEl.textContent = this.drawPile.length;
    if (discardCountEl) discardCountEl.textContent = this.discardPile.length;
    const handDiscardCountEl = document.getElementById('handDiscardCount');
    if (handDiscardCountEl) handDiscardCountEl.textContent = this.discardPile.length;

    // 回合指示器
    const turnEl = document.getElementById('turnIndicator');
    if (turnEl) {
      turnEl.textContent = `回合 ${this.turn}`;
      const mapShown = !document.getElementById('mapView').classList.contains('hidden');
      turnEl.style.display = this.enemy && !mapShown ? '' : 'none';
    }

    // 统计数据
    const morEl = document.getElementById('statsMorphemes');
    const wordsEl = document.getElementById('statsWords');
    if (morEl) morEl.textContent = this.stats.morphemesMastered;
    if (wordsEl) wordsEl.textContent = this.stats.wordsFormed;

    // 手牌渲染
    const handEl = document.getElementById('hand');
    if (handEl) {
      handEl.innerHTML = '';
      const total = this.hand.length;
      this.hand.forEach((card, idx) => {
        const el = document.createElement('div');
        el.className = `card ${card.type}${card.__justDrawn ? ' card-deal' : ''}`;
        el.setAttribute('data-card-id', card.id);
        el.draggable = true;
        el.setAttribute('draggable', 'true');
        const rot = (idx - (total - 1) / 2) * 5;
        el.style.setProperty('--deal-rot', `${rot}deg`);
        const effectText = getEffectDescription(card);
        if (card.type === 'linked') {
          const comp = [];
          const mPrefix = card.comboMatch?.prefix ? findMorpheme('prefix', card.comboMatch.prefix)?.text : '';
          const mRoot = card.comboMatch?.root ? findMorpheme('root', card.comboMatch.root)?.text : '';
          const mSuffix = card.comboMatch?.suffix ? findMorpheme('suffix', card.comboMatch.suffix)?.text : '';
          if (mPrefix) comp.push(`<span class=\"linked-chip prefix\">${mPrefix}</span>`);
          if (mRoot) comp.push(`<span class=\"linked-chip root\">${mRoot}</span>`);
          if (mSuffix) comp.push(`<span class=\"linked-chip suffix\">${mSuffix}</span>`);
          const join = comp.length > 1 ? `<span class=\"join\"></span>` : '';
          const row = comp.join(join);
          const eff = (card.comboMatch ? this.effectTextForWord(card.comboMatch) : (card.meaning || effectText)) || '';
          el.classList.add('linked');
          el.innerHTML = `
            <div class=\"card-content\">
              <div class=\"title\">${card.text}</div>
              <div class=\"linked-chips\">${row}</div>
              <div class=\"effect\">${eff}</div>
              <div class=\"cost-pill\">${card.cost}</div>
            </div>
          `;
        } else {
          el.innerHTML = `
            <div class=\"card-content\">
              <div class=\"title\">${card.text}</div>
              <div class=\"effect\">${effectText}</div>
              <div class=\"cost-pill\">${card.cost}</div>
            </div>
          `;
        }
        el.addEventListener('dragstart', e => {
          const rectCheck = el.getBoundingClientRect();
          const cx = e.clientX ?? (this.dragLastPoint ? this.dragLastPoint.x : null);
          if (cx != null && (cx < rectCheck.left + 15 || cx > rectCheck.right - 15)) { e.preventDefault(); return; }
          if (!e.dataTransfer) {
            // 某些浏览器需要显式启用拖拽
            try { e.target.setAttribute('draggable', 'true'); } catch (_) {}
          }
          e.dataTransfer.setData('text/plain', card.id);
          e.dataTransfer.effectAllowed = 'move';
          el.classList.add('dragging');
          const rect = el.getBoundingClientRect();
          const img = document.createElement('canvas');
          img.width = 1; img.height = 1;
          try { e.dataTransfer.setDragImage(img, 0, 0); } catch (_) {}
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          this.createDragArrow(startX, startY);
          const onDragOver = (ev) => {
            ev.preventDefault();
            const x = ev.clientX ?? (ev.pageX - window.scrollX);
            const y = ev.clientY ?? (ev.pageY - window.scrollY);
            const target = this.detectDragTarget(x, y);
            this.updateDragArrow(x, y, target);
          };
          const onDragEnd = () => {
            el.classList.remove('dragging');
            this.destroyDragArrow();
            document.removeEventListener('dragover', onDragOver, true);
            el.removeEventListener('dragend', onDragEnd, true);
            this.isDragging = false;
          };
          document.addEventListener('dragover', onDragOver, true);
          el.addEventListener('dragend', onDragEnd, true);
          this.isDragging = true;
        });
        // 指针事件回退：移动端触摸拖拽（iOS Safari 等不触发原生 dragstart 的情况）
        el.addEventListener('pointerdown', (e) => {
          if (!e.isPrimary) return;
          if (e.pointerType !== 'touch') return; // 避免与桌面原生拖拽冲突
          const rectCheck = el.getBoundingClientRect();
          if (e.clientX < rectCheck.left + 15 || e.clientX > rectCheck.right - 15) return;
          e.preventDefault();
          this.isDragging = true;
          const id = card.id;
          el.classList.add('dragging');
          const rect = el.getBoundingClientRect();
          const startX = rect.left + rect.width / 2;
          const startY = rect.top + rect.height / 2;
          this.createDragArrow(startX, startY);
          let lastSlot = null;
          const move = (ev) => {
            const x = ev.clientX, y = ev.clientY;
            const target = this.detectDragTarget(x, y);
            this.updateDragArrow(x, y, target);
            const slot = target === 'slot' ? document.querySelector('.slot.dragover') : null;
            if (lastSlot && lastSlot !== slot) lastSlot.classList.remove('dragover');
            if (slot && lastSlot !== slot) slot.classList.add('dragover');
            lastSlot = slot;
          };
          const up = (ev) => {
            window.removeEventListener('pointermove', move, true);
            window.removeEventListener('pointerup', up, true);
            el.classList.remove('dragging');
            this.destroyDragArrow();
            if (lastSlot) lastSlot.classList.remove('dragover');
            this.isDragging = false;
            const x = ev.clientX, y = ev.clientY;
            const els = document.elementsFromPoint(x, y);
            const handEl = document.getElementById('hand');
            const handRect = handEl ? handEl.getBoundingClientRect() : null;
            let inHand = false;
            if (handRect) {
              const s = 20;
              inHand = x >= handRect.left + s && x <= handRect.right - s && y >= handRect.top + s && y <= handRect.bottom - s;
            }
            const enemy = els.find(n => n && (n.id === 'enemyAvatar' || n.id === 'enemyHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('enemy'))));
            const player = els.find(n => n && (n.id === 'playerAvatar' || n.id === 'playerHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('player'))));
            let slot = els.find(n => n && n.classList && n.classList.contains('slot'));
            if (!slot) {
              const pads = 24;
              const slots = Array.from(document.querySelectorAll('.slot'));
              for (let i = 0; i < slots.length; i++) {
                const r = slots[i].getBoundingClientRect();
                if (x >= r.left - pads && x <= r.right + pads && y >= r.top - pads && y <= r.bottom + pads) { slot = slots[i]; break; }
              }
            }
            if (enemy) {
              this.playCard(id);
              return;
            }
            if (slot) {
              const c = this.hand.find(c => c.id === id);
              if (c) this.playCardToSlot(id);
              return;
            }
            // 非对敌效果：通常需拖到我方角色区域，但 port 可在任意位置使用
            const c = this.hand.find(c => c.id === id);
            if (inHand) return;
            if (c && (player || c.morphemeId === 'port')) {
              if (this.isEnemyTargeting(c)) {
                Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: c.type, morphemeId: c.morphemeId });
              } else {
                this.playCard(id);
              }
            }
          };
          window.addEventListener('pointermove', move, true);
          window.addEventListener('pointerup', up, true);
        });
        // 更老设备的触摸事件回退：当 PointerEvent 不可用时使用
        if (!window.PointerEvent) {
          const startTouchDrag = (e) => {
            if (!e.touches || e.touches.length === 0) return;
            e.preventDefault();
            const touch = e.touches[0];
            const rectCheck = el.getBoundingClientRect();
            if (touch.clientX < rectCheck.left + 15 || touch.clientX > rectCheck.right - 15) return;
            const id = card.id;
            el.classList.add('dragging');
            const ghost = el.cloneNode(true);
            ghost.classList.add('drag-ghost');
            document.body.appendChild(ghost);
            const rect = el.getBoundingClientRect();
            const offsetX = rect.width / 2;
            const offsetY = rect.height / 2;
            let lastSlot = null;
            const move = (ev) => {
              if (!ev.touches || ev.touches.length === 0) return;
              const t = ev.touches[0];
              const x = t.clientX, y = t.clientY;
              ghost.style.left = (x - offsetX) + 'px';
              ghost.style.top = (y - offsetY) + 'px';
              const els = document.elementsFromPoint(x, y);
              const slot = els.find(n => n.classList && n.classList.contains('slot')) || null;
              if (lastSlot && lastSlot !== slot) lastSlot.classList.remove('dragover');
              if (slot && lastSlot !== slot) slot.classList.add('dragover');
              lastSlot = slot;
              ev.preventDefault();
            };
          const end = (ev) => {
              document.removeEventListener('touchmove', move, { capture: true });
              document.removeEventListener('touchend', end, { capture: true });
              el.classList.remove('dragging');
              ghost.remove();
              if (lastSlot) lastSlot.classList.remove('dragover');
              this.isDragging = false;
              const changed = ev.changedTouches && ev.changedTouches[0];
              const x = changed ? changed.clientX : touch.clientX;
              const y = changed ? changed.clientY : touch.clientY;
              const els = document.elementsFromPoint(x, y);
              const handEl = document.getElementById('hand');
              const handRect = handEl ? handEl.getBoundingClientRect() : null;
              let inHand = false;
              if (handRect) {
                const s = 20;
                inHand = x >= handRect.left + s && x <= handRect.right - s && y >= handRect.top + s && y <= handRect.bottom - s;
              }
              const enemy = els.find(n => n && (n.id === 'enemyAvatar' || n.id === 'enemyHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('enemy'))));
              const player = els.find(n => n && (n.id === 'playerAvatar' || n.id === 'playerHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('player'))));
              const slot = els.find(n => n && n.classList && n.classList.contains('slot'));
              if (enemy) {
                this.playCard(id);
                return;
              }
              if (slot) {
                const c = this.hand.find(c => c.id === id);
                if (c) this.playCardToSlot(id);
                return;
              }
              const c = this.hand.find(c => c.id === id);
              if (inHand) return;
              if (c && (player || c.morphemeId === 'port')) {
                if (this.isEnemyTargeting(c)) {
                  Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: c.type, morphemeId: c.morphemeId });
                } else {
                  this.playCard(id);
                }
              }
            };
            document.addEventListener('touchmove', move, { capture: true, passive: false });
            document.addEventListener('touchend', end, { capture: true, passive: false });
          };
          el.addEventListener('touchstart', startTouchDrag, { passive: false });
        }
        el.addEventListener('dragend', () => {
          el.classList.remove('dragging');
          if (el.__dragGhost) {
            el.__dragGhost.remove();
            delete el.__dragGhost;
          }
          this.isDragging = false;
          // 桌面浏览器：若最终位置不在敌人或槽位且拖出了手牌区域，则对非敌方目标牌执行通用使用
          const id = card.id;
          const pt = this.dragLastPoint;
          if (!pt) return;
          const els = document.elementsFromPoint(pt.x, pt.y);
          const handEl = document.getElementById('hand');
          const handRect = handEl ? handEl.getBoundingClientRect() : null;
          let inHand = false;
          if (handRect) {
            const s = 20;
            inHand = pt.x >= handRect.left + s && pt.x <= handRect.right - s && pt.y >= handRect.top + s && pt.y <= handRect.bottom - s;
          }
          const enemy = els.find(n => n && (n.id === 'enemyAvatar' || n.id === 'enemyHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('enemy'))));
          const player = els.find(n => n && (n.id === 'playerAvatar' || n.id === 'playerHpStage' || (n.classList && n.classList.contains('combatant') && n.classList.contains('player'))));
          let slot = els.find(n => n && n.classList && n.classList.contains('slot'));
          if (!slot) {
            const pads = 24;
            const slots = Array.from(document.querySelectorAll('.slot'));
            for (let i = 0; i < slots.length; i++) {
              const r = slots[i].getBoundingClientRect();
              if (pt.x >= r.left - pads && pt.x <= r.right + pads && pt.y >= r.top - pads && pt.y <= r.bottom + pads) { slot = slots[i]; break; }
            }
          }
          if (enemy || slot || inHand) return;
          const c = this.hand.find(c => c.id === id);
          if (!c) return;
          if (player || c.morphemeId === 'port') {
            if (this.isEnemyTargeting(c)) {
              Logger.info('该牌需要拖到敌人上使用', { cardId: id, type: c.type, morphemeId: c.morphemeId });
            } else {
              this.playCard(id);
            }
          }
        });
        // 点击事件在容器级委托处理（bindUI 中），避免重复触发导致选中状态被快速切换
        handEl.appendChild(el);
        // 清除一次性标记，避免重复动画
        delete card.__justDrawn;
      });
      // 渲染完成后应用一次选中态布局（若有选中）
      this.applyHandSelectionLayout();
      // 渲染词典与组合引导
      this.renderWordGuide();
    }
  }

  makeCardTile(card, onClick) {
    const el = document.createElement('div');
    el.className = `card ${card.type}`;
    el.setAttribute('data-card-id', card.id || `${card.type}-${Date.now()}`);
    el.draggable = false;
    const effectText = getEffectDescription(card) || '';
    const cost = card.cost != null ? card.cost : 1;
    if (card.type === 'linked') {
      const comp = [];
      const mPrefix = card.comboMatch?.prefix ? findMorpheme('prefix', card.comboMatch.prefix)?.text : '';
      const mRoot = card.comboMatch?.root ? findMorpheme('root', card.comboMatch.root)?.text : '';
      const mSuffix = card.comboMatch?.suffix ? findMorpheme('suffix', card.comboMatch.suffix)?.text : '';
      if (mPrefix) comp.push(`<span class=\"linked-chip prefix\">${mPrefix}</span>`);
      if (mRoot) comp.push(`<span class=\"linked-chip root\">${mRoot}</span>`);
      if (mSuffix) comp.push(`<span class=\"linked-chip suffix\">${mSuffix}</span>`);
      const join = comp.length > 1 ? `<span class=\"join\"></span>` : '';
      const row = comp.join(join);
      const eff = (card.comboMatch ? this.effectTextForWord(card.comboMatch) : (card.meaning || effectText)) || '';
      el.classList.add('linked');
      el.innerHTML = `
        <div class="card-content">
          <div class="title">${card.text}</div>
          <div class="linked-chips">${row}</div>
          <div class="effect">${eff}</div>
          <div class="cost-pill">${cost}</div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="card-content">
          <div class="title">${card.text}</div>
          <div class="effect">${effectText}</div>
          <div class="cost-pill">${cost}</div>
        </div>
      `;
    }
    if (typeof onClick === 'function') {
      el.style.cursor = 'pointer';
      el.addEventListener('click', onClick);
    }
    return el;
  }

  // 预生成并锁定敌人未来 n 回合的意图，更新 UI 显示预览
  peekEnemyIntents(n = 1) {
    if (!this.enemy) return;
    const w = CONFIG.enemyIntentWeights;
    const genOne = () => {
      const r = Math.random();
      if (r < w.attack) {
        return { intent: 'attack', intentValue: 6 + Math.floor(Math.random() * 6) };
      } else if (r < w.attack + w.defend) {
        return { intent: 'defend', intentValue: 5 + Math.floor(Math.random() * 5) };
      } else if (r < w.attack + w.defend + w.debuff) {
        return { intent: 'debuff', intentValue: 1 };
      } else {
        return { intent: 'buff', intentValue: 1 };
      }
    };
    for (let i = 0; i < n; i++) {
      this.enemy.intentQueue.push(genOne());
    }
    // 确保预告中可见一次增益（如存在增益动作且当前生成中无增益）
    if (ENEMY_ACTIONS && ENEMY_ACTIONS.buff && ENEMY_ACTIONS.buff.length) {
      const recent = this.enemy.intentQueue.slice(-n);
      const hasBuff = recent.some(it => it.intent === 'buff');
      if (!hasBuff && n > 0) {
        recent[recent.length - 1] = { intent: 'buff', intentValue: 1 };
        this.enemy.intentQueue.splice(this.enemy.intentQueue.length - n, n, ...recent);
      }
    }
    this.updateUI();
  }

  renderComboSlots() {
    const handEl = document.getElementById('hand');
    if (!handEl) return;
    this.renderLinkLinesOverlay();
    if (!this.isLinking) {
      Array.from(handEl.children).forEach(el => el.classList.remove('link-first'));
    } else if (this.linkSelection && this.linkSelection[0]) {
      const firstEl = handEl.querySelector(`[data-card-id="${this.linkSelection[0]}"]`);
      if (firstEl) firstEl.classList.add('link-first');
    }
    Logger.debug('Link lines rendered', { selection: this.linkSelection });
  }

  renderLinkLinesOverlay() {
    if (this._linkLinesSvg) { try { this._linkLinesSvg.remove(); } catch (_) {} this._linkLinesSvg = null; }
    if (!this.isLinking || !Array.isArray(this.linkSelection) || this.linkSelection.length === 0) return;
    const handEl = document.getElementById('hand');
    if (!handEl) return;
    const points = [];
    this.linkSelection.forEach(id => {
      const el = handEl.querySelector(`[data-card-id="${id}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        points.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('link-lines');
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const makeCurve = (sx, sy, ex, ey) => {
      const dx = ex - sx, dy = ey - sy;
      const bend = Math.min(120, Math.hypot(dx, dy) / 2);
      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle + Math.PI / 2) * bend;
      const ny = Math.sin(angle + Math.PI / 2) * bend;
      const c1x = sx + nx * 0.6;
      const c1y = sy + ny * 0.6;
      const c2x = ex - nx * 0.4;
      const c2y = ey - ny * 0.4;
      return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;
    };
    if (points.length === 1 && this._linkPointer) {
      const p = points[0];
      const d = makeCurve(p.x, p.y, this._linkPointer.x, this._linkPointer.y);
      path.setAttribute('d', d);
    } else if (points.length >= 2) {
      let d = '';
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        d += (i === 1 ? '' : ' ') + makeCurve(a.x, a.y, b.x, b.y);
      }
      path.setAttribute('d', d);
    } else {
      return;
    }
    svg.appendChild(path);
    points.forEach(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', `${p.x}`);
      c.setAttribute('cy', `${p.y}`);
      c.setAttribute('r', '3');
      svg.appendChild(c);
    });
    document.body.appendChild(svg);
    this._linkLinesSvg = svg;
  }

  computeLinkCandidates() {
    if (!this.isLinking) return [];
    const selected = (this.linkSelection || []).map(id => this.hand.find(c => c.id === id)).filter(Boolean);
    let prefixId = null, rootId = null, suffixId = null;
    selected.forEach(c => {
      if (c.type === 'prefix') prefixId = c.morphemeId;
      else if (c.type === 'root') rootId = c.morphemeId;
      else if (c.type === 'suffix') suffixId = c.morphemeId;
      else if (c.type === 'linked' && c.comboMatch) {
        // 允许“再次组合”：把已组合牌视为其词素占位
        if (c.comboMatch.prefix != null && prefixId == null) prefixId = c.comboMatch.prefix;
        if (c.comboMatch.root != null && rootId == null) rootId = c.comboMatch.root;
        if (c.comboMatch.suffix != null && suffixId == null) suffixId = c.comboMatch.suffix;
      }
    });
    const needTypes = new Set();
    const allowByType = { prefix: new Set(), root: new Set(), suffix: new Set() };
    const wordsPool = WORDS.filter(w => (
      (!rootId || w.root === rootId) &&
      (prefixId == null || w.prefix === prefixId) &&
      (suffixId == null || w.suffix === suffixId)
    ));
    if (wordsPool.length) {
      if (!rootId) { needTypes.add('root'); wordsPool.forEach(w => { if (w.root) allowByType.root.add(w.root); }); }
      const needPrefix = wordsPool.some(w => w.prefix != null && !prefixId);
      const needSuffix = wordsPool.some(w => w.suffix != null && !suffixId);
      if (needPrefix) { needTypes.add('prefix'); wordsPool.forEach(w => { if (w.prefix) allowByType.prefix.add(w.prefix); }); }
      if (needSuffix) { needTypes.add('suffix'); wordsPool.forEach(w => { if (w.suffix) allowByType.suffix.add(w.suffix); }); }
    }
    const specialsPool = SPECIAL_WORDS.filter(w => (
      !rootId &&
      (prefixId == null || w.prefix === prefixId) &&
      (suffixId == null || w.suffix === suffixId)
    ));
    if (specialsPool.length) {
      if (!prefixId) { needTypes.add('prefix'); specialsPool.forEach(w => { if (w.prefix) allowByType.prefix.add(w.prefix); }); }
      if (!suffixId) { needTypes.add('suffix'); specialsPool.forEach(w => { if (w.suffix) allowByType.suffix.add(w.suffix); }); }
    }
    const res = [];
    const selSet = new Set(this.linkSelection || []);
    this.hand.forEach(card => {
      if (selSet.has(card.id)) return;
      if (!needTypes.has(card.type)) return;
      const allowSet = allowByType[card.type];
      if (allowSet.size === 0 || allowSet.has(card.morphemeId)) res.push(card.id);
    });
    return res;
  }

  toggleLinkMode() {
    const handEl = document.getElementById('hand');
    const btn = document.getElementById('btnLinkCombo');
    if (!this.isLinking) {
      this.isLinking = true;
      this.linkSelection = [];
      handEl && handEl.classList.add('linking');
      if (btn) btn.textContent = '链接组合中…';
      this._linkPointer = null;
      this._onLinkPointerMove = (e) => { this._linkPointer = { x: e.clientX, y: e.clientY }; this.renderLinkLinesOverlay(); };
      document.addEventListener('mousemove', this._onLinkPointerMove, true);
      this._linkDocClickHandler = (e) => {
        const hand = document.getElementById('hand');
        if (!hand) return;
        if (!hand.contains(e.target)) this.cancelLinking();
      };
      document.addEventListener('click', this._linkDocClickHandler, true);
      this.scheduleLinkTimeout();
      this.renderComboSlots();
      return;
    }
    const match = this.findComboMatchFromSelection();
    if (match) {
      this.spawnLinkedGroupCard(match);
    }
    this.cancelLinking();
  }

  toggleLinkSelect(cardId) {
    if (!this.isLinking) return;
    const candidates = new Set(this.computeLinkCandidates());
    const allow = (this.linkSelection.length === 0) || candidates.has(cardId);
    if (!allow) return;
    const i = this.linkSelection.indexOf(cardId);
    if (i !== -1) {
      this.linkSelection.splice(i, 1);
    } else {
      if (this.linkSelection.length >= 3) return;
      this.linkSelection.push(cardId);
    }
    const btn = document.getElementById('btnLinkCombo');
    if (btn) btn.textContent = this.findComboMatchFromSelection() ? '打出组合' : '链接组合中…';
    this.renderComboSlots();
    this.scheduleLinkTimeout();
    const match = this.findComboMatchFromSelection();
    if (match && this.linkSelection.length >= 2) {
      this.spawnLinkedGroupCard(match);
      this.cancelLinking();
    }
  }

  findComboMatchFromSelection() {
    const selected = (this.linkSelection || []).map(id => this.hand.find(c => c.id === id)).filter(Boolean);
    let prefixId = null, rootId = null, suffixId = null;
    selected.forEach(c => {
      if (c.type === 'prefix') prefixId = c.morphemeId;
      else if (c.type === 'root') rootId = c.morphemeId;
      else if (c.type === 'suffix') suffixId = c.morphemeId;
      else if (c.type === 'linked' && c.comboMatch) {
        if (c.comboMatch.prefix != null && prefixId == null) prefixId = c.comboMatch.prefix;
        if (c.comboMatch.root != null && rootId == null) rootId = c.comboMatch.root;
        if (c.comboMatch.suffix != null && suffixId == null) suffixId = c.comboMatch.suffix;
      }
    });
    if (!rootId) {
      if (prefixId && suffixId) {
        return SPECIAL_WORDS.find(w => w.prefix === prefixId && w.suffix === suffixId) || null;
      }
      return null;
    }
    return WORDS.find(w => (
      (w.prefix ?? null) === (prefixId ?? null) &&
      w.root === rootId &&
      (w.suffix ?? null) === (suffixId ?? null)
    )) || null;
  }

  commitLinkCombo(match) {
    // 能量消耗已在出牌时结算
    if (!('root' in match) || match.root == null) {
      const fail = Math.random() < 0.10;
      if (fail) {
        const rect = document.getElementById('enemyAvatar').getBoundingClientRect();
        createDamageFloat(`失败`, rect.left + rect.width / 2, rect.top + 30);
        const slots = document.getElementById('comboSlots');
        if (slots) {
          const toast = document.createElement('div');
          toast.className = 'combo-error-toast';
          toast.textContent = '组合失败';
          toast.style.position = 'absolute';
          toast.style.left = '50%';
          toast.style.top = '0';
          toast.style.transform = 'translateX(-50%) translateY(-8px)';
          toast.style.background = 'rgba(220,0,0,0.85)';
          toast.style.color = '#fff';
          toast.style.padding = '6px 10px';
          toast.style.borderRadius = '6px';
          toast.style.fontSize = '14px';
          toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
          toast.style.zIndex = '1000';
          slots.appendChild(toast);
          setTimeout(() => toast.remove(), 1200);
        }
      } else {
        if (match.word === 'overpower') {
          this.dealDamage(20, true);
        } else if (match.word === 'oversee') {
          this.peekEnemyIntents(5);
        }
        const panel = document.getElementById('comboPanel');
        if (panel) {
          panel.querySelector('.combo-word').textContent = `${match.word}`;
          panel.querySelector('.combo-meaning').textContent = `${match.effectText}`;
          panel.classList.remove('hidden');
          playAhaSound();
          setTimeout(() => panel.classList.add('hidden'), 1800);
        }
        this.stats.wordsFormed += 1;
        this.saveStats();
      }
      this.updateUI();
      return;
    }
    let handled = false;
    switch (match.word) {
      case 'report':
        this.openDiscardPicker(2, () => {});
        handled = true; break;
      case 'portable':
        this.dealDamage(match.damage, true);
        handled = true; break;
      case 'struction':
      case 'structure':
        this.animateDefenseFromSlots(5);
        handled = true; break;
      case 'portion':
        this.openDrawPeekPicker(5, () => {});
        handled = true; break;
      case 'action':
        this.dealDamage(15, true);
        handled = true; break;
      case 'reaction':
        this.reactionStatus.active = true;
        this.reactionStatus.turnsRemaining = 2;
        this.reactionStatus.hasTriggered = false;
        this.reactionStatus.applyPenaltyAtStart = false;
        handled = true; break;
      case 'conact':
        this.dealDamage(12, true);
        this.changeEnergy(1);
        handled = true; break;
      case 'overstruct':
        this.animateDefenseFromSlots(8);
        this.nextTurnDrawPenalty = (this.nextTurnDrawPenalty || 0) - 1;
        handled = true; break;
      default:
        break;
    }
    if (!handled) {
      const dmg = match.damage + CONFIG.comboMultiplier * CONFIG.baseDamage;
      this.dealDamage(dmg, true);
    }
    
    const panel = document.getElementById('comboPanel');
    if (panel) {
      panel.querySelector('.combo-word').textContent = `${match.word}`;
      const effectText = match.word === 'report' ? '从弃牌堆抽回 2 张' : `${match.meaning}`;
      panel.querySelector('.combo-meaning').textContent = effectText;
      panel.classList.remove('hidden');
      playAhaSound();
      const fx = document.createElement('div');
      fx.className = 'combo-flash';
      document.getElementById('battleArea').appendChild(fx);
      setTimeout(() => fx.remove(), 650);
      setTimeout(() => panel.classList.add('hidden'), 1800);
    }
    this.stats.wordsFormed += 1;
    this.saveStats();
    this.updateUI();
  }

  spawnLinkedGroupCard(match) {
    const handEl = document.getElementById('hand');
    if (!handEl) return;
    const selected = (this.linkSelection || []).map(id => this.hand.find(c => c.id === id)).filter(Boolean);
    selected.forEach(c => {
      const idx = this.hand.findIndex(h => h.id === c.id);
      if (idx !== -1) {
        const removed = this.hand.splice(idx, 1)[0];
        this.discardPile.push(removed);
      }
    });
    const effectText = ('effectText' in match) ? match.effectText : this.effectTextForWord(match);
    const groupCard = {
      id: `linked-${Math.random().toString(36).slice(2,8)}`,
      type: 'linked',
      text: match.word,
      meaning: effectText,
      cost: 1,
      comboMatch: match,
      members: selected.map(c => ({ type: c.type, id: c.morphemeId }))
    };
    this.hand.push(groupCard);
    this.updateUI();
  }

  scheduleLinkTimeout() {
    if (this._linkTimeoutId) { try { clearTimeout(this._linkTimeoutId); } catch (_) {} this._linkTimeoutId = null; }
    this._linkTimeoutId = setTimeout(() => { this.cancelLinking(); }, 6000);
  }

  cancelLinking() {
    const handEl = document.getElementById('hand');
    const btn = document.getElementById('btnLinkCombo');
    this.isLinking = false;
    this.linkSelection = [];
    this.linkCandidates = new Set();
    if (this._linkLinesSvg) { try { this._linkLinesSvg.remove(); } catch (_) {} this._linkLinesSvg = null; }
    if (this._onLinkPointerMove) { document.removeEventListener('mousemove', this._onLinkPointerMove, true); this._onLinkPointerMove = null; }
    if (this._linkDocClickHandler) { document.removeEventListener('click', this._linkDocClickHandler, true); this._linkDocClickHandler = null; }
    if (this._linkTimeoutId) { try { clearTimeout(this._linkTimeoutId); } catch (_) {} this._linkTimeoutId = null; }
    handEl && handEl.classList.remove('linking');
    if (btn) btn.textContent = '链接组合';
    this.renderComboSlots();
  }

  effectTextForWord(w) {
    if (!w) return '';
    const dmg = w.damage || 0;
    if (w.word === 'report') return '从弃牌堆抽回普通牌 2 张；或组合牌 1 张';
    if (w.word === 'portion') return '查看牌堆顶 5 张，选 1 入手；其余弃，下回合少抽 1 张';
    if (w.word === 'struction' || w.word === 'structure') return '获得 5 点护盾';
    if (w.word === 'reaction') return '两回合内若受到伤害则对敌造成 20；否则第三回合扣 1 能量';
    if (w.word === 'conact') return '造成 12 伤害并获得 1 点能量';
    if (w.word === 'overstruct') return '获得 8 点护盾并下回合多抽 1 张';
    return dmg > 0 ? `造成 ${dmg} 伤害` : '无直接伤害';
  }

  comboEffectSummaryForCard(card) {
    if (!card || !card.type) return '';
    const collect = [];
    const addWord = (w) => {
      if (!w || !w.word) return;
      const txt = this.effectTextForWord(w) || '';
      collect.push(`${w.word}：${txt}`);
    };
    if (card.type === 'prefix') {
      (WORDS || []).forEach(w => { if (w.prefix === card.morphemeId) addWord(w); });
      (SPECIAL_WORDS || []).forEach(w => { if (w.prefix === card.morphemeId) addWord(w); });
    } else if (card.type === 'root') {
      (WORDS || []).forEach(w => { if (w.root === card.morphemeId) addWord(w); });
    } else if (card.type === 'suffix') {
      (WORDS || []).forEach(w => { if (w.suffix === card.morphemeId) addWord(w); });
      (SPECIAL_WORDS || []).forEach(w => { if (w.suffix === card.morphemeId) addWord(w); });
    }
    const uniq = [];
    const seen = new Set();
    collect.forEach(s => { const key = s.split('：')[0]; if (!seen.has(key)) { seen.add(key); uniq.push(s); } });
    const capped = uniq.slice(0, 3);
    const joined = capped.join('；');
    if (joined.length > 64) return joined.slice(0, 64) + '…';
    return joined;
  }

  discardLinkedCards(selectedCards) {
    const discardEl = document.getElementById('discardStack');
    const discardRect = discardEl ? discardEl.getBoundingClientRect() : null;
    selectedCards.forEach(c => {
      const handEl = document.getElementById('hand');
      const cardEl = handEl ? handEl.querySelector(`[data-card-id="${c.id}"]`) : null;
      if (discardRect && cardEl) {
        const src = cardEl.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'deal-ghost player';
        ghost.style.left = `${src.left + src.width / 2}px`;
        ghost.style.top = `${src.top + src.height / 2}px`;
        ghost.style.setProperty('--ghost-dur', '520ms');
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          const dx = (discardRect.left + discardRect.width / 2) - (src.left + src.width / 2);
          const dy = (discardRect.top + discardRect.height / 2) - (src.top + src.height / 2);
          ghost.style.transform = `translate(-50%,-50%) translate(${dx}px, ${dy}px)`;
        });
        setTimeout(() => ghost.remove(), 560);
      }
      const idx = this.hand.findIndex(h => h.id === c.id);
      if (idx !== -1) {
        const removed = this.hand.splice(idx, 1)[0];
        this.discardPile.push(removed);
      }
    });
    this.isLinking = false;
    this.linkSelection = [];
    const handEl = document.getElementById('hand');
    handEl && handEl.classList.remove('linking');
    const btn = document.getElementById('btnLinkCombo');
    if (btn) btn.textContent = '链接组合';
    this.renderComboSlots();
  }

  // 词典与可用组合展示
  renderWordGuide() {
    const listEl = document.getElementById('wordGuideList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const have = {
      prefix: new Set(),
      root: new Set(),
      suffix: new Set()
    };
    // 从手牌与组合暂存区收集可用的词素
    [...this.hand, ...this.comboZone].forEach(c => {
      if (c && c.type && c.morphemeId) {
        have[c.type].add(c.morphemeId);
      }
    });

    const makeEffectText = (w) => {
      const dmg = w.damage || 0;
      if (w.word === 'report') {
        return `从弃牌堆抽回 2 张`;
      }
      if (w.word === 'portion') {
        return `查看牌堆顶 5 张，选 1 入手；其余弃，下回合少抽 1 张`;
      }
      if (w.word === 'struction') {
        return `获得 5 点护盾`;
      }
      if (w.word === 'structure') {
        return `获得 5 点护盾`;
      }
      if (w.word === 'reaction') {
        return `两回合内若受到伤害则对敌造成 20；否则第三回合扣 1 能量`;
      }
      if (w.word === 'conact') {
        return `造成 12 伤害并获得 1 点能量`;
      }
      if (w.word === 'overstruct') {
        return `获得 8 点护盾并下回合多抽 1 张`;
      }
      return dmg > 0 ? `造成 ${dmg} 伤害` : `无直接伤害`;
    };

    const calcEnergyCost = (_w) => 1; // 统一所有组合能量消耗为 1

    WORDS.forEach(w => {
      const hasPrefix = w.prefix == null || have.prefix.has(w.prefix);
      const hasRoot = have.root.has(w.root);
      const hasSuffix = w.suffix == null || have.suffix.has(w.suffix);
      const presentAll = hasPrefix && hasRoot && hasSuffix;
      const energyNeed = calcEnergyCost(w);
      const energyOk = presentAll && this.energy >= energyNeed;
      const possible = hasRoot && (!presentAll);

      const row = document.createElement('div');
      row.className = 'guide-row';
      row.style.borderLeft = energyOk ? '4px solid #2b8c4b' : possible ? '4px solid #ffc107' : '4px solid #ddd';

      const comp = [w.prefix ? findMorpheme('prefix', w.prefix)?.text : '', findMorpheme('root', w.root)?.text, w.suffix ? findMorpheme('suffix', w.suffix)?.text : '']
        .filter(Boolean).join(' + ');
      const title = document.createElement('div');
      title.className = 'guide-word';
      title.textContent = w.word;

      const composition = document.createElement('div');
      composition.className = 'guide-comp';
      composition.textContent = comp || '(仅词根)';

      const effect = document.createElement('div');
      effect.className = 'guide-effect';
      effect.textContent = makeEffectText(w);

      const energy = document.createElement('div');
      energy.className = 'guide-energy';
      energy.textContent = `能量需求：${energyNeed}`;

      const status = document.createElement('div');
      status.className = 'guide-status';
      status.textContent = energyOk ? '可用' : presentAll ? '缺能量' : possible ? '可组合' : '';

      row.appendChild(title);
      row.appendChild(composition);
      row.appendChild(effect);
      row.appendChild(energy);
      if (status.textContent) row.appendChild(status);

      // 为可组合的词条提供“一键组合”按钮
      const btn = document.createElement('button');
      btn.className = 'guide-action';
      btn.textContent = '组合';
      btn.disabled = !presentAll;
      btn.title = presentAll ? '选中所需牌并打出组合' : '缺少必要牌';
      btn.addEventListener('click', () => this.autoFillCombo(w));
      row.appendChild(btn);
      listEl.appendChild(row);
    });

    // 特例词条：无词根组合
    const SPECIAL_WORDS_LIST = SPECIAL_WORDS;

    const calcSpecialEnergy = (_w) => 1; // 特例组合同样消耗 1

    SPECIAL_WORDS_LIST.forEach(w => {
      const hasPrefix = have.prefix.has(w.prefix);
      const hasSuffix = have.suffix.has(w.suffix);
      const presentAll = hasPrefix && hasSuffix; // 无词根特例：仅需前后缀
      const energyNeed = calcSpecialEnergy(w);
      const energyOk = presentAll && this.energy >= energyNeed;
      const possible = (hasPrefix || hasSuffix) && !presentAll;

      const row = document.createElement('div');
      row.className = 'guide-row';
      row.style.borderLeft = energyOk ? '4px solid #2b8c4b' : possible ? '4px solid #ffc107' : '4px solid #ddd';

      const comp = [findMorpheme('prefix', w.prefix)?.text, findMorpheme('suffix', w.suffix)?.text]
        .filter(Boolean).join(' + ');
      const title = document.createElement('div');
      title.className = 'guide-word';
      title.textContent = w.word;

      const composition = document.createElement('div');
      composition.className = 'guide-comp';
      composition.textContent = comp;

      const effect = document.createElement('div');
      effect.className = 'guide-effect';
      effect.textContent = w.effectText;

      const energy = document.createElement('div');
      energy.className = 'guide-energy';
      energy.textContent = `能量需求：${energyNeed}`;

      const status = document.createElement('div');
      status.className = 'guide-status';
      status.textContent = energyOk ? '可用' : presentAll ? '缺能量' : possible ? '可组合' : '';

      row.appendChild(title);
      row.appendChild(composition);
      row.appendChild(effect);
      row.appendChild(energy);
      if (status.textContent) row.appendChild(status);

      const btn = document.createElement('button');
      btn.className = 'guide-action';
      btn.textContent = '组合';
      btn.disabled = !presentAll;
      btn.title = presentAll ? '选中所需牌并打出组合' : '缺少必要牌';
      btn.addEventListener('click', () => this.autoFillCombo(w));
      row.appendChild(btn);
      listEl.appendChild(row);
    });
  }


  autoFillCombo(w) {
    const pickOrder = ['root','prefix','suffix'];
    const have = [];
    pickOrder.forEach(t => {
      const idNeeded = (t === 'prefix') ? w.prefix : (t === 'root') ? w.root : w.suffix;
      if (!idNeeded) return;
      const h = this.hand.find(c => c.type === t && c.morphemeId === idNeeded);
      if (h) have.push(h.id);
    });
    this.linkSelection = have;
    const match = this.findComboMatchFromSelection();
    if (!match) { alert('缺少必要牌，无法组合'); this.linkSelection = []; return; }
    this.spawnLinkedGroupCard(match);
    this.cancelLinking();
  }

  // 从组合暂存区把牌拖回手牌（不退能量）
  returnComboCard(type) {
    const idx = this.comboZone.findIndex(c => c.type === type && c.morphemeId === this.currentCombo[type]);
    if (idx !== -1) {
      const card = this.comboZone.splice(idx, 1)[0];
      this.hand.push(card);
      this.currentCombo[type] = null;
      this.updateUI();
      this.renderComboSlots();
    }
  }

  // 一键归还组合区所有牌到手牌（不退能量）
  returnAllComboCards() {
    const types = ['prefix','root','suffix'];
    types.forEach(t => {
      const idx = this.comboZone.findIndex(c => c.type === t && c.morphemeId === this.currentCombo[t]);
      if (idx !== -1) {
        const card = this.comboZone.splice(idx, 1)[0];
        this.hand.push(card);
        this.currentCombo[t] = null;
      }
    });
    this.updateUI();
    this.renderComboSlots();
    // 点击归还后，检查并清理组合槽中的残留图标
    this.checkAndCleanupComboSlots();
  }

  // 检查并清理：若组合槽无组合数据但仍有子元素或高亮，则清空与归位
  checkAndCleanupComboSlots() {
    const slotRoot = document.getElementById('slotRoot');
    const slotSuffix = document.getElementById('slotSuffix');
    const rootContent = slotRoot ? slotRoot.querySelector('.slot-content') : null;
    const suffixContent = slotSuffix ? slotSuffix.querySelector('.slot-content') : null;
    if (!rootContent || !suffixContent) return;

    const hasRootCombo = !!(this.currentCombo.prefix || this.currentCombo.root);
    const hasSuffixCombo = !!this.currentCombo.suffix;
    const rootChildren = rootContent.children.length;
    const suffixChildren = suffixContent.children.length;
    let cleaned = 0;

    if (!hasRootCombo && rootChildren > 0) {
      rootContent.innerHTML = '';
      cleaned++;
    }
    if (!hasSuffixCombo && suffixChildren > 0) {
      suffixContent.innerHTML = '';
      cleaned++;
    }
    // 去除拖拽残留高亮
    slotRoot && slotRoot.classList.remove('dragover');
    slotSuffix && slotSuffix.classList.remove('dragover');
    // 清除组合提示高亮
    if (slotRoot) slotRoot.style.outline = '';
    if (slotSuffix) slotSuffix.style.outline = '';

    if (cleaned) {
      Logger.info('组合槽清理：移除遗留图标', { cleaned, rootChildren, suffixChildren });
    }
  }

  async openRestCampfire() {
    const modal = document.getElementById('restModal');
    if (!modal) { alert('界面缺失：restModal'); return; }
    const content = modal.querySelector('.modal-content');
    if (!content) { alert('界面缺失：restModal 内容'); return; }
    content.innerHTML = '';
    const imgEl = document.createElement('img');
    imgEl.id = 'restSceneImage';
    imgEl.style.width = '100vw';
    imgEl.style.height = '100vh';
    imgEl.style.objectFit = 'cover';
    imgEl.style.display = 'block';
    content.appendChild(imgEl);
    const preload = (src) => new Promise((resolve) => {
      const i = new Image();
      i.onload = () => resolve();
      i.onerror = () => resolve();
      i.src = src;
    });
    const srcPlace = 'styles/rest place.png';
    const srcOver = 'styles/rest over.png';
    await preload(srcPlace);
    preload(srcOver);
    this.sceneTransition(() => {
      modal.classList.remove('hidden');
      imgEl.src = srcPlace;
    }, 1000);
    const onClick = async () => {
      await preload(srcOver);
      this.sceneTransition(() => {
        imgEl.src = srcOver;
      }, 1000);
      setTimeout(() => {
        const maxHp = this.player?.maxHp || 70;
        this.player.hp = Math.min(maxHp, this.player.hp + Math.floor(maxHp * 0.3));
        this.updateUI();
        this.sceneTransition(() => {
          try { modal.classList.add('hidden'); } catch (_) {}
        }, 1000);
      }, 2000);
      content.removeEventListener('click', onClick);
    };
    content.addEventListener('click', onClick);
  }

  triggerEvent(eventId, isTest = false) {
    if (!EVENTS || EVENTS.length === 0) {
      alert('暂无事件数据');
      this.showMap(true);
      return;
    }
    this.encounteredEvents = this.encounteredEvents || [];

    let event;
    if (eventId) {
      event = EVENTS.find(e => e.id === eventId);
    } else {
      if (isTest) {
        event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      } else {
        const candidates = EVENTS.filter(e => !this.encounteredEvents.includes(e.id));
        if (candidates.length > 0) {
          event = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        }
      }
    }
    if (!event) return;

    if (!isTest) {
      if (!this.encounteredEvents.includes(event.id)) {
        this.encounteredEvents.push(event.id);
      }
    }
    this.currentEventId = event.id;

    const modal = document.getElementById('eventModal');
    const titleEl = document.getElementById('eventTitle');
    const bodyEl = document.getElementById('eventBody');
    const optsEl = document.getElementById('eventOptions');
    const imgEl = document.getElementById('eventImage');
    if (!modal || !titleEl || !bodyEl || !optsEl) return;

    titleEl.textContent = event.title;
    bodyEl.textContent = event.body;
    if (imgEl && event.image) {
      imgEl.src = event.image;
    }
    optsEl.innerHTML = '';

    event.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'event-btn';
      btn.textContent = opt.text;
      btn.onclick = () => {
        this.handleEventAction(opt.action);
        // 不再自动关闭和 showMap，由 handleEventAction 决定
      };
      optsEl.appendChild(btn);
    });

    this.updateUI();
    this.sceneTransition(() => {
      modal.classList.remove('hidden');
    }, 1000);
  }

  handleEventAction(action) {
    const modal = document.getElementById('eventModal');
    const bodyEl = document.getElementById('eventBody');
    const optsEl = document.getElementById('eventOptions');
    
    const showResult = (msg) => {
      if (!modal || !bodyEl || !optsEl) return;
      bodyEl.textContent = msg;
      optsEl.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'event-btn';
      btn.textContent = '离开';
      btn.onclick = () => {
        this.sceneTransition(() => {
          modal.classList.add('hidden');
          this.showMap(true);
        }, 1000);
      };
      optsEl.appendChild(btn);
    };

    if (action === 'heal_30') {
      const heal = Math.floor(this.player.maxHp * 0.3);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      showResult(`你喝下了清澈的泉水，感觉身体恢复了活力。\n（恢复了 ${heal} 点生命值）`);
    } else if (action === 'get_random_card') {
      this.openCardChoicePicker(1, null, (picked) => {
        if (picked && picked.length) {
          const c = picked[0];
          this.deck.push(c);
          if (this.currentEventId === 'etymology_spring') {
            showResult('你把手伸入泉水，捞到了一张牌，不久后泉水便枯竭了');
          } else {
            showResult(`你获得了一张卡牌：\n${c.text} (${c.type})`);
          }
        } else {
          showResult('你没有选择任何卡牌。');
        }
      }, '从随机三张中选择一张加入牌组');
    } else if (action === 'observe_get_card') {
      this.openCardChoicePicker(1, null, (picked) => {
        if (picked && picked.length) {
          const c = picked[0];
          this.deck.push(c);
          if (this.currentEventId === 'mad_scribe') {
            showResult(`你躲在一边谨慎的看着抄写员，他似乎没有发现你，过了一会便怪叫着离开了，你确认他走远后上前捡到了他落下的一张单词卡：${c.text}`);
          } else {
            showResult(`你获得了一张卡牌：\n${c.text} (${c.type})`);
          }
        } else {
          showResult('你没有选择任何卡牌。');
        }
      }, '从随机三张中选择一张加入牌组');
    } else if (action === 'upgrade_random') {
       showResult('似乎什么也没发生。');
    } else if (action === 'trade_hp_rare' || action === 'read_curse') {
       const cost = action === 'trade_hp_rare' ? Math.floor(this.player.maxHp * 0.1) : 5;
       this.player.hp = Math.max(1, this.player.hp - cost);
       try { this.playCue('sound/attack.mp3'); } catch (_) {}
       impactStage();
       this.openCardChoicePicker(1, null, (picked) => {
         if (picked && picked.length) {
           const c = picked[0];
           this.deck.push(c);
           showResult(`你忍受着痛苦，获得了一张卡牌。\n（失去了 ${cost} 点生命值，获得 ${c.text}）`);
         } else {
           showResult(`你犹豫了，但代价已经付出。\n（失去 ${cost} HP）`);
         }
       }, '从随机三张中选择一张加入牌组');
    } else if (action === 'buy_heal') {
       const cost = 50;
       if ((this.player.gold || 0) < cost) {
         showResult(`你想购买补给，但金币不足。\n（需要 ${cost} 金币）`);
       } else {
         this.player.gold = (this.player.gold || 0) - cost;
         const heal = 20;
         this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
         showResult(`你购买了一些补给品，商人笑着离开了。\n（恢复了 ${heal} 点生命值，花费 ${cost} 金币）`);
       }
    } else if (action === 'remove_card') {
       modal.classList.add('hidden');
       this.openCardRemoveSelector((removedCard) => {
         modal.classList.remove('hidden');
         if (removedCard) {
           showResult(`你成功移除了一张卡牌，商人笑着离开了：\n${removedCard.text}`);
         } else {
           showResult('你没有移除任何卡牌，但是商人可没有退货的意思');
         }
       });
    } else if (action === 'sacrifice_hp_remove' || action === 'burn_book') {
        const cost = action === 'sacrifice_hp_remove' ? 10 : 5;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        modal.classList.add('hidden');
        this.openCardRemoveSelector((removedCard) => {
            modal.classList.remove('hidden');
            if (removedCard) {
                showResult(`你忍痛移除了卡牌，并付出了代价。\n（失去 ${cost} HP，移除 ${removedCard.text}）`);
            } else {
                showResult(`你犹豫了，但代价已经付出。\n（失去 ${cost} HP）`);
            }
        });
    } else if (action === 'pray_heal') {
        const heal = 15;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        showResult(`祈祷得到了回应。\n（恢复了 ${heal} 点生命值）`);
    } else if (action === 'rush_prefix') {
        const cost = 5;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        this.openCardChoicePicker(1, 'prefix', (picked) => {
          if (picked && picked.length) {
            const c = picked[0];
            this.deck.push(c);
            showResult(`你冲进左边的迷雾，找到了一张前缀牌。\n（失去 ${cost} HP，获得 ${c.text}）`);
          } else {
            showResult(`你犹豫了，但还是受了伤。\n（失去 ${cost} HP）`);
          }
        }, '选择一张前缀牌');
    } else if (action === 'rush_suffix') {
        const cost = 5;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        this.openCardChoicePicker(1, 'suffix', (picked) => {
          if (picked && picked.length) {
            const c = picked[0];
            this.deck.push(c);
            showResult(`你冲进右边的迷雾，找到了一张后缀牌。\n（失去 ${cost} HP，获得 ${c.text}）`);
          } else {
            showResult(`你犹豫了，但还是受了伤。\n（失去 ${cost} HP）`);
          }
        }, '选择一张后缀牌');
    } else if (action === 'rest_small') {
        const heal = 10;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        showResult(`你休息了一会儿，回过神时路口已经不见了。\n（恢复了 ${heal} 点生命值）`);
    } else if (action === 'rob_scribe') {
        const cost = 5;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        this.openCardChoicePicker(2, null, (picked) => {
          const names = (picked || []).map(c => c.text);
          if (picked && picked.length === 2) {
            this.deck.push(...picked);
            showResult(`你抢走了抄写员的笔和纸，他跟你争斗了一番，但没有打过你，不甘的逃跑了。\n（失去 ${cost} HP，获得 ${names.join(', ')}）`);
          } else if (picked && picked.length === 1) {
            this.deck.push(picked[0]);
            showResult(`你抢走了抄写员的笔和纸，但只来得及拿走一张。\n（失去 ${cost} HP，获得 ${names[0]}）`);
          } else {
            showResult(`你犹豫了，但代价已经付出。\n（失去 ${cost} HP）`);
          }
        }, '从随机三张中选择两张加入牌组');
    } else if (action === 'take_gold_pain') {
        const cost = 10;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        this.player.gold = (this.player.gold || 0) + 100;
        showResult(`你拿走了雕像，但不小心触发了机关，伤到了你的小腿，你忍痛逃跑了。\n（失去 ${cost} HP，获得 100 金币）`);
    } else if (action === 'red_pill') {
        const cost = 50;
        if ((this.player.gold || 0) < cost) {
          showResult(`你想吞下红药丸，但拿到嘴边时它便消失了，或许你缺了些什么。\n（需要 ${cost} 金币）`);
        } else {
          this.player.gold = (this.player.gold || 0) - cost;
          this.player.hp = this.player.maxHp;
          showResult(`你吞下红药丸，感觉全身充满了力量，但是好像丢失了了什么……\n（HP 回复至满值，失去 ${cost} 金币）`);
        }
    } else if (action === 'blue_pill') {
        const cost = 15;
        this.player.hp = Math.max(1, this.player.hp - cost);
        try { this.playCue('sound/attack.mp3'); } catch (_) {}
        impactStage();
        this.openCardChoicePicker(3, null, (picked) => {
          const names = (picked || []).map(c => c.text);
          if (picked && picked.length === 3) {
            this.deck.push(...picked);
            showResult(`你吞下蓝药丸，脑海中涌入了大量知识。\n（失去 ${cost} HP，获得 ${names.join(', ')}）`);
          } else if (picked && picked.length > 0) {
            this.deck.push(...picked);
            showResult(`你吞下蓝药丸，获得了部分知识。\n（失去 ${cost} HP，获得 ${names.join(', ')}）`);
          } else {
            showResult(`你犹豫了，但代价已经付出。\n（失去 ${cost} HP）`);
          }
        }, '从随机三张中选择三张加入牌组');
    } else if (action === 'gamble_5050') {
        if (Math.random() < 0.5) {
            this.openCardChoicePicker(1, null, (picked) => {
              if (picked && picked.length) {
                const c = picked[0];
                this.deck.push(c);
                showResult(`赌赢了！\n（获得 ${c.text}）`);
              } else {
                showResult('赌赢了，但你没有选择任何卡牌。');
              }
            }, '从随机三张中选择一张加入牌组');
        } else {
            const cost = 10;
            this.player.hp = Math.max(1, this.player.hp - cost);
            try { this.playCue('sound/attack.mp3'); } catch (_) {}
            impactStage();
            showResult(`赌输了……\n（失去 ${cost} HP）`);
        }
    } else if (action === 'leave') {
      this.sceneTransition(() => {
        modal.classList.add('hidden');
        this.showMap(true);
      }, 1000);
    }
    this.updateUI();
  }

  getRandomCard(specificType) {
    const types = ['prefix', 'root', 'suffix'];
    const type = specificType || types[Math.floor(Math.random() * types.length)];
    const source = type === 'prefix' ? PREFIXES : type === 'root' ? ROOTS : SUFFIXES;
    if (source && source.length > 0) {
      const rand = source[Math.floor(Math.random() * source.length)];
      return new Card(rand);
    }
    return null;
  }

  openCardChoicePicker(picksCount = 1, specificType = null, onComplete, titleOverride) {
    const modal = document.getElementById('drawPeekPicker');
    const list = document.getElementById('drawPeekList');
    const btnClose = document.getElementById('drawPeekClose');
    const btnCancelIcon = document.getElementById('drawPeekCancelIcon');
    const titleEl = modal ? modal.querySelector('.modal-title') : null;
    if (!modal || !list) return;
    if (titleEl) titleEl.textContent = titleOverride || '从随机三张中选择一张加入牌组';
    modal.classList.add('choice-3-row');
    const selected = [];
    const renderChoices = () => {
      list.innerHTML = '';
      const choices = [];
      while (choices.length < 3) {
        const c = this.getRandomCard(specificType);
        if (c) choices.push(c);
      }
      choices.forEach(card => {
        const tile = this.makeCardTile(card, () => {
          selected.push(card);
          if (selected.length >= picksCount) {
            modal.classList.add('hidden');
            modal.classList.remove('choice-3-row');
            if (btnClose) btnClose.onclick = null;
            if (onComplete) onComplete(selected);
          } else {
            renderChoices();
          }
        });
        list.appendChild(tile);
      });
      if (titleEl) titleEl.textContent = (titleOverride || '从随机三张中选择一张加入牌组') + (picksCount > 1 ? `（已选 ${selected.length}/${picksCount}）` : '');
    };
    renderChoices();
    modal.classList.remove('hidden');
    const doCancel = () => {
      modal.classList.add('hidden');
      modal.classList.remove('choice-3-row');
      if (onComplete) onComplete(null);
    };
    if (btnClose) btnClose.onclick = doCancel;
    if (btnCancelIcon) btnCancelIcon.onclick = doCancel;
  }

  openCardRemoveSelector(onComplete) {
    const modal = document.getElementById('removeCardPicker');
    const list = document.getElementById('removeCardList');
    const btnClose = document.getElementById('removeCardClose');
    const btnCancelIcon = document.getElementById('removeCardCancelIcon');
    if (!modal || !list) return;

    list.innerHTML = '';
    this.deck.forEach((card, index) => {
      const tile = this.makeCardTile(card, () => {
        const removed = this.deck.splice(index, 1)[0];
        modal.classList.add('hidden');
        if (onComplete) onComplete(removed);
      });
      list.appendChild(tile);
    });

    if (this.deck.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = '牌组为空';
      list.appendChild(empty);
    }

    modal.classList.remove('hidden');
    if (btnClose) {
      btnClose.onclick = () => {
        modal.classList.add('hidden');
        if (onComplete) onComplete(null);
      };
    }
    if (btnCancelIcon) {
      btnCancelIcon.onclick = () => {
        modal.classList.add('hidden');
        if (onComplete) onComplete(null);
      };
    }
  }

  openEventTestPicker() {
    const modal = document.getElementById('eventTestPicker');
    const list = document.getElementById('eventTestList');
    const btnClose = document.getElementById('eventTestClose');
    if (!modal || !list) return;

    list.innerHTML = '';
    const source = (typeof EVENTS !== 'undefined' && Array.isArray(EVENTS)) ? EVENTS : [];
    const renderList = source;

    if (!renderList || renderList.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'modal-empty';
      empty.textContent = '暂无事件数据';
      list.appendChild(empty);
    } else {
      renderList.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'modal-item';
        item.textContent = ev.title || ev.id || '未知事件';
        item.addEventListener('click', () => {
          modal.classList.add('hidden');
          this.triggerEvent(ev.id, true);
        });
        list.appendChild(item);
      });
    }

    modal.classList.remove('hidden');
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
  }

  showMap(show) {
    document.getElementById('mapView').classList.toggle('hidden', !show);
    document.querySelector('main.layout').style.display = show ? 'none' : 'grid';
    document.body.classList.toggle('map-mode', show);
    if (show) {
      const delayMs = this._pendingMapBgmDelayMs || 0;
      this._pendingMapBgmDelayMs = 0;
      if (!this.enemy) {
        if (delayMs > 0) {
          setTimeout(() => this.playBgm('music/zhucaidan.mp3', { loop: true, volume: 1 }), delayMs);
        } else {
          this.playBgm('music/zhucaidan.mp3', { loop: true, volume: 1 });
        }
      }
      this.renderTowerMap();
      const mapView = document.getElementById('mapView');
      const tower = document.getElementById('towerMap');
      if (!mapView || !tower) return;
      if (!this.didIntroScroll) {
        this.didIntroScroll = true;
        mapView.scrollTop = 0;
        const level = document.createElement('div');
        level.className = 'map-level-banner';
        level.textContent = '平层';
        document.body.appendChild(level);
        const start = performance.now();
        const duration = 4000;
        const from = 0;
        const to = Math.max(0, tower.scrollHeight - mapView.clientHeight);
        const fadeStart = 2000;
        const step = (now) => {
          const elapsed = now - start;
          const t = Math.min(1, elapsed / duration);
          mapView.scrollTop = from + (to - from) * t;
          if (elapsed >= fadeStart) {
            const fadeT = Math.min(1, (elapsed - fadeStart) / (duration - fadeStart));
            const base = 0.2;
            level.style.opacity = String(Math.max(0, base * (1 - fadeT)));
          }
          if (t < 1) requestAnimationFrame(step);
          else level.remove();
        };
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          let target;
          if (this.scrollToNextOnMap) {
            const curRow = this.tower?.pos?.row;
            const curIdx = this.tower?.pos?.idx;
            if (typeof curRow === 'number' && typeof curIdx === 'number') {
              const nextRow = curRow - 1;
              if (nextRow >= 0) {
                const prev = this.tower.nodes[curRow]?.[curIdx];
                const edges = prev && Array.isArray(prev.edges) ? prev.edges : [];
                const pickIdx = edges && edges.length ? Math.min(...edges) : 0;
                target = tower.querySelector(`.tower-node[data-row="${nextRow}"][data-idx="${pickIdx}"]`);
              }
            }
            this.scrollToNextOnMap = false;
          }
          if (!target) {
            let row = this.tower?.pos?.row;
            let idx = this.tower?.pos?.idx;
            if (row == null || row < 0) row = (this.tower.rows || 1) - 1;
            if (idx == null || idx < 0) idx = 0;
            target = tower.querySelector(`.tower-node[data-row="${row}"][data-idx="${idx}"]`);
          }
          if (target) {
            const vRect = mapView.getBoundingClientRect();
            const offsetTop = target.offsetTop;
            mapView.scrollTop = Math.max(0, offsetTop - (vRect.height / 2));
          }
        }, 0);
      }
    }
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  window.__game = new Game();
});
