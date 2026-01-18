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
    attack(ax, ay, bullets) {
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
        this.trailParticles = [];
        
        // Create trail particles for a better slash effect
        for (let i = 0; i < 8; i++) {
            const offset = (i / 8) * SETTINGS.SWORD_RADIUS;
            const trailAngle = angle + (Math.random() - 0.5) * SETTINGS.SWORD_ARC * 0.3;
            this.trailParticles.push({
                x: x + Math.cos(trailAngle) * offset,
                y: y + Math.sin(trailAngle) * offset,
                life: this.life - i * 2,
                maxLife: this.life - i * 2,
                size: 8 - i * 0.5
            });
        }
    }
    
    update(player) { 
        this.x = player.x; 
        this.y = player.y; 
        this.life--;
        
        // Update trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.life--;
            
            // Move particles slightly outward for trail effect
            particle.x = player.x + Math.cos(this.angle) * ((SETTINGS.SWORD_RADIUS * particle.life) / particle.maxLife);
            particle.y = player.y + Math.sin(this.angle) * ((SETTINGS.SWORD_RADIUS * particle.life) / particle.maxLife);
            
            // Add some random drift
            particle.x += (Math.random() - 0.5) * 5;
            particle.y += (Math.random() - 0.5) * 5;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        const baseOpacity = this.life / SETTINGS.SWORD_DURATION;
        
        // Draw trail particles (glowing dots along the slash path)
        this.trailParticles.forEach(particle => {
            const particleOpacity = particle.life / particle.maxLife;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particleOpacity, 0, Math.PI * 2);
            
            // Glowing green effect
            ctx.fillStyle = `rgba(0, 255, 100, ${particleOpacity * 0.5})`;
            ctx.fill();
            
            // Outer glow
            ctx.strokeStyle = `rgba(0, 255, 200, ${particleOpacity * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        });
        
        // Draw multiple layers for a glowing sword effect
        for (let i = 3; i >= 0; i--) {
            const radius = SETTINGS.SWORD_RADIUS + i * 10;
            const opacity = baseOpacity * (0.7 - i * 0.15);
            const lineWidth = 12 - i * 2;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, this.angle - SETTINGS.SWORD_ARC/2, this.angle + SETTINGS.SWORD_ARC/2);
            
            // Gradient from bright green at center to lighter at edges
            const gradient = ctx.createLinearGradient(
                this.x + Math.cos(this.angle - SETTINGS.SWORD_ARC/2) * radius,
                this.y + Math.sin(this.angle - SETTINGS.SWORD_ARC/2) * radius,
                this.x + Math.cos(this.angle + SETTINGS.SWORD_ARC/2) * radius,
                this.y + Math.sin(this.angle + SETTINGS.SWORD_ARC/2) * radius
            );
            
            gradient.addColorStop(0, `rgba(0, 255, 50, ${opacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 200, ${opacity * 0.8})`);
            gradient.addColorStop(1, `rgba(0, 255, 50, ${opacity * 0.6})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.closePath();
        }
        
        // Draw the main slash arc with highest opacity
        ctx.beginPath();
        ctx.arc(this.x, this.y, SETTINGS.SWORD_RADIUS, this.angle - SETTINGS.SWORD_ARC/2, this.angle + SETTINGS.SWORD_ARC/2);
        
        // Bright center line
        const centerGradient = ctx.createLinearGradient(
            this.x + Math.cos(this.angle - SETTINGS.SWORD_ARC/2) * SETTINGS.SWORD_RADIUS,
            this.y + Math.sin(this.angle - SETTINGS.SWORD_ARC/2) * SETTINGS.SWORD_RADIUS,
            this.x + Math.cos(this.angle + SETTINGS.SWORD_ARC/2) * SETTINGS.SWORD_RADIUS,
            this.y + Math.sin(this.angle + SETTINGS.SWORD_ARC/2) * SETTINGS.SWORD_RADIUS
        );
        
        centerGradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity * 0.8})`);
        centerGradient.addColorStop(0.5, `rgba(200, 255, 255, ${baseOpacity})`);
        centerGradient.addColorStop(1, `rgba(255, 255, 255, ${baseOpacity * 0.8})`);
        
        ctx.strokeStyle = centerGradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();
        
        // Draw spark particles at the tip of the slash
        if (baseOpacity > 0.5) {
            const tipX = this.x + Math.cos(this.angle) * SETTINGS.SWORD_RADIUS;
            const tipY = this.y + Math.sin(this.angle) * SETTINGS.SWORD_RADIUS;
            
            ctx.beginPath();
            ctx.arc(tipX, tipY, 5 * baseOpacity, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
            ctx.fill();
            
            // Glow around the tip
            ctx.beginPath();
            ctx.arc(tipX, tipY, 10 * baseOpacity, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 200, ${baseOpacity * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
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