class EnemyProjectile {
    constructor(x, y, angle, damage, isLaser = false) {
        this.x = x; this.y = y;
        this.isLaser = isLaser;
        if (isLaser) {
            // Laser properties
            this.angle = angle;
            this.damage = damage;
            this.life = 10; // Hitbox lingers briefly
            this.radius = 20; // Thick beam
            this.dead = false;
        } else {
            // Standard arrow properties
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
        if (this.isLaser) {
             // Laser drawing handled by Boss class usually, but if independent:
             // (Logic moved to Boss class for better visual control)
        } else {
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
        
        this.speed = stats.speed; 
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
        this.bossState = 0; // 0: Chase, 1: Lock/Charge, 2: Fire
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
        // STATE 0: CHASE
        if (this.bossState === 0) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
            
            this.timer++;
            if (this.timer > 200) { // Chase for ~3 seconds
                this.bossState = 1;
                this.timer = 0;
            }
        }
        // STATE 1: CHARGE / LOCK ON
        else if (this.bossState === 1) {
            // Lock angle at the start of charge
            if (this.timer === 0) {
                this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
            }
            // Warning Line is drawn in draw()
            this.timer++;
            if (this.timer > 60) { // Charge for 1 second
                this.bossState = 2;
                this.timer = 0;
                // Fire Logic: Create an invisible projectile for hitbox or handle hitscan here
                // For simplicity, we handle damage via hitscan in Main.js or here
                // We will create a special projectile that acts as the beam hitbox
                projectiles.push(new EnemyProjectile(this.x, this.y, this.aimAngle, this.damage * 2, true));
            }
        }
        // STATE 2: FIRE / COOLDOWN
        else if (this.bossState === 2) {
            // Laser visual is lingering
            this.timer++;
            if (this.timer > 30) { // Recover for 0.5s
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
            // HP Bar for Boss
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 40, this.y - this.radius - 10, 80, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x - 40, this.y - this.radius - 10, 80 * (this.hp / this.maxHp), 5);

            if (this.bossState === 1) {
                // Charging Line (Red, thin)
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.aimAngle);
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
                ctx.restore();
            }
            if (this.bossState === 2) {
                // Firing Beam (Bright, thick)
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.aimAngle);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 20;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1000, 0); ctx.stroke();
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
        
        // --- HP SCALING OVER TIME ---
        // HP multiplier increases by 0.1 every minute.
        // At 12 mins (720s): 1 + (720/60)*0.1 = 1 + 1.2 = 2.2x HP
        const timeScale = 1 + (time / 60) * 0.15;

        // BOSS SPAWN: Exactly at 7 Minutes (420 seconds)
        // We use a flag to ensure it only spawns once.
        if (time >= 420 && !Spawner.bossSpawned) {
            Spawner.bossSpawned = true;
            const b = new Enemy(x, y, Spawner.types.BOSS, mult);
            // Boss HP scaling
            b.hp *= timeScale; 
            b.maxHp = b.hp;
            return b;
        }

        // Logic handled in Main.js: If boss is active, do not call Spawner.spawn for standard mobs.
        // This function simply returns the mob requested.

        let type = Spawner.types.BASIC;
        if (time > 30 && Math.random() < 0.3) type = Spawner.types.FAST;
        if (time > 60 && Math.random() < 0.2) type = Spawner.types.TANK;
        if (time > 90 && Math.random() < 0.2) type = Spawner.types.ARCHER;

        const e = new Enemy(x, y, type, mult);
        e.hp *= timeScale; // Apply Time Scaling
        e.maxHp = e.hp;
        return e;
    }
};