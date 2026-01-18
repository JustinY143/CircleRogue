const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

const DIFFICULTY_MODS = {
    BEGINNER: { hp: 0.7, dmg: 0.7, score: 0.5 },
    NOVICE:   { hp: 1.0, dmg: 1.0, score: 1.0 },
    HARD:     { hp: 2.0, dmg: 2.0, score: 2.0 },
    UNKNOWN:  { hp: 4.0, dmg: 4.0, score: 4.0 }
};

const PLAYER_STATS = {
    GUNNER: { hp: 100, speed: 1.5 },
    SWORDSMAN: { hp: 150, speed: 1.65 }
};

const UPGRADE_SYSTEM = {
    hp: { baseCost: 750, costIncrease: 200, amount: 10 },
    dmg: { baseCost: 1500, costIncrease: 300, amount: 2 },
    crit: { baseCost: 2000, costIncrease: 400, amount: 0.05 },
    HEAL_UPGRADE_PERCENT: 0.25
};

const SPAWNING = {
    BASE_SPAWN_RATE: 180,
    RAMP_SPAWN_TIME: 420,
    RAMP_SPAWN_RATE_MIN: 20,
    BOSS_SPAWN_TIME: 420,
    SPAWN_DISTANCE: 1500
};

const COMBAT = {
    BULLET_SPEED: 3,
    BULLET_COOLDOWN: 40,
    BULLET_DAMAGE: 5,
    BULLET_LIFE: 1200,
    
    SWORD_COOLDOWN: 45,
    SWORD_DAMAGE: 10,
    SWORD_RADIUS: 180,
    SWORD_ARC: Math.PI / 1.85,
    SWORD_DURATION: 12,
    
    PLAYER_IFRAME_TIME: 20
};

const EXP_SYSTEM = {
    BASE_EXP_PER_KILL: 5,
    EXP_FORMULA: (level) => Math.floor(50 * Math.pow(level, 1.5))
};

const UI_SETTINGS = {
    CROSSHAIR_COLOR: '#ff69b4',
    HUD_BLUR_ON_PAUSE: true
};

const SETTINGS = {
    ...PLAYER_STATS,
    UPGRADE_SYSTEM,
    ...SPAWNING,
    ...COMBAT,
    ...EXP_SYSTEM,
    ...UI_SETTINGS
};

const Utils = {
    getDist: (obj1, obj2) => Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2),
    getExpReq: (level) => SETTINGS.EXP_FORMULA(level),
    clampToWorld: (obj) => {
        obj.x = Math.max(obj.radius, Math.min(WORLD_WIDTH - obj.radius, obj.x));
        obj.y = Math.max(obj.radius, Math.min(WORLD_HEIGHT - obj.radius, obj.y));
    },
    
    getUpgradeCost: (type, currentLevel) => {
        const upgrade = SETTINGS.UPGRADE_SYSTEM[type];
        return upgrade.baseCost + (upgrade.costIncrease * currentLevel);
    },
    
    getUpgradeAmount: (type) => {
        return SETTINGS.UPGRADE_SYSTEM[type].amount;
    },
    
    calculateTotalDamage: (player) => {
        if (player instanceof Gunner) {
            return SETTINGS.BULLET_DAMAGE + player.stats.dmg;
        } else if (player instanceof Swordsman) {
            return SETTINGS.SWORD_DAMAGE + player.stats.dmg;
        }
        return 0;
    },
    
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};