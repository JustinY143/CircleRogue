// --- BASE PLAYER ---
class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.color = color;
        this.speed = SETTINGS.PLAYER_SPEED;
        this.hp = SETTINGS.PLAYER_HP;
        this.maxHp = SETTINGS.PLAYER_HP;
        this.level = 1;
        this.exp = 0;
        this.expNext = Utils.getExpReq(1);
        this.iframeTimer = 0;
        this.attackTimer = 0;
        this.dead = false;
    }

    updateBase(keys) {
        if (keys['w']) this.y -= this.speed;
        if (keys['s']) this.y += this.speed;
        if (keys['a']) this.x -= this.speed;
        if (keys['d']) this.x += this.speed;
        Utils.clampToWorld(this);
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.iframeTimer > 0) this.iframeTimer--;
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expNext) {
            this.exp -= this.expNext;
            this.level++;
            this.expNext = Utils.getExpReq(this.level);
        }
    }
    
    takeDamage(dmg) {
        if (this.iframeTimer <= 0) {
            this.hp -= dmg;
            this.iframeTimer = 30;
            if (this.hp <= 0) this.dead = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.iframeTimer > 0 && Math.floor(Date.now() / 50) % 2 ? '#fff' : this.color;
        ctx.fill();
        ctx.closePath();
    }
}

// --- GUNNER CLASS ---
class Gunner extends Player {
    constructor(x, y) {
        super(x, y, '#D8BFD8'); // Light Purple
    }

    attack(targetX, targetY, bulletsArray) {
        if (this.attackTimer <= 0) {
            const angle = Math.atan2(targetY, targetX); // Target is relative to player
            bulletsArray.push(new Bullet(this.x, this.y, angle));
            this.attackTimer = SETTINGS.BULLET_COOLDOWN;
        }
    }
}

// --- SWORDSMAN CLASS ---
class Swordsman extends Player {
    constructor(x, y) {
        super(x, y, '#00ff00'); // Green
    }

    attack(targetX, targetY, visualArray, enemyArray) {
        if (this.attackTimer <= 0) {
            const angle = Math.atan2(targetY, targetX);
            
            // 1. Create Visual Slash
            visualArray.push(new SwordSlash(this.x, this.y, angle));

            // 2. Calculate Hitbox (90 degree Cone)
            enemyArray.forEach(e => {
                const dist = Utils.getDist(this, e);
                if (dist < SETTINGS.SWORD_RADIUS + e.radius) {
                    // Check angle difference
                    const angleToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                    let angleDiff = angleToEnemy - angle;
                    
                    // Normalize angle to -PI to +PI
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    // If within 45 degrees (half of 90) either side
                    if (Math.abs(angleDiff) < SETTINGS.SWORD_ARC / 2) {
                        e.takeDamage(SETTINGS.SWORD_DAMAGE);
                    }
                }
            });

            this.attackTimer = SETTINGS.SWORD_COOLDOWN;
        }
    }
}

// --- SWORD SLASH VISUAL ---
class SwordSlash {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.life = SETTINGS.SWORD_DURATION;
    }
    update(player) {
        this.x = player.x; // Follow player
        this.y = player.y;
        this.life--;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Rotate to face mouse
        
        ctx.beginPath();
        // Draw Arc: From -45deg to +45deg
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SETTINGS.SWORD_RADIUS, -SETTINGS.SWORD_ARC/2, SETTINGS.SWORD_ARC/2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    }
}

// --- BULLET ---
class Bullet {
    constructor(x, y, angle) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * SETTINGS.BULLET_SPEED;
        this.vy = Math.sin(angle) * SETTINGS.BULLET_SPEED;
        this.radius = 5;
        this.life = SETTINGS.BULLET_LIFE;
        this.dead = false;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
        if (this.life <= 0 || this.x<0 || this.x>WORLD_WIDTH || this.y<0 || this.y>WORLD_HEIGHT) this.dead = true;
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = 'yellow'; ctx.fill(); ctx.closePath();
    }
}

// --- ENEMY ---
class Enemy {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 15;
        this.color = 'red';
        this.speed = SETTINGS.ENEMY_SPEED;
        this.hp = SETTINGS.ENEMY_HP;
        this.dead = false;
    }
    update(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill(); ctx.closePath();
    }
}

// --- PARTICLE (EXP) ---
class Particle {
    constructor(x, y, val) {
        this.x = x; this.y = y; this.value = val;
        this.radius = 4 + val/2; this.dead = false;
        const a = Math.random()*Math.PI*2;
        this.vx = Math.cos(a)*5; this.vy = Math.sin(a)*5;
    }
    update(player) {
        this.x+=this.vx; this.y+=this.vy;
        this.vx*=0.9; this.vy*=0.9;
        const d = Utils.getDist(this, player);
        if(d < 200) {
            const a = Math.atan2(player.y-this.y, player.x-this.x);
            const s = (250-d)/20;
            this.x+=Math.cos(a)*s; this.y+=Math.sin(a)*s;
        }
        if(d < player.radius+this.radius) { player.gainExp(this.value); this.dead = true; }
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = 'gold'; ctx.fill(); ctx.closePath();
    }
}