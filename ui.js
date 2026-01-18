const UI = {
    elements: {},

    init: function() {
        // Cache UI elements
        UI.elements = {
            menu: document.getElementById('main-menu'),
            select: document.getElementById('char-select'),
            hud: document.getElementById('hud'),
            death: document.getElementById('game-over'),
            settings: document.getElementById('settings-menu'),
            upgrades: document.getElementById('upgrades-menu'),
            pause: document.getElementById('pause-menu'),
            expHeader: document.getElementById('exp-header'),
            levelText: document.getElementById('level-text'),
            timer: document.getElementById('timer-display'),
            levelUp: document.getElementById('levelup-menu'),
            resetConfirm: document.getElementById('reset-confirm'),
            lowHealthBorder: document.getElementById('low-health-border'),
            unlockNotification: null
        };
        
        Game.uiElements = UI.elements;
        
        // Create unlock notification element (hidden by default)
        UI.createUnlockNotification();
    },

    createUnlockNotification: function() {
        const notification = document.createElement('div');
        notification.id = 'unlock-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px;
            border: 3px solid #00d4ff;
            border-radius: 10px;
            z-index: 1000;
            text-align: center;
            display: none;
        `;
        notification.innerHTML = `
            <h2 style="color: #00d4ff; margin: 0 0 15px 0;">NEW DIFFICULTY UNLOCKED!</h2>
            <p style="font-size: 20px; margin: 0 0 20px 0;">"???" difficulty is now available</p>
            <button id="close-unlock-notification" style="
                background: #222;
                color: white;
                border: 2px solid #00d4ff;
                padding: 10px 20px;
                font-size: 18px;
                cursor: pointer;
            ">OK</button>
        `;
        document.body.appendChild(notification);
        UI.elements.unlockNotification = notification;
        
        // Add close button event
        document.getElementById('close-unlock-notification').onclick = function() {
            notification.style.display = 'none';
        };
    },

    showUnlockNotification: function() {
        if (UI.elements.unlockNotification) {
            UI.elements.unlockNotification.style.display = 'block';
        }
    },

    populateLevelUpCards: function() {
        const container = document.getElementById('upgrade-cards-container');
        container.innerHTML = '';
        
        // Get 3 random upgrades from the pool
        const availableUpgrades = [...Game.upgradePool];
        const selectedUpgrades = [];
        
        for (let i = 0; i < 3 && availableUpgrades.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            selectedUpgrades.push(availableUpgrades[randomIndex]);
            availableUpgrades.splice(randomIndex, 1);
        }
        
        // Create cards for each selected upgrade
        selectedUpgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <h3>${upgrade.title}</h3>
                <p>${upgrade.desc}</p>
                <div style="font-size: 40px; margin: 10px 0;">${upgrade.icon}</div>
            `;
            card.onclick = () => Game.applyInGameUpgrade(upgrade.id);
            container.appendChild(card);
        });
    },

    update: function() {
        const screens = [
            UI.elements.menu, UI.elements.select, UI.elements.death,
            UI.elements.settings, UI.elements.upgrades, UI.elements.pause,
            UI.elements.levelUp, UI.elements.resetConfirm
        ];
        
        // Hide all screens first
        screens.forEach(el => el.classList.add('hidden'));

        // Hide HUD elements by default
        UI.elements.hud.classList.add('hidden');
        UI.elements.timer.classList.add('hidden');
        UI.elements.expHeader.classList.add('hidden');
        UI.elements.levelText.classList.add('hidden');
        UI.elements.lowHealthBorder.classList.add('hidden');

        // Check if we're in an overlay state
        const isOverlayState = (
            Game.state === 'PAUSED' || 
            Game.state === 'GAMEOVER' || 
            Game.state === 'LEVELUP'
        );

        // Toggle overlay class on body
        if (isOverlayState) {
            document.body.classList.add('game-overlay-active');
        } else {
            document.body.classList.remove('game-overlay-active');
        }

        // Show HUD elements only during gameplay states
        if (Game.state === 'PLAYING' || Game.state === 'PAUSED' || Game.state === 'GAMEOVER' || Game.state === 'LEVELUP') {
            UI.elements.hud.classList.remove('hidden');
            UI.elements.timer.classList.remove('hidden');
            UI.elements.expHeader.classList.remove('hidden');
            UI.elements.levelText.classList.remove('hidden');
            UI.elements.lowHealthBorder.classList.remove('hidden');
        }

        // Handle cursor
        if (Game.state === 'PLAYING' && !Game.isPaused) {
            document.body.style.cursor = 'none';
            document.body.classList.add('playing-cursor');
        } else {
            document.body.style.cursor = 'default';
            document.body.classList.remove('playing-cursor');
        }

        // Show appropriate screen
        if (Game.state === 'MENU') UI.elements.menu.classList.remove('hidden');
        if (Game.state === 'SELECT') UI.elements.select.classList.remove('hidden');
        if (Game.state === 'GAMEOVER') UI.elements.death.classList.remove('hidden');
        if (Game.state === 'SETTINGS') UI.elements.settings.classList.remove('hidden');
        if (Game.state === 'PAUSED') UI.elements.pause.classList.remove('hidden');
        if (Game.state === 'UPGRADES') UI.elements.upgrades.classList.remove('hidden');
        if (Game.state === 'RESET_CONFIRM') UI.elements.resetConfirm.classList.remove('hidden');
        if (Game.state === 'LEVELUP') UI.elements.levelUp.classList.remove('hidden');
        
        // Update stats in pause menu
        if (Game.state === 'PAUSED' && Game.player) {
            UI.updateStatsDisplay();
        }
        
        // Update dev mode controls
        if (typeof DevMode !== 'undefined') {
            DevMode.createControls();
        }
    },

    updateUpgradeUI: function() {
        document.getElementById('total-points').innerText = `POINTS: ${Game.saveData.points}`;
        
        ['hp', 'dmg', 'crit'].forEach(type => {
            const currentLevel = Game.saveData.upgrades[type];
            const cost = Utils.getUpgradeCost(type, currentLevel);
            const amount = Utils.getUpgradeAmount(type);
            
            document.getElementById(`lvl-${type}`).innerText = `Lvl: ${currentLevel}`;
            
            let desc = '';
            if (type === 'hp') desc = `+${amount} Max HP`;
            else if (type === 'dmg') desc = `+${amount} Damage`;
            else if (type === 'crit') desc = `+${(amount * 100).toFixed(0)}% Crit Chance`;
            
            const btn = document.querySelector(`button[onclick="Game.buyUpgrade('${type}')"]`);
            if (btn) {
                btn.parentElement.querySelector('p:nth-of-type(1)').textContent = desc;
                btn.textContent = Game.devMode ? `Buy (FREE)` : `Buy (${cost} Pts)`;
            }
        });
    },

    updateStatsDisplay: function() {
        if (!Game.player) return;
        
        const stats = Game.player.getStats();
        let statsDiv = document.getElementById('pause-stats');
        
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'pause-stats';
            statsDiv.style.cssText = 'position: absolute; bottom: 20px; left: 20px; color: white; font-size: 16px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 5px; pointer-events: none; z-index: 30;';
            UI.elements.pause.appendChild(statsDiv);
        }
        
        statsDiv.innerHTML = `
            <div style="margin-bottom: 5px; color: #00d4ff; font-weight: bold;">PLAYER STATS</div>
            <div>Level: ${stats.level}</div>
            <div>HP: ${stats.hp}/${stats.maxHp}</div>
            <div>Damage: ${stats.damage}</div>
            <div>Crit Chance: ${stats.critChance}</div>
            <div>Speed: ${stats.speed}</div>
            <div>EXP: ${stats.exp}/${stats.expNext}</div>
        `;
    },

    showResetConfirm: function() {
        Game.state = 'RESET_CONFIRM';
        UI.update();
    },

    updateHUD: function() {
        if (!Game.player) return;
        
        const player = Game.player;
        document.getElementById('hp-bar-fill').style.width = (player.hp / player.maxHp * 100) + '%';
        document.getElementById('hp-text').innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
        document.getElementById('exp-bar-fill').style.width = (player.exp / player.expNext * 100) + '%';
        document.getElementById('level-text').innerText = `LV. ${player.level}`;
        document.getElementById('timer-display').innerText = Utils.formatTime(Game.elapsedTime);
        
        // Update low health border effect
        UI.updateLowHealthEffect();
    },

    updateLowHealthEffect: function() {
        if (!Game.player) return;
        
        const border = UI.elements.lowHealthBorder;
        const hpPercent = Game.player.hp / Game.player.maxHp;
        
        // Show red border when HP is below 30%
        if (hpPercent <= 0.3 && Game.state === 'PLAYING' && !Game.isPaused) {
            // Calculate opacity based on how low HP is (more red as HP decreases)
            const opacity = Math.max(0.3, 1 - (hpPercent / 0.3));
            border.style.opacity = opacity.toString();
            
            // Add pulsing animation when HP is critically low (below 15%)
            if (hpPercent <= 0.15) {
                border.classList.add('low-health-pulse');
            } else {
                border.classList.remove('low-health-pulse');
            }
        } else {
            border.style.opacity = '0';
            border.classList.remove('low-health-pulse');
        }
    }
};