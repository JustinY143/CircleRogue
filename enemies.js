class EnemyProjectile {
    constructor(x, y, angle, damage) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * 4; // Faster than player
        this.vy = Math.sin(angle) * 4;
        this.damage = damage;
        this.radius = 6;
        this.life = 300; // 5 seconds
        this.dead = false;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#ff00ff'; ctx.fill(); ctx.closePath();
    }
}

class Enemy {
    constructor(x, y, stats, difficultyMult) {
        this.x = x; this.y = y;
        this.radius = stats.radius || 15;
        this.color = stats.color;
        // Apply Difficulty Multipliers
        this.speed = stats.speed; // Speed usually stays constant so game remains playable
        this.hp = stats.hp * difficultyMult.hp;
        this.damage = stats.damage * difficultyMult.dmg;
        this.expValue = stats.exp;
        
        this.dead = false;
        this.damageCooldown = 0; 
        
        // Archer specifics
        this.isArcher = stats.isArcher || false;
        this.shootTimer = 0;

        // Boss specifics
        this.isBoss = stats.isBoss || false;
    }

    update(target, projectiles) {
        if (this.damageCooldown > 0) this.damageCooldown--;
        
        // Archer Logic
        if (this.isArcher) {
            const dist = Utils.getDist(this, target);
            if (dist < 400) {
                // Stop and shoot if close enough
                this.shootTimer++;
                if (this.shootTimer > 90) { // 1.5 seconds (60fps * 1.5)
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    projectiles.push(new EnemyProjectile(this.x, this.y, angle, this.damage));
                    this.shootTimer = 0;
                }
            } else {
                // Move towards player
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        } else {
            // Standard Melee Logic
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }

    takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.dead = true; }

    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = this.isBoss ? 4 : 2; ctx.stroke(); ctx.closePath();
    }
}

const Spawner = {
    types: {
        BASIC:  { color: 'red', hp: 8, speed: 1.3, damage: 2, exp: 10, radius: 15 },
        FAST:   { color: '#FFD700', hp: 5, speed: 2.2, damage: 1, exp: 15, radius: 13 },
        TANK:   { color: '#8B0000', hp: 40, speed: 1.0, damage: 5, exp: 50, radius: 35 },
        ARCHER: { color: '#006400', hp: 15, speed: 0.7, damage: 10, exp: 30, radius: 18, isArcher: true }, // Dark Green
        BOSS:   { color: '#4B0082', hp: 2000, speed: 1.4, damage: 20, exp: 5000, radius: 120, isBoss: true } // Huge HP
    },
    spawn: (x, y, time, diffName) => {
        const mult = DIFFICULTY_MODS[diffName];
        let type = Spawner.types.BASIC;

        // 12 Minute Boss (720 seconds)
        // We only want ONE boss, but for simplicity in this structure, 
        // if time > 720 and random is very low, spawn boss (rare chance prevents spam, but ensures appearance)
        if (time > 420 && Math.random() < 0.02) return new Enemy(x, y, Spawner.types.BOSS, mult);

        // Standard Spawns
        if (time > 30 && Math.random() < 0.3) type = Spawner.types.FAST;
        if (time > 60 && Math.random() < 0.2) type = Spawner.types.TANK;
        if (time > 90 && Math.random() < 0.2) type = Spawner.types.ARCHER;

        return new Enemy(x, y, type, mult);
    }
};