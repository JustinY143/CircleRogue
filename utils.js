const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

// DIFFICULTY MULTIPLIERS (HP, Dmg, Speed is mostly constant)
const DIFFICULTY_MODS = {
    BEGINNER: { hp: 0.7, dmg: 0.7, score: 0.5 },
    NOVICE:   { hp: 1.0, dmg: 1.0, score: 1.0 },
    HARD:     { hp: 1.5, dmg: 1.5, score: 2.0 },
    UNKNOWN:  { hp: 2.5, dmg: 2.5, score: 5.0 } // The "???" Mode
};

const SETTINGS = {
    CROSSHAIR_COLOR: '#ff69b4',
    
    // BASE SPEEDS (Slow/Weighty feel)
    PLAYER_SPEED: 1.5,
	PLAYER_HP: 100,
    
    // Spawning: Higher = Slower
    SPAWN_RATE: 120, 

    // Gunner Base Stats
    BULLET_SPEED: 3,
    BULLET_COOLDOWN: 30,
    BULLET_DAMAGE: 5,
    BULLET_LIFE: 1200,

    // Swordsman Base Stats
    SWORD_COOLDOWN: 40,
    SWORD_DAMAGE: 10,
    SWORD_RADIUS: 130,
    SWORD_ARC: Math.PI / 1.5,
    SWORD_DURATION: 12
};

const Utils = {
    getDist: (obj1, obj2) => Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2),
    getExpReq: (level) => Math.floor(50 * Math.pow(level, 1.5)),
    clampToWorld: (obj) => {
        obj.x = Math.max(obj.radius, Math.min(WORLD_WIDTH - obj.radius, obj.x));
        obj.y = Math.max(obj.radius, Math.min(WORLD_HEIGHT - obj.radius, obj.y));
    }
};