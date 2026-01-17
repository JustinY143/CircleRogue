const Game = {
    state: 'MENU',
    isPaused: false,
    player: null, bullets: [], enemies: [], particles: [], slashes: [], enemyProjectiles: [],
    frameCount: 0, score: 0, startTime: 0, elapsedTime: 0,
    
    // Persistent Data
    saveData: {
        points: 0,
        upgrades: { hp: 0, dmg: 0, crit: 0 },
        unlockedHardBoss: false
    },
    currentDifficulty: 'NOVICE',
    resetConfirmCount: 0, 

    // UI Refs
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
		{ id: 'crit', title: 'Deadly Aim', desc: 'Crit Chance +2%', icon: '[ * ]' },
		{ id: 'heal', title: 'Recovery', desc: 'Heal 20 HP', icon: '[ H ]' }
	],

    toLevelUp: () => {
        Game.isPaused = true;
        Game.uiLevelUp.classList.remove('hidden');
        
        // Pick 3 random unique upgrades from the pool of 4
        const shuffled = [...Game.upgradePool].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);
        
        const container = document.getElementById('upgrade-cards-container');
        container.innerHTML = '';
        
        choices.forEach(upg => {
            const card = document.createElement('div');
            card.className = 'char-card'; // Reuse your card styling
            card.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 10px;">${upg.icon}</div>
                <h3>${upg.title}</h3>
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
            Game.player.stats.critChance += 0.02;
        } else if (id === 'heal') {
            Game.player.heal(20);
        }
        
        Game.uiLevelUp.classList.add('hidden');
        Game.isPaused = false;
    },

    // --- SAVE SYSTEM ---
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

    // --- UPGRADES ---
    toUpgrades: () => {
        Game.state = 'UPGRADES';
        Game.updateUpgradeUI();
        Game.updateUI();
    },
    buyUpgrade: (type) => {
        // INCREASED COSTS
        const costMap = { hp: 1000, dmg: 2500, crit: 2000 };
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
        document.getElementById('lvl-hp').innerText = `Lvl: ${Game.saveData.upgrades.hp} (+${Game.saveData.upgrades.hp * 10} HP)`;
        document.getElementById('lvl-dmg').innerText = `Lvl: ${Game.saveData.upgrades.dmg} (+${Game.saveData.upgrades.dmg} Dmg)`;
        document.getElementById('lvl-crit').innerText = `Lvl: ${Game.saveData.upgrades.crit} (+${Game.saveData.upgrades.crit * 2}% Crit)`;
    },

    // --- DIFFICULTY ---
    setDifficulty: (diff) => {
    Game.currentDifficulty = diff;
    document.getElementById('diff-label').innerText = diff;
    
    // Force the flyout to hide after selection
    const flyout = document.querySelector('.flyout');
    if (flyout) {
        flyout.style.display = 'none';
        // Reset the display after a short delay so hover works again later
        setTimeout(() => { flyout.style.display = ''; }, 500);
    }
},

    // --- NAVIGATION ---
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
        const screens = [Game.uiMenu, Game.uiSelect, Game.uiHUD, Game.uiDeath, Game.uiSettings, Game.uiTimer, Game.uiPause, Game.uiExpHeader, Game.uiLevelText, Game.uiUpgrades];
        screens.forEach(el => el.classList.add('hidden'));
		
		// CURSOR LOGIC:
		// If playing AND not paused, show the crosshair. Otherwise, show normal cursor.
		if (Game.state === 'PLAYING' && !Game.isPaused) {
			document.body.style.cursor = 'none'; // Keeps the custom canvas crosshair only
		} else {
			document.body.style.cursor = 'default'; // Restores normal arrow for menus
		}
		
        if (Game.state === 'PLAYING' || Game.state === 'PAUSED') {
            document.body.classList.add('playing-cursor');
            Game.uiHUD.classList.remove('hidden');
            Game.uiTimer.classList.remove('hidden');
            Game.uiExpHeader.classList.remove('hidden');
            Game.uiLevelText.classList.remove('hidden');
        } else {
            document.body.classList.remove('playing-cursor');
        }

        if (Game.state === 'MENU') Game.uiMenu.classList.remove('hidden');
        if (Game.state === 'SELECT') Game.uiSelect.classList.remove('hidden');
        if (Game.state === 'GAMEOVER') Game.uiDeath.classList.remove('hidden');
        if (Game.state === 'SETTINGS') Game.uiSettings.classList.remove('hidden');
        if (Game.state === 'PAUSED') Game.uiPause.classList.remove('hidden');
        if (Game.state === 'UPGRADES') Game.uiUpgrades.classList.remove('hidden');
    },

    start: (classType) => {
        Game.bullets = []; Game.enemies = []; Game.particles = []; Game.slashes = []; Game.enemyProjectiles = [];
        Game.score = 0; Game.startTime = Date.now(); Game.elapsedTime = 0; Game.isPaused = false;
        const startX = WORLD_WIDTH / 2, startY = WORLD_HEIGHT / 2;
        
        // Pass Upgrades to Player
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
            `SURVIVED: ${mins}:${secs.toString().padStart(2, '0')}<br>
             POINTS EARNED: ${pointsEarned}<br>
             TOTAL POINTS: ${Game.saveData.points}`;
        
        Game.updateUI();
    },

    bossKilled: () => {
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
        const ax = mouse.x - CANVAS.width/2, ay = mouse.y - CANVAS.height/2;
        if (player instanceof Gunner) player.attack(ax, ay, Game.bullets);
        else player.attack(ax, ay, Game.slashes, Game.enemies);
    }

    if (Game.frameCount % SETTINGS.SPAWN_RATE === 0) {
    const player = Game.player;
    
    // 1. Pick a random angle (0 to 360 degrees)
    const angle = Math.random() * Math.PI * 2;
    
    // 2. Set a spawn distance (e.g., 1000 pixels away from player)
    // This ensures they spawn off-screen but can walk toward the player
    const spawnDist = 2000; 
    
    // 3. Calculate the spawn coordinates relative to the player
    const sx = player.x + Math.cos(angle) * spawnDist;
    const sy = player.y + Math.sin(angle) * spawnDist;

    // 4. Spawn the enemy at these coordinates (even if they are < 0 or > WORLD_WIDTH)
    Game.enemies.push(Spawner.spawn(sx, sy, Game.elapsedTime, Game.currentDifficulty));
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

    Game.enemyProjectiles.forEach(ep => {
        if (!ep.dead && Utils.getDist(ep, player) < ep.radius + player.radius) {
            player.takeDamage(ep.damage);
            ep.dead = true;
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
        let camX = player.x - CANVAS.width/2, camY = player.y - CANVAS.height/2;
        CTX.save(); CTX.translate(-camX, -camY);

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
        if (Game.state === 'PLAYING') drawCrosshair(mouse.x, mouse.y, SETTINGS.CROSSHAIR_COLOR);
    }
}

function drawCrosshair(x, y, color) {
    const size = 10;      // Length of each triangle pointer
    const width = 15;     // Width of the triangle base
    const gap = 15;       // Distance from the center point
    const borderWidth = 2; // Thickness of the white outline

    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    angles.forEach(rot => {
        CTX.save();
        CTX.translate(x, y);
        CTX.rotate(rot);

        // Draw the triangle pointing inward
        // Path: Base corner -> Tip -> Other base corner
        CTX.beginPath();
        CTX.moveTo(-width / 2, gap + size); // Bottom left of triangle
        CTX.lineTo(0, gap);                 // Tip (closest to center)
        CTX.lineTo(width / 2, gap + size);  // Bottom right of triangle
        CTX.closePath();

        // White border (outer layer)
        CTX.strokeStyle = 'white';
        CTX.lineWidth = borderWidth;
        CTX.lineJoin = 'round';
        CTX.stroke();

        // Pink fill (inner layer)
        CTX.fillStyle = color; // Uses the SETTINGS.CROSSHAIR_COLOR (pink)
        CTX.fill();

        CTX.restore();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
CANVAS.width = window.innerWidth; CANVAS.height = window.innerHeight;
Game.updateUI(); loop();