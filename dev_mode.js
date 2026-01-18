const DevMode = {
    toggle: function() {
        Game.devMode = !Game.devMode;
        if (Game.devMode) {
            console.log("Dev mode activated!");
        } else {
            console.log("Dev mode deactivated");
        }
        UI.update();
        
        // Refresh upgrade UI to show FREE prices
        if (Game.state === 'UPGRADES') {
            UI.updateUpgradeUI();
        }
    },
    
    spawnEnemy: function() {
        if (!Game.devMode || !Game.player) return;
        
        const select = document.getElementById('dev-enemy-select');
        const enemyType = select.value;
        
        const angle = Math.random() * Math.PI * 2;
        const spawnDist = SETTINGS.SPAWN_DISTANCE;
        const sx = Game.player.x + Math.cos(angle) * spawnDist;
        const sy = Game.player.y + Math.sin(angle) * spawnDist;
        
        const mult = DIFFICULTY_MODS[Game.currentDifficulty];
        let enemy;
        
        if (enemyType === 'BOSS') {
            enemy = new Enemy(sx, sy, Spawner.types.BOSS, mult);
        } else {
            enemy = new Enemy(sx, sy, Spawner.types[enemyType], mult);
        }
        
        Game.enemies.push(enemy);
        console.log(`Spawned ${enemyType} at (${sx.toFixed(0)}, ${sy.toFixed(0)})`);
    },
    
    createControls: function() {
        if (Game.devMode) {
            let devControls = document.getElementById('dev-controls');
            if (!devControls) {
                devControls = document.createElement('div');
                devControls.id = 'dev-controls';
                devControls.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; z-index: 1000; color: white;';
                document.body.appendChild(devControls);
            }
            devControls.innerHTML = `
                <div style="color: #00ff00; font-weight: bold;">DEV MODE ACTIVE</div>
                <div style="font-size: 12px; margin-bottom: 5px;">Spawn Enemy:</div>
                <select id="dev-enemy-select" style="margin-bottom: 5px;">
                    <option value="BASIC">Basic</option>
                    <option value="FAST">Fast</option>
                    <option value="TANK">Tank</option>
                    <option value="ARCHER">Archer</option>
                    <option value="BOSS">Boss</option>
                </select>
                <button onclick="DevMode.spawnEnemy()" style="padding: 5px 10px;">Spawn</button>
                <button onclick="DevMode.toggle()" style="padding: 5px 10px; margin-left: 5px; background: #800;">Exit Dev</button>
            `;
            devControls.classList.remove('hidden');
        } else {
            const devControls = document.getElementById('dev-controls');
            if (devControls) devControls.classList.add('hidden');
        }
    }
};