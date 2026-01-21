let lastUpdateTime = Date.now();

function update() {
    if (Game.state !== 'PLAYING' || Game.isPaused) {
        lastUpdateTime = Date.now(); 
        return;
    }
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateTime;
    
    // Get time scale for 60 FPS reference
    const timeScale = Math.min(deltaTime / 16.67, 2.5); // Cap at 2.5x normal speed
    
    Game.frameCount++;
    const player = Game.player;
    
    // Update elapsed time based on real delta time
    if (!Game.isTimePaused) {
        Game.elapsedTime += deltaTime / 1000; // Convert to seconds
    }
    
    // Player movement with delta time
    player.updateBase(keys, timeScale);
    
    // Player attacks
    if (mouse.down) {
        const ax = (mouse.x - CANVAS.width/2) / Game.ZOOM_LEVEL;
        const ay = (mouse.y - CANVAS.height/2) / Game.ZOOM_LEVEL;
        
        if (player instanceof Gunner) player.attack(ax, ay, Game.bullets, timeScale);
        else player.attack(ax, ay, Game.slashes, Game.enemies, timeScale);
    }

    // Enemy spawning (now uses real time)
    if (!Game.devMode) {
        let currentSpawnRate = SETTINGS.BASE_SPAWN_RATE;
        if (Game.elapsedTime > SETTINGS.RAMP_SPAWN_TIME) {
            currentSpawnRate = Math.max(SETTINGS.RAMP_SPAWN_RATE_MIN, SETTINGS.BASE_SPAWN_RATE - (Game.elapsedTime - SETTINGS.RAMP_SPAWN_TIME));
        }
        
        let spawnCheckRate = Math.floor(currentSpawnRate);
        if (Game.bossActive) {
            spawnCheckRate = Math.floor(currentSpawnRate * 2); 
        }

        let isBossTime = (Math.floor(Game.elapsedTime) === SETTINGS.BOSS_SPAWN_TIME && !Spawner.bossSpawned);
        
        if (isBossTime || Game.frameCount % spawnCheckRate === 0) {
            const angle = Math.random() * Math.PI * 2;
            const sx = player.x + Math.cos(angle) * SETTINGS.SPAWN_DISTANCE;
            const sy = player.y + Math.sin(angle) * SETTINGS.SPAWN_DISTANCE;

            const enemy = Spawner.spawn(sx, sy, Game.elapsedTime, Game.currentDifficulty);
            if (enemy) {
                if (enemy.isBoss) {
                    Game.bossActive = true;
                    Game.startBossFight();
                }
                Game.enemies.push(enemy);
            }
        }
    }

    // Update all entities with time scaling
    Game.bullets.forEach(b => b.update(timeScale));
    Game.slashes.forEach(s => s.update(player, timeScale));
    Game.particles.forEach(p => p.update(player, timeScale));
    Game.enemyProjectiles.forEach(ep => ep.update(timeScale));
    
    // Update Damage Numbers
    Game.damageNumbers.forEach(dn => dn.update(timeScale));
    
    Game.enemies.forEach(e => {
        e.update(player, Game.enemyProjectiles, timeScale); 
        if (Utils.getDist(e, player) < e.radius + player.radius) {
            if (e.damageCooldown <= 0) {
                player.takeDamage(e.damage);
                e.damageCooldown = 60; 
                
                if (Game.bossActive || e.isBoss) {
                    Game.playerHitDuringBossFight();
                }
            }
        }
    });

    // Bullet collisions
    Game.bullets.forEach(b => {
        Game.enemies.forEach(e => {
            if (!b.dead && !e.dead && Utils.getDist(b, e) < b.radius + e.radius) {
                let dmgInfo = player.calculateDamage();
                e.takeDamage(dmgInfo.val); 
                b.dead = true;
                
                if (SETTINGS.SHOW_DAMAGE_NUMBERS) {
                    Game.damageNumbers.push(new DamageNumber(e.x, e.y, dmgInfo.val, dmgInfo.isCrit));
                }
            }
        });
    });

    // Projectile collisions
    Game.enemyProjectiles.forEach(ep => {
        if (!ep.dead) {
            let hit = false;
            
            if (ep.isLaser) {
                const distToSource = Math.sqrt((player.x - ep.x)**2 + (player.y - ep.y)**2);
                if (distToSource < 1200) {
                    const angleToPlayer = Math.atan2(player.y - ep.y, player.x - ep.x);
                    let angleDiff = angleToPlayer - ep.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
                    
                    const perpDist = Math.abs(Math.sin(angleDiff) * distToSource);
                    
                    if (perpDist < (ep.radius + player.radius) && Math.abs(angleDiff) < Math.PI/2) {
                         hit = true;
                    }
                }
            } else {
                if (Utils.getDist(ep, player) < ep.radius + player.radius) {
                    hit = true;
                }
            }

            if (hit) {
                player.takeDamage(ep.damage);
                if (!ep.isLaser) ep.dead = true; 
                
                if (Game.bossActive) {
                    Game.playerHitDuringBossFight();
                }
            }
        }
    });

    // Handle enemy deaths
    Game.enemies.forEach(e => { 
        if (e.dead && !e.scoreCounted) {
            if (e.isBoss) Game.bossKilled();
            Game.particles.push(new Particle(e.x, e.y, e.expValue)); 
            Game.score += SETTINGS.BASE_EXP_PER_KILL; 
            
            if (Game.recordEnemyKill) {
                Game.recordEnemyKill();
            }
            
            e.scoreCounted = true;
        } 
    });

    // Check player death
    if (player.dead) Game.die();

    // Clean up dead entities
    Game.bullets = Game.bullets.filter(b => !b.dead);
    Game.enemyProjectiles = Game.enemyProjectiles.filter(ep => !ep.dead);
    Game.enemies = Game.enemies.filter(e => !e.dead);
    Game.particles = Game.particles.filter(p => !p.dead);
    Game.slashes = Game.slashes.filter(s => s.life > 0);
    Game.damageNumbers = Game.damageNumbers.filter(dn => dn.life > 0);

    // Update HUD
    UI.updateHUD();
    
    // Update last update time for next frame
    lastUpdateTime = currentTime;
}

function draw() {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    
    const renderStates = ['PLAYING', 'PAUSED', 'GAMEOVER', 'LEVELUP', 'QUIT_CONFIRM'];
    
    if (renderStates.includes(Game.state)) {
        const player = Game.player;
        
        CTX.save();
        CTX.translate(CANVAS.width / 2, CANVAS.height / 2);
        CTX.scale(Game.ZOOM_LEVEL, Game.ZOOM_LEVEL);
        CTX.translate(-player.x, -player.y);

        // Draw grid
        CTX.strokeStyle = '#222'; 
        CTX.lineWidth = 2;
        CTX.beginPath();
        for(let x = 0; x <= WORLD_WIDTH; x += 100) { 
            CTX.moveTo(x, 0); 
            CTX.lineTo(x, WORLD_HEIGHT); 
        }
        for(let y = 0; y <= WORLD_HEIGHT; y += 100) { 
            CTX.moveTo(0, y); 
            CTX.lineTo(WORLD_WIDTH, y); 
        }
        CTX.stroke();

        // Draw all entities
        Game.particles.forEach(p => p.draw(CTX));
        Game.enemies.forEach(e => e.draw(CTX));
        Game.bullets.forEach(b => b.draw(CTX));
        Game.enemyProjectiles.forEach(ep => ep.draw(CTX));
        Game.slashes.forEach(s => s.draw(CTX));
        player.draw(CTX);
        
        // Draw damage numbers last so they appear on top
        Game.damageNumbers.forEach(dn => dn.draw(CTX));
        
        CTX.restore();
        
        // Draw crosshair
        if (Game.state === 'PLAYING' && !Game.isPaused) {
            drawCrosshair(mouse.x, mouse.y, SETTINGS.CROSSHAIR_COLOR);
        }
        
        // Draw FPS counter if enabled
        if (Game.showFPS) {
            drawFPS();
        }
    }
}

function drawCrosshair(x, y, color) {
    const size = 10; 
    const width = 15; 
    const gap = 15;
    
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(rot => {
        CTX.save(); 
        CTX.translate(x, y); 
        CTX.rotate(rot);
        CTX.beginPath(); 
        CTX.moveTo(-width / 2, gap + size);
        CTX.lineTo(0, gap); 
        CTX.lineTo(width / 2, gap + size); 
        CTX.closePath();
        CTX.strokeStyle = 'white'; 
        CTX.lineWidth = 2; 
        CTX.stroke();
        CTX.fillStyle = color; 
        CTX.fill(); 
        CTX.restore();
    });
}

function drawFPS() {
    CTX.save();
    CTX.fillStyle = 'rgba(0, 0, 0, 0.5)';
    CTX.fillRect(10, 10, 80, 30);
    CTX.fillStyle = Utils.fps > 30 ? '#00ff00' : (Utils.fps > 15 ? '#ffff00' : '#ff0000');
    CTX.font = 'bold 16px Arial';
    CTX.fillText(`FPS: ${Utils.fps}`, 15, 30);
    CTX.restore();
}

function gameLoop() { 
    // Initialize delta time
    if (Utils.lastTime === 0) {
        Utils.lastTime = Date.now();
    }
    
    update(); 
    draw(); 
    requestAnimationFrame(gameLoop); 
}

function initGame() {
    CANVAS.width = window.innerWidth; 
    CANVAS.height = window.innerHeight;
    lastUpdateTime = Date.now();
    Utils.lastTime = Date.now(); // Initialize delta time
    UI.init();
    UI.update();
    gameLoop();
}