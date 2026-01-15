const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 6000;

const SETTINGS = {
    // Shared
	CROSSHAIR_COLOR: '#ff69b4', // Default Pink
    PLAYER_SPEED: 1.5,
    PLAYER_HP: 10,
    ENEMY_SPEED: 1.3,
    ENEMY_HP: 2,
    ENEMY_DAMAGE: 1,
    SPAWN_RATE: 300,

    // Gunner
    BULLET_SPEED: 3,
    BULLET_COOLDOWN: 30,
    BULLET_DAMAGE: 1,
    BULLET_LIFE: 1200,

    // Swordsman
    SWORD_COOLDOWN: 40,    // Slightly slower than gun
    SWORD_DAMAGE: 2,       // Stronger hit
    SWORD_RADIUS: 80,      // Range of the slice
    SWORD_ARC: Math.PI / 2, // 90 Degrees (PI/2 radians)
    SWORD_DURATION: 10     // How long the slash visual lasts (frames)
};

const Utils = {
    getDist: (obj1, obj2) => Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2),
    getExpReq: (level) => {
        const term1 = Math.round(Math.pow(4 * (level + 1), 2.1));
        const term2 = Math.round(Math.pow(4 * level, 2.1));
        return term1 - term2;
    },
    clampToWorld: (obj) => {
        if (obj.x - obj.radius < 0) obj.x = obj.radius;
        if (obj.x + obj.radius > WORLD_WIDTH) obj.x = WORLD_WIDTH - obj.radius;
        if (obj.y - obj.radius < 0) obj.y = obj.radius;
        if (obj.y + obj.radius > WORLD_HEIGHT) obj.y = WORLD_HEIGHT - obj.radius;
    }
};