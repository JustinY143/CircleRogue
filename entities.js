class Player {
    constructor(x, y, color, upgrades) {
        this.x = x; this.y = y; this.radius = 20; this.color = color;
        this.speed = SETTINGS.PLAYER_SPEED;
        
        const stats = upgrades || { hp: 0, dmg: 0, crit: 0 };
        
        const bonusHP = (stats.hp || 0) * 10; 
        this.maxHp = SETTINGS.PLAYER_HP + bonusHP;
        this.hp = this.maxHp;
        
        this.stats = {
            dmg: (stats.dmg || 0) * 1,
            critChance: (stats.crit || 0) * 0.05
        };

        this.level = 1; this.exp = 0; this.expNext = Utils.getExpReq(1);
        this.attackTimer = 0; this.dead = false;
        this.iframeTimer = 0;
    }

    calculateDamage(baseDmg) {
        let multiplier = 1;
        let chance = this.stats.critChance;
        while (chance > 0) {
            if (Math.random() < chance) multiplier *= 2; 
            chance -= 1.0;
        }
        return baseDmg * multiplier;
    }

    updateBase(keys) {
        let moveX = 0; let moveY = 0;
        if (keys['w']) moveY -= 1;
        if (keys['s']) moveY += 1;
        if (keys['a']) moveX -= 1;
        if (keys['d']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            this.x += (moveX / length) * this.speed;
            this.y += (moveY / length) * this.speed;
        }
        
        Utils.clampToWorld(this);
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.iframeTimer > 0) this.iframeTimer--;
    }
    
    takeDamage(dmg) { 
        if (this.iframeTimer > 0) return; 
        this.hp -= dmg; 
        this.iframeTimer = 20; 
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
            this.hp = Math.min(this.maxHp, this.hp + 20); 
            Game.toLevelUp(); 
        }
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); ctx.closePath();
    }
}

class Gunner extends Player {
    constructor(x, y, upgrades) { super(x, y, '#D8BFD8', upgrades); }
    attack(ax, ay, bullets) {
        if (this.attackTimer > 0) return;
        const angle = Math.atan2(ay, ax);
        bullets.push(new Bullet(this.x, this.y, angle));
        this.attackTimer = SETTINGS.BULLET_COOLDOWN;
    }
}

class Swordsman extends Player {
    constructor(x, y, upgrades) { super(x, y, '#00ff00', upgrades); }
    attack(ax, ay, slashes, enemies) {
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
                    let dmg = this.calculateDamage(SETTINGS.SWORD_DAMAGE + this.stats.dmg);
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
    update() {
        this.x += this.vx; this.y += this.vy; this.life--;
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
    }
    update(player) { this.x = player.x; this.y = player.y; this.life--; }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, SETTINGS.SWORD_RADIUS, this.angle - SETTINGS.SWORD_ARC/2, this.angle + SETTINGS.SWORD_ARC/2);
        ctx.strokeStyle = `rgba(0, 255, 0, ${this.life / SETTINGS.SWORD_DURATION})`;
        ctx.lineWidth = 10; ctx.stroke(); ctx.closePath();
    }
}

class Particle {
    constructor(x, y, val) {
        this.x = x; this.y = y; this.value = val; this.radius = 5; this.dead = false;
        const a = Math.random()*Math.PI*2;
        this.vx = Math.cos(a)*5; this.vy = Math.sin(a)*5;
    }
    update(player) {
        this.x += this.vx; this.y += this.vy; this.vx *= 0.9; this.vy *= 0.9;
        const d = Utils.getDist(this, player);
        if(d < 160) { 
            const a = Math.atan2(player.y - this.y, player.x - this.x);
            const s = (160 - d) / 20;
            this.x += Math.cos(a) * s; this.y += Math.sin(a) * s;
        }
        if(d < player.radius + this.radius) { 
            player.gainExp(this.value); 
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