class Player {
    constructor(x, y, color, upgrades, baseHp, baseSpeed) {
        this.x = x; this.y = y; this.radius = 20; this.color = color;
        this.speed = baseSpeed;
        
        const stats = upgrades || { hp: 0, dmg: 0, crit: 0 };
        
        const bonusHP = (stats.hp || 0) * Utils.getUpgradeAmount('hp');
        this.maxHp = baseHp + bonusHP;
        this.hp = this.maxHp;
        
        this.stats = {
            dmg: (stats.dmg || 0) * Utils.getUpgradeAmount('dmg'),
            critChance: (stats.crit || 0) * Utils.getUpgradeAmount('crit'),
            speed: baseSpeed
        };

        this.level = 1; this.exp = 0; this.expNext = Utils.getExpReq(1);
        this.attackTimer = 0; this.dead = false;
        this.iframeTimer = 0;
    }

    calculateDamage() {
        const baseDamage = (this instanceof Gunner) ? SETTINGS.BULLET_DAMAGE : SETTINGS.SWORD_DAMAGE;
        const totalDamage = baseDamage + this.stats.dmg;
        
        let multiplier = 1;
        let chance = this.stats.critChance;
        while (chance > 0) {
            if (Math.random() < chance) multiplier *= 2; 
            chance -= 1.0;
        }
        return totalDamage * multiplier;
    }

    updateBase(keys, timeScale = 1) {
        let moveX = 0; let moveY = 0;
        if (keys['w']) moveY -= 1;
        if (keys['s']) moveY += 1;
        if (keys['a']) moveX -= 1;
        if (keys['d']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            this.x += (moveX / length) * this.speed * timeScale;
            this.y += (moveY / length) * this.speed * timeScale;
        }
        
        Utils.clampToWorld(this);
        if (this.attackTimer > 0) this.attackTimer -= timeScale;
        if (this.iframeTimer > 0) this.iframeTimer -= timeScale;
    }
    
    takeDamage(dmg) { 
        if (this.iframeTimer > 0) return; 
        this.hp -= dmg; 
        this.iframeTimer = SETTINGS.PLAYER_IFRAME_TIME; 
        if (this.hp <= 0) this.dead = true; 
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expNext) {
            this.exp -= this.expNext; 
            this.level++;
            this.expNext = Utils.getExpReq(this.level);
            Game.toLevelUp(); 
        }
    }
    
    getStats() {
        const totalDamage = Utils.calculateTotalDamage(this);
        
        return {
            level: this.level,
            hp: Math.ceil(this.hp),
            maxHp: this.maxHp,
            damage: totalDamage,
            critChance: (this.stats.critChance * 100).toFixed(1) + '%',
            speed: this.speed.toFixed(2),
            exp: this.exp,
            expNext: this.expNext
        };
    }
    
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); ctx.closePath();
    }
}

class Gunner extends Player {
    constructor(x, y, upgrades) { 
        super(x, y, '#D8BFD8', upgrades, SETTINGS.GUNNER.hp, SETTINGS.GUNNER.speed); 
    }
    attack(ax, ay, bullets, timeScale = 1) {
        if (this.attackTimer > 0) return;
        const angle = Math.atan2(ay, ax);
        bullets.push(new Bullet(this.x, this.y, angle));
        this.attackTimer = SETTINGS.BULLET_COOLDOWN;
    }
}

class Swordsman extends Player {
    constructor(x, y, upgrades) { 
        super(x, y, '#00ff00', upgrades, SETTINGS.SWORDSMAN.hp, SETTINGS.SWORDSMAN.speed); 
    }
    attack(ax, ay, slashes, enemies, timeScale = 1) {
        if (this.attackTimer > 0) return;
        const angle = Math.atan2(ay, ax);
        slashes.push(new Slash(this.x, this.y, angle));
        
        enemies.forEach(e => {
            const dist = Utils.getDist(this, e);
            if (dist < SETTINGS.SWORD_RADIUS + e.radius) {
                const angleToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                let diff = angleToEnemy - angle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (Math.abs(diff) < SETTINGS.SWORD_ARC / 2) {
                    let dmg = this.calculateDamage();
                    e.takeDamage(dmg);
                }
            }
        });
        this.attackTimer = SETTINGS.SWORD_COOLDOWN;
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x; this.y = y; this.radius = 5;
        this.vx = Math.cos(angle) * SETTINGS.BULLET_SPEED;
        this.vy = Math.sin(angle) * SETTINGS.BULLET_SPEED;
        this.life = SETTINGS.BULLET_LIFE; this.dead = false;
    }
    update(timeScale = 1) {
        this.x += this.vx * timeScale; 
        this.y += this.vy * timeScale; 
        this.life -= timeScale;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = 'yellow'; ctx.fill(); ctx.closePath();
    }
}

class Slash {
    constructor(x, y, angle) {
        this.x = x; this.y = y; this.angle = angle;
        this.life = SETTINGS.SWORD_DURATION;
        this.trailParticles = [];
    }
    
    update(player, timeScale = 1) { 
        this.x = player.x; 
        this.y = player.y; 
        this.life -= timeScale;
    }
    
    draw(ctx) {
        const baseOpacity = this.life / SETTINGS.SWORD_DURATION;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle - SETTINGS.SWORD_ARC / 2);
        
        const gradient = ctx.createRadialGradient(
            0, 0, 10,
            SETTINGS.SWORD_RADIUS * 0.7, SETTINGS.SWORD_RADIUS * 0.3, SETTINGS.SWORD_RADIUS
        );
        
        gradient.addColorStop(0, `rgba(0, 255, 100, ${baseOpacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 150, ${baseOpacity * 0.4})`);
        gradient.addColorStop(1, `rgba(0, 255, 100, ${baseOpacity * 0.1})`);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, SETTINGS.SWORD_RADIUS, 0, SETTINGS.SWORD_ARC);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, SETTINGS.SWORD_RADIUS, 0, SETTINGS.SWORD_ARC);
        ctx.strokeStyle = `rgba(0, 255, 200, ${baseOpacity * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, val) {
        this.x = x; this.y = y; this.value = val; this.radius = 5; this.dead = false;
        const a = Math.random()*Math.PI*2;
        this.vx = Math.cos(a)*5; this.vy = Math.sin(a)*5;
    }
    update(player, timeScale = 1) {
        this.x += this.vx * timeScale; 
        this.y += this.vy * timeScale; 
        this.vx *= 0.9; 
        this.vy *= 0.9;
        const d = Utils.getDist(this, player);
        if(d < 160) { 
            const a = Math.atan2(player.y - this.y, player.x - this.x);
            const s = (160 - d) / 20;
            this.x += Math.cos(a) * s * timeScale; 
            this.y += Math.sin(a) * s * timeScale;
        }
        if(d < player.radius + this.radius) { 
            player.gainExp(this.value * 2); 
            this.dead = true; 
        }
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#00d4ff'; 
        ctx.shadowBlur = 8; ctx.shadowColor = '#00d4ff'; ctx.fill();
        ctx.shadowBlur = 0; ctx.closePath();
    }
}