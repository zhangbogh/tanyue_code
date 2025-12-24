// 游戏平衡与参数配置（可后续外部化成 JSON）
const CONFIG = {
  energyPerTurn: 5,
  handSize: 5,
  drawPerTurn: 5,
  baseDamage: 2,
  comboMultiplier: 2,
  enemyBaseHp: 100,
  enemyIntentWeights: {
    attack: 0.45,
    defend: 0.30,
    debuff: 0.15,
    buff: 0.10,
  },
};
