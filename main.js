const Game = {
    state: 'MENU',
    isPaused: false,
    player: null, bullets: [], enemies: [], particles: [], slashes: [], enemyProjectiles: [],
    frameCount: 0, score: 0, startTime: 0, elapsedTime: 0,
    bossActive: false,
    
    ZOOM_LEVEL: 1.15,

    saveData: {
        points: 0,
        upgrades: { hp: 0, dmg: 0, crit: 0 },
        unlockedHardBoss: false
    },
    currentDifficulty: 'NOVICE',
    resetConfirmCount: 0, 

    uiMenu: document.getElementById('main-menu'),
    uiSelect: document.getElementById('char-select'),
    uiHUD: document.getElementById('hud'),
    uiDeath: document.getElementById('game-over'),
    uiSettings: document.getElementById('settings-menu'),
    uiUpgrades: document.getElementById('upgrades-menu'),
    uiPause: document.getElementById('pause-menu'),
    uiExpHeader: document.getElementById('exp-header'),
    uiLevelText: document.getElementById('level-text'),
    uiTimer: document.getElementById('timer-display'),
    uiLevelUp: document.getElementById('levelup-menu'),

    upgradePool: [
        { id: 'hp', title: 'Vitality', desc: 'Max HP +10', icon: '[ + ]' },
        { id: 'dmg', title: 'Strength', desc: 'Attack DMG +1', icon: '[ ! ]' },
        { id: 'crit', title: 'Deadly Aim', desc: 'Crit Chance +5%', icon: '[ * ]' },
        { id: 'heal', title: 'Recovery', desc: 'Heal 20 HP', icon: '[ H ]' }
    ],

    toLevelUp: () => {
        Game.isPaused = true;
        Game.updateUI();
        Game.uiLevelUp.classList.remove('hidden');
        
        const shuffled = [...Game.upgradePool].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);
        
        const container = document.getElementById('upgrade-cards-container');
        container.innerHTML = '';
        
        choices.forEach(upg => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div style="font-size: 30px; margin-bottom: 10px; color:#00d4ff">${upg.icon}</div>
                <h3 style="color:#00d4ff">${upg.title}</h3>
                <p>${upg.desc}</p>
            `;
            card.onclick = () => Game.applyInGameUpgrade(upg.id);
            container.appendChild(card);
        });
    },

    applyInGameUpgrade: (id) => {
        if (id === 'hp') {
            Game.player.maxHp += 10;
            Game.player.hp += 10;
        } else if (id === 'dmg') {
            Game.player.stats.dmg += 1;
        } else if (id === 'crit') {
            Game.player.stats.critChance += 0.05;
        } else if (id === 'heal') {
            Game.player.heal(20);
        }
        Game.uiLevelUp.classList.add('hidden');
        Game.isPaused = false;
        Game.updateUI();
    },

    load: () => {
        const data = localStorage.getItem('ClusterFuckSave');
        if (data) Game.saveData = JSON.parse(data);
        if (Game.saveData.unlockedHardBoss) {
            document.getElementById('btn-diff-unknown').classList.remove('hidden');
        }
    },
    save: () => {
        localStorage.setItem('ClusterFuckSave', JSON.stringify(Game.saveData));
    },
    resetProgress: () => {
        if (Game.resetConfirmCount === 0) {
            alert("Are you sure? Click Reset again to wipe all data.");
            Game.resetConfirmCount++;
            return;
        }
        localStorage.removeItem('ClusterFuckSave');
        location.reload();
    },

    toUpgrades: () => {
        Game.state = 'UPGRADES';
        Game.updateUpgradeUI();
        Game.updateUI();
    },
    buyUpgrade: (type) => {
        const costMap = { hp: 750, dmg: 1500, crit: 1000 };
        const cost = costMap[type];
        if (Game.saveData.points >= cost) {
            Game.saveData.points -= cost;
            Game.saveData.upgrades[type]++;
            Game.save();
            Game.updateUpgradeUI();
        }
    },
    updateUpgradeUI: () => {
        document.getElementById('total-points').innerText = `POINTS: ${Game.saveData.points}`;
        document.getElementById('lvl-hp').innerText = `Lvl: ${Game.saveData.upgrades.hp}`;
        document.getElementById('lvl-dmg').innerText = `Lvl: ${Game.saveData.upgrades.dmg}`;
        document.getElementById('lvl-crit').innerText = `Lvl: ${Game.saveData.upgrades.crit}`;
    },

    setDifficulty: (diff) => {
        Game.currentDifficulty = diff;
        document.getElementById('diff-label').innerText = diff;
        const flyout = document.querySelector('.flyout');
        if (flyout) {
            flyout.style.display = 'none';
            setTimeout(() => { flyout.style.display = ''; }, 500);
        }
    },

    toSettings: () => { Game.state = 'SETTINGS'; Game.resetConfirmCount = 0; Game.updateUI(); },
    updateCrosshairColor: (color) => { SETTINGS.CROSSHAIR_COLOR = color; },
    toCharSelect: () => { Game.state = 'SELECT'; Game.updateUI(); },
    toMainMenu: () => { Game.state = 'MENU'; Game.isPaused = false; Game.updateUI(); },
    togglePause: () => {
        if (Game.state !== 'PLAYING' && Game.state !== 'PAUSED') return;
        Game.isPaused = !Game.isPaused;
        Game.state = Game.isPaused ? 'PAUSED' : 'PLAYING';
        Game.updateUI();
    },

    updateUI: () => {
        const screens = [Game.uiMenu, Game.uiSelect, Game.uiHUD, Game.uiDeath, Game.uiSettings, Game.uiTimer, Game.uiPause, Game.uiExpHeader, Game.uiLevelText, Game.uiUpgrades, Game.uiLevelUp];
        screens.forEach(el => el.classList.add('hidden'));

        const isGameplay = (Game.state === 'PLAYING' && !Game.isPaused);
        
        if (isGameplay) {
            document.body.style.cursor = 'none';
            document.body.classList.add('playing-cursor');
            
            Game.uiHUD.classList.remove('hidden');
            Game.uiTimer.classList.remove('hidden');
            Game.uiExpHeader.classList.remove('hidden');
            Game.uiLevelText.classList.remove('hidden');
        } else {
            document.body.style.cursor = 'default';
            document.body.classList.remove('playing-cursor');
            if (Game.state === 'PAUSED' || Game.isPaused) {
                Game.uiHUD.classList.remove('hidden');
                Game.uiTimer.classList.remove('hidden');
                Game.uiExpHeader.classList.remove('hidden');
                Game.uiLevelText.classList.remove('hidden');
            }
        }

        if (Game.state === 'MENU') Game.uiMenu.classList.remove('hidden');
        if (Game.state === 'SELECT') Game.uiSelect.classList.remove('hidden');
        if (Game.state === 'GAMEOVER') Game.uiDeath.classList.remove('hidden');
        if (Game.state === 'SETTINGS') Game.uiSettings.classList.remove('hidden');
        if (Game.state === 'PAUSED') Game.uiPause.classList.remove('hidden');
        if (Game.state === 'UPGRADES') Game.uiUpgrades.classList.remove('hidden');
        if (Game.isPaused && Game.state === 'PLAYING' && !Game.uiLevelUp.classList.contains('hidden')) {
            Game.uiLevelUp.classList.remove('hidden');
        }
    },

    start: (classType) => {
        Game.bullets = []; Game.enemies = []; Game.particles = []; Game.slashes = []; Game.enemyProjectiles = [];
        Game.score = 0; Game.startTime = Date.now(); Game.elapsedTime = 0; Game.isPaused = false;
        
        Spawner.bossSpawned = false; 
        Game.bossActive = false;
        
        const startX = WORLD_WIDTH / 2, startY = WORLD_HEIGHT / 2;
        const upgrades = Game.saveData.upgrades;
        Game.player = (classType === 'gunner') 
            ? new Gunner(startX, startY, upgrades) 
            : new Swordsman(startX, startY, upgrades);
        
        Game.state = 'PLAYING';
        Game.updateUI();
    },
    
    die: () => {
        Game.state = 'GAMEOVER';
        const mins = Math.floor(Game.elapsedTime / 60), secs = Math.floor(Game.elapsedTime % 60);
        let diffMult = DIFFICULTY_MODS[Game.currentDifficulty].score;
        let pointsEarned = Math.floor((Game.score + Game.elapsedTime) * diffMult);
        Game.saveData.points += pointsEarned;
        Game.save();
        document.getElementById('death-stats').innerHTML = 
            `SURVIVED: ${mins}:${secs.toString().padStart(2, '0')}<br>POINTS: ${pointsEarned}`;
        Game.updateUI();
    },

    bossKilled: () => {
        Game.bossActive = false;
        if (Game.currentDifficulty === 'HARD' && !Game.saveData.unlockedHardBoss) {
            Game.saveData.unlockedHardBoss = true;
            Game.save();
            alert("??? DIFFICULTY UNLOCKED!");
            document.getElementById('btn-diff-unknown').classList.remove('hidden');
        }
    }
};

const keys = {}; const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', e => { if (e.key === 'Escape') Game.togglePause(); keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);
window.onload = Game.load;

function update() {
    if (Game.state !== 'PLAYING' || Game.isPaused) return;
    Game.frameCount++;
    Game.elapsedTime = (Date.now() - Game.startTime) / 1000;

    const player = Game.player;
    player.updateBase(keys);
    
    if (mouse.down) {
        const ax = (mouse.x - CANVAS.width/2) / Game.ZOOM_LEVEL;
        const ay = (mouse.y - CANVAS.height/2) / Game.ZOOM_LEVEL;
        
        if (player instanceof Gunner) player.attack(ax, ay, Game.bullets);
        else player.attack(ax, ay, Game.slashes, Game.enemies);
    }

    // --- SPAWNING LOGIC ---
    let currentSpawnRate = SETTINGS.BASE_SPAWN_RATE;
    // Ramp up difficulty after 7 minutes
    if (Game.elapsedTime > 420) {
        currentSpawnRate = Math.max(20, SETTINGS.BASE_SPAWN_RATE - (Game.elapsedTime - 420));
    }
    
    // SPAWN CHECK
    let shouldSpawn = false;
    let spawnCheckRate = Math.floor(currentSpawnRate);

    // If boss is active, SPAWN LESS (Half as often)
    if (Game.bossActive) {
        spawnCheckRate = Math.floor(currentSpawnRate * 2); 
    }

    let isBossTime = (Math.floor(Game.elapsedTime) === 420 && !Spawner.bossSpawned);
    
    if (isBossTime || Game.frameCount % spawnCheckRate === 0) {
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = 1500; 
        const sx = player.x + Math.cos(angle) * spawnDist;
        const sy = player.y + Math.sin(angle) * spawnDist;

        const enemy = Spawner.spawn(sx, sy, Game.elapsedTime, Game.currentDifficulty);
        if (enemy) {
            if (enemy.isBoss) Game.bossActive = true;
            Game.enemies.push(enemy);
        }
    }

    Game.bullets.forEach(b => b.update());
    Game.slashes.forEach(s => s.update(player));
    Game.particles.forEach(p => p.update(player));
    Game.enemyProjectiles.forEach(ep => ep.update());

    Game.enemies.forEach(e => {
        e.update(player, Game.enemyProjectiles); 
        if (Utils.getDist(e, player) < e.radius + player.radius) {
            if (e.damageCooldown <= 0) {
                player.takeDamage(e.damage);
                e.damageCooldown = 60; 
            }
        }
    });

    Game.bullets.forEach(b => {
        Game.enemies.forEach(e => {
            if (!b.dead && !e.dead && Utils.getDist(b, e) < b.radius + e.radius) {
                let dmg = player.calculateDamage(SETTINGS.BULLET_DAMAGE + player.stats.dmg);
                e.takeDamage(dmg); 
                b.dead = true;
            }
        });
    });

    // PROJECTILE COLLISION (Arrows & Lasers)
    Game.enemyProjectiles.forEach(ep => {
        if (!ep.dead) {
            let hit = false;
            
            if (ep.isLaser) {
                // LASER COLLISION (Line vs Circle approx)
                // If player is close enough to boss, we check the angle
                const distToSource = Math.sqrt((player.x - ep.x)**2 + (player.y - ep.y)**2);
                if (distToSource < 1200) { // Laser Length
                    const angleToPlayer = Math.atan2(player.y - ep.y, player.x - ep.x);
                    let angleDiff = angleToPlayer - ep.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
                    
                    // Laser width is ~100px. At distance D, angular width is ~ (width/D).
                    // Simplified: Check perpendicular distance
                    const perpDist = Math.abs(Math.sin(angleDiff) * distToSource);
                    
                    // If within width (50 radius + player radius) AND in front of boss
                    if (perpDist < (ep.radius + player.radius) && Math.abs(angleDiff) < Math.PI/2) {
                         hit = true;
                    }
                }
            } else {
                // ARROW COLLISION
                if (Utils.getDist(ep, player) < ep.radius + player.radius) {
                    hit = true;
                }
            }

            if (hit) {
                player.takeDamage(ep.damage);
                if (!ep.isLaser) ep.dead = true; 
            }
        }
    });

    Game.enemies.forEach(e => { 
        if (e.dead && !e.scoreCounted) {
            if (e.isBoss) Game.bossKilled();
            Game.particles.push(new Particle(e.x, e.y, e.expValue)); 
            Game.score += 5; e.scoreCounted = true;
        } 
    });

    if (player.dead) Game.die();

    Game.bullets = Game.bullets.filter(b => !b.dead);
    Game.enemyProjectiles = Game.enemyProjectiles.filter(ep => !ep.dead);
    Game.enemies = Game.enemies.filter(e => !e.dead);
    Game.particles = Game.particles.filter(p => !p.dead);
    Game.slashes = Game.slashes.filter(s => s.life > 0);

    document.getElementById('hp-bar-fill').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-text').innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    document.getElementById('exp-bar-fill').style.width = (player.exp / player.expNext * 100) + '%';
    document.getElementById('level-text').innerText = `LV. ${player.level}`;
    
    const mins = Math.floor(Game.elapsedTime / 60), secs = Math.floor(Game.elapsedTime % 60);
    document.getElementById('timer-display').innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function draw() {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    if (Game.state === 'PLAYING' || Game.state === 'PAUSED' || Game.state === 'GAMEOVER') {
        const player = Game.player;
        
        CTX.save();
        CTX.translate(CANVAS.width / 2, CANVAS.height / 2);
        CTX.scale(Game.ZOOM_LEVEL, Game.ZOOM_LEVEL);
        CTX.translate(-player.x, -player.y);

        CTX.strokeStyle = '#222'; CTX.lineWidth = 2;
        for(let x=0; x<=WORLD_WIDTH; x+=100) { CTX.beginPath(); CTX.moveTo(x,0); CTX.lineTo(x,WORLD_HEIGHT); CTX.stroke(); }
        for(let y=0; y<=WORLD_HEIGHT; y+=100) { CTX.beginPath(); CTX.moveTo(0,y); CTX.lineTo(WORLD_WIDTH,y); CTX.stroke(); }

        Game.particles.forEach(p => p.draw(CTX));
        Game.enemies.forEach(e => e.draw(CTX));
        Game.bullets.forEach(b => b.draw(CTX));
        Game.enemyProjectiles.forEach(ep => ep.draw(CTX));
        Game.slashes.forEach(s => s.draw(CTX));
        player.draw(CTX);
        
        CTX.restore();
        
        if (Game.state === 'PLAYING' && !Game.isPaused) {
            drawCrosshair(mouse.x, mouse.y, SETTINGS.CROSSHAIR_COLOR);
        }
    }
}

function drawCrosshair(x, y, color) {
    const size = 10; const width = 15; const gap = 15;
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(rot => {
        CTX.save(); CTX.translate(x, y); CTX.rotate(rot);
        CTX.beginPath(); CTX.moveTo(-width / 2, gap + size);
        CTX.lineTo(0, gap); CTX.lineTo(width / 2, gap + size); CTX.closePath();
        CTX.strokeStyle = 'white'; CTX.lineWidth = 2; CTX.stroke();
        CTX.fillStyle = color; CTX.fill(); CTX.restore();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
CANVAS.width = window.innerWidth; CANVAS.height = window.innerHeight;
Game.updateUI(); loop();