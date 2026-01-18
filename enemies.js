class EnemyProjectile {
    constructor(x, y, angle, damage, isLaser = false) {
        this.x = x; this.y = y;
        this.isLaser = isLaser;
        if (isLaser) {
            // LASER PROPERTIES
            this.angle = angle;
            this.damage = damage;
            this.life = 15; // Linger duration
            this.radius = 50; // Half-width (Total width 100)
            this.dead = false;
        } else {
            // ARROW PROPERTIES
            this.vx = Math.cos(angle) * 4;
            this.vy = Math.sin(angle) * 4;
            this.damage = damage;
            this.radius = 6;
            this.life = 300; 
            this.dead = false;
        }
    }
    update() {
        if (!this.isLaser) {
            this.x += this.vx; this.y += this.vy;
        }
        this.life--;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        // Laser drawing is handled in Boss class for better layering/animations
        if (!this.isLaser) {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
            ctx.fillStyle = '#ff00ff'; ctx.fill(); ctx.closePath();
        }
    }
}

class Enemy {
    constructor(x, y, stats, difficultyMult) {
        this.x = x; this.y = y;
        this.radius = stats.radius || 15;
        this.color = stats.color;
        
        this.baseSpeed = stats.speed; // Store base speed to restore after slowing down
        this.speed = this.baseSpeed; 
        
        this.hp = stats.hp * difficultyMult.hp;
        this.maxHp = this.hp;
        this.damage = stats.damage * difficultyMult.dmg;
        this.expValue = stats.exp;
        
        this.dead = false;
        this.damageCooldown = 0; 
        
        this.isArcher = stats.isArcher || false;
        this.isBoss = stats.isBoss || false;
        
        // AI Timers
        this.timer = 0;
        this.bossState = 0; // 0: Chase, 1: Charge (1.5s), 2: Fire
        this.aimAngle = 0;
    }

    update(target, projectiles) {
        if (this.damageCooldown > 0) this.damageCooldown--;
        
        if (this.isBoss) {
            this.updateBoss(target, projectiles);
        } else if (this.isArcher) {
            this.updateArcher(target, projectiles);
        } else {
            // Standard Melee Logic
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }

    updateArcher(target, projectiles) {
        const dist = Utils.getDist(this, target);
        if (dist < 400) {
            this.timer++;
            if (this.timer > 90) { // Shoot every 1.5s
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                projectiles.push(new EnemyProjectile(this.x, this.y, angle, this.damage));
                this.timer = 0;
            }
        } else {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }

    updateBoss(target, projectiles) {
        // ALWAYS MOVE towards player, but speed depends on state
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // STATE 0: CHASE (Full Speed)
        if (this.bossState === 0) {
            this.speed = this.baseSpeed;
            this.timer++;
            if (this.timer > 200) { // Chase for ~3 seconds
                this.bossState = 1;
                this.timer = 0;
            }
        }
        // STATE 1: CHARGE (Half Speed, 1.5 Seconds)
        else if (this.bossState === 1) {
            this.speed = this.baseSpeed * 0.5; // Slow down
            
            // Lock aim angle only at the very start
            if (this.timer === 0) {
                this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
            }
            
            this.timer++;
            if (this.timer > 90) { // 1.5 Seconds (60fps * 1.5)
                this.bossState = 2;
                this.timer = 0;
                // Fire Wide Laser
                projectiles.push(new EnemyProjectile(this.x, this.y, this.aimAngle, this.damage * 2, true));
            }
        }
        // STATE 2: FIRE / RECOVER (Half Speed)
        else if (this.bossState === 2) {
            this.speed = this.baseSpeed * 0.5;
            this.timer++;
            if (this.timer > 30) { // Duration of blast visual
                this.bossState = 0;
                this.timer = 0;
            }
        }
    }

    takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.dead = true; }

    draw(ctx) {
        // Draw Body
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = this.isBoss ? 4 : 2; ctx.stroke(); ctx.closePath();

        // Boss Special Visuals
        if (this.isBoss) {
            // HP Bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 40, this.y - this.radius - 15, 80, 8);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - 40, this.y - this.radius - 15, 80 * (this.hp / this.maxHp), 8);

            // WIDE LASER VISUALS
            if (this.bossState === 1) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.aimAngle);
                
                // 1. Telegraph Box (Low opacity red, wide)
                // Width = 100px (Radius 50 * 2), Length = 1200px
                ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                ctx.fillRect(0, -50, 1200, 100);
                
                // 2. Charge Animation (Expanding from center)
                // It expands vertically from 0 height to 100 height over 90 frames
                const progress = this.timer / 90; 
                const currentHeight = 100 * progress;
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'; // Higher opacity indicator
                ctx.fillRect(0, -currentHeight / 2, 1200, currentHeight);
                
                // Outlines for clarity
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, -50, 1200, 100);

                ctx.restore();
            }
            if (this.bossState === 2) {
                // FIRING BEAM (Bright white core with red glow)
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.aimAngle);
                
                // Outer Glow
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.fillRect(0, -50, 1200, 100);
                
                // Inner Core
                ctx.fillStyle = 'white';
                ctx.fillRect(0, -20, 1200, 40);
                
                ctx.restore();
            }
        }
    }
}

const Spawner = {
    bossSpawned: false,
    types: {
        BASIC:  { color: 'red', hp: 8, speed: 1.3, damage: 2, exp: 10, radius: 15 },
        FAST:   { color: '#FFD700', hp: 5, speed: 2.2, damage: 1, exp: 15, radius: 13 },
        TANK:   { color: '#8B0000', hp: 40, speed: 1.0, damage: 5, exp: 50, radius: 35 },
        ARCHER: { color: '#006400', hp: 15, speed: 0.7, damage: 10, exp: 30, radius: 18, isArcher: true },
        BOSS:   { color: '#4B0082', hp: 3000, speed: 1.4, damage: 20, exp: 10000, radius: 80, isBoss: true }
    },
    spawn: (x, y, time, diffName) => {
        const mult = DIFFICULTY_MODS[diffName];
        const timeScale = 1 + (time / 60) * 0.15;

        // BOSS SPAWN: Exactly at 7 Minutes (420 seconds)
        if (time >= 420 && !Spawner.bossSpawned) {
            Spawner.bossSpawned = true;
            const b = new Enemy(x, y, Spawner.types.BOSS, mult);
            b.hp *= timeScale; 
            b.maxHp = b.hp;
            return b;
        }

        let type = Spawner.types.BASIC;
        if (time > 30 && Math.random() < 0.3) type = Spawner.types.FAST;
        if (time > 60 && Math.random() < 0.2) type = Spawner.types.TANK;
        if (time > 90 && Math.random() < 0.2) type = Spawner.types.ARCHER;

        const e = new Enemy(x, y, type, mult);
        e.hp *= timeScale;
        e.maxHp = e.hp;
        return e;
    }
};