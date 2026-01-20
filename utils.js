const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

const DIFFICULTY_MODS = {
    BEGINNER: { hp: 0.7, dmg: 0.7, score: 0.5 },
    NOVICE:   { hp: 1.0, dmg: 1.0, score: 1.0 },
    HARD:     { hp: 1.7, dmg: 1.7, score: 2.0 },
    UNKNOWN:  { hp: 3.0, dmg: 3.0, score: 4.0 }
};

const PLAYER_STATS = {
    GUNNER: { hp: 100, speed: 5 },
    SWORDSMAN: { hp: 175, speed: 6.5 }
};

const UPGRADE_SYSTEM = {
    hp: { baseCost: 750, costIncrease: 250, amount: 10 },
    dmg: { baseCost: 1000, costIncrease: 500, amount: 2 },
    crit: { baseCost: 1250, costIncrease: 500, amount: 0.05 },
    HEAL_UPGRADE_PERCENT: 0.25
};

const SPAWNING = {
    BASE_SPAWN_RATE: 150,
    RAMP_SPAWN_TIME: 420,
    RAMP_SPAWN_RATE_MIN: 20,
    BOSS_SPAWN_TIME: 420,
    SPAWN_DISTANCE: 1500
};

const COMBAT = {
    BULLET_SPEED: 15,
    BULLET_COOLDOWN: 15,
    BULLET_DAMAGE: 5,
    BULLET_LIFE: 180,
    
    SWORD_COOLDOWN: 20,
    SWORD_DAMAGE: 10,
    SWORD_RADIUS: 200,
    SWORD_ARC: Math.PI / 2.3,
    SWORD_DURATION: 10,
    
    PLAYER_IFRAME_TIME: 20
};

const EXP_SYSTEM = {
    BASE_EXP_PER_KILL: 5,
    EXP_FORMULA: (level) => Math.floor(50 * Math.pow(level, 1.3))
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
    lastTime: 0,
    fps: 60,
    frameCount: 0,
    fpsTime: 0,
    
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
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Get delta time for frame-independent movement
    getDeltaTime: function() {
        const now = Date.now();
        const deltaTime = now - Utils.lastTime;
        Utils.lastTime = now;
        
        // Calculate FPS
        Utils.frameCount++;
        Utils.fpsTime += deltaTime;
        if (Utils.fpsTime >= 1000) {
            Utils.fps = Math.round((Utils.frameCount * 1000) / Utils.fpsTime);
            Utils.frameCount = 0;
            Utils.fpsTime = 0;
        }
        
        // Cap delta time to prevent physics issues
        return Math.min(deltaTime / 16.67, 2.5); // Cap at 2.5x normal speed
    }

};


