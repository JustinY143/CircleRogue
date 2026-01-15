// --- STATE MANAGEMENT ---
const Game = {
    state: 'MENU',
    player: null,
    bullets: [],
    enemies: [],
    particles: [],
    slashes: [],
    frameCount: 0,
    
    uiMenu: document.getElementById('main-menu'),
    uiSelect: document.getElementById('char-select'),
    uiHUD: document.getElementById('hud'),
    uiDeath: document.getElementById('game-over'),
    uiSettings: document.getElementById('settings-menu'),

    toSettings: () => {
        Game.state = 'SETTINGS';
        Game.updateUI();
    },

    updateCrosshairColor: (color) => {
        SETTINGS.CROSSHAIR_COLOR = color;
    },

    toCharSelect: () => {
        Game.state = 'SELECT';
        Game.updateUI();
    },
    
    toMainMenu: () => {
        Game.state = 'MENU';
        Game.updateUI();
    },

    updateUI: () => {
        // Hide everything first
        [Game.uiMenu, Game.uiSelect, Game.uiHUD, Game.uiDeath, Game.uiSettings].forEach(el => el.classList.add('hidden'));
        
        // Hide system cursor only when playing
        if (Game.state === 'PLAYING') document.body.classList.add('playing-cursor');
        else document.body.classList.remove('playing-cursor');

        if (Game.state === 'MENU') Game.uiMenu.classList.remove('hidden');
        if (Game.state === 'SELECT') Game.uiSelect.classList.remove('hidden');
        if (Game.state === 'PLAYING') Game.uiHUD.classList.remove('hidden');
        if (Game.state === 'GAMEOVER') Game.uiDeath.classList.remove('hidden');
        if (Game.state === 'SETTINGS') Game.uiSettings.classList.remove('hidden');
    },

    start: (classType) => {
        Game.bullets = [];
        Game.enemies = [];
        Game.particles = [];
        Game.slashes = [];
        Game.frameCount = 0;
        
        const startX = WORLD_WIDTH / 2;
        const startY = WORLD_HEIGHT / 2;
        
        if (classType === 'gunner') Game.player = new Gunner(startX, startY);
        else if (classType === 'swordsman') Game.player = new Swordsman(startX, startY);
        
        Game.state = 'PLAYING';
        Game.updateUI();
    },
    
    die: () => {
        Game.state = 'GAMEOVER';
        document.getElementById('death-stats').innerText = `Level Reached: ${Game.player.level}`;
        Game.updateUI();
    }
};

// --- INPUTS ---
const keys = {};
const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);
window.addEventListener('resize', () => {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
});

// --- GAME LOOP ---
function update() {
    if (Game.state !== 'PLAYING') return;

    Game.frameCount++;
    const player = Game.player;

    // 1. Player Logic
    player.updateBase(keys);
    
    if (mouse.down) {
        // Calculate Aim relative to screen center
        const aimX = mouse.x - CANVAS.width / 2;
        const aimY = mouse.y - CANVAS.height / 2;

        if (player instanceof Gunner) {
            player.attack(aimX, aimY, Game.bullets);
        } else if (player instanceof Swordsman) {
            player.attack(aimX, aimY, Game.slashes, Game.enemies);
        }
    }

    // 2. Spawner
    if (Game.frameCount % SETTINGS.SPAWN_RATE === 0) {
        const count = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < count; i++) {
            let ex, ey, d;
            do {
                ex = Math.random() * WORLD_WIDTH;
                ey = Math.random() * WORLD_HEIGHT;
                d = Utils.getDist({x: ex, y: ey}, player);
            } while (d < CANVAS.width / 1.5);
            Game.enemies.push(new Enemy(ex, ey));
        }
    }

    // 3. Updates & Collisions
    Game.bullets.forEach(b => b.update());
    Game.slashes.forEach(s => s.update(player));
    Game.enemies.forEach(e => e.update(player));
    Game.particles.forEach(p => p.update(player));
    
    // Clean dead slashes
    Game.slashes = Game.slashes.filter(s => s.life > 0);

    // Bullet vs Enemy
    Game.bullets.forEach(b => {
        if (b.dead) return;
        Game.enemies.forEach(e => {
            if (e.dead) return;
            if (Utils.getDist(b, e) < b.radius + e.radius) {
                e.takeDamage(SETTINGS.BULLET_DAMAGE);
                b.dead = true;
            }
        });
    });

    // Enemy vs Player
    Game.enemies.forEach(e => {
        if (e.dead) return;
        if (Utils.getDist(e, player) < e.radius + player.radius) {
            player.takeDamage(SETTINGS.ENEMY_DAMAGE);
        }
    });

    // Death Check
    if (player.dead) {
        Game.die();
    }

    // Cleanup
    Game.enemies.forEach(e => { if (e.dead) Game.particles.push(new Particle(e.x, e.y, Math.floor(Math.random()*5)+1)); });
    Game.bullets = Game.bullets.filter(b => !b.dead);
    Game.enemies = Game.enemies.filter(e => !e.dead);
    Game.particles = Game.particles.filter(p => !p.dead);

    // Update UI text
    document.getElementById('hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-text').innerText = `${player.hp}/${player.maxHp} HP`;
    document.getElementById('exp-bar').style.width = (player.exp / player.expNext * 100) + '%';
    document.getElementById('exp-text').innerText = `Lvl ${player.level}`;
}

function draw() {
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);

    if (Game.state === 'PLAYING' || Game.state === 'GAMEOVER') {
        const player = Game.player;

        // FIXED CAMERA: Always center on player, no clamping.
        // This ensures mouse aim is always perfectly centered.
        let camX = player.x - CANVAS.width / 2;
        let camY = player.y - CANVAS.height / 2;

        CTX.save();
        CTX.translate(-camX, -camY);

        // Draw Void (Background outside of floor)
        CTX.fillStyle = '#111';
        CTX.fillRect(camX, camY, CANVAS.width, CANVAS.height);
        
        // Draw World Floor
        CTX.fillStyle = '#222'; 
        CTX.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Grid
        CTX.strokeStyle = '#333';
        for(let i=0; i<=WORLD_WIDTH; i+=100) { CTX.beginPath(); CTX.moveTo(i,0); CTX.lineTo(i,WORLD_HEIGHT); CTX.stroke(); }
        for(let i=0; i<=WORLD_HEIGHT; i+=100) { CTX.beginPath(); CTX.moveTo(0,i); CTX.lineTo(WORLD_WIDTH,i); CTX.stroke(); }

        Game.particles.forEach(p => p.draw(CTX));
        Game.enemies.forEach(e => e.draw(CTX));
        Game.bullets.forEach(b => b.draw(CTX));
        Game.slashes.forEach(s => s.draw(CTX));
        player.draw(CTX);

        CTX.restore();

        // DRAW CUSTOM CROSSHAIR (Drawn after restore so it ignores camera)
        if (Game.state === 'PLAYING') {
            drawCrosshair(mouse.x, mouse.y, SETTINGS.CROSSHAIR_COLOR);
        }
    }
}

function drawCrosshair(x, y, color) {
    const size = 6;   // Size of triangles
    const offset = 6; // Distance from center
    CTX.strokeStyle = 'white';
    CTX.fillStyle = color;
    CTX.lineWidth = 2;

    function drawPointer(rot) {
        CTX.save();
        CTX.translate(x, y);
        CTX.rotate(rot);
        CTX.beginPath();
        CTX.moveTo(-size/2, offset + size);
        CTX.lineTo(size/2, offset + size);
        CTX.lineTo(0, offset);
        CTX.closePath();
        CTX.stroke();
        CTX.fill();
        CTX.restore();
    }

    drawPointer(0);           // Bottom
    drawPointer(Math.PI);     // Top
    drawPointer(Math.PI / 2); // Left
    drawPointer(-Math.PI / 2);// Right
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Init
CANVAS.width = window.innerWidth;
CANVAS.height = window.innerHeight;
Game.updateUI(); // Show Main Menu initially
loop();