const UI = {
    elements: {},

    init: function() {
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
            achievements: document.getElementById('achievements-menu'),
            playerStats: document.getElementById('player-stats-menu'),
            unlockNotification: null,
            quitConfirm: document.getElementById('quit-confirm')
        };
        
        Game.uiElements = UI.elements;
        
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
        
        document.getElementById('close-unlock-notification').onclick = function() {
            notification.style.display = 'none';
        };
    },

    showUnlockNotification: function() {
        if (UI.elements.unlockNotification) {
            UI.elements.unlockNotification.style.display = 'block';
        }
    },
    
    updateFPSButton: function() {
        const fpsButton = document.getElementById('toggle-fps-btn');
        if (fpsButton) {
            fpsButton.textContent = Game.showFPS ? 'Hide FPS' : 'Show FPS';
        }
    },
    
    populatePlayerStats: function() {
        const container = document.getElementById('stats-content');
        if (!container) return;
        
        const stats = Game.saveData.achievements || {};
        const upgrades = Game.saveData.upgrades || {};
        
        const totalUpgrades = (upgrades.hp || 0) + (upgrades.dmg || 0) + (upgrades.crit || 0);
        
        const playTimeHours = (stats.totalPlayTime || 0) / 3600;
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Total Play Time</div>
                    <div class="stat-value">${playTimeHours.toFixed(1)} hours</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Kills</div>
                    <div class="stat-value">${stats.totalKills || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Points</div>
                    <div class="stat-value">${Game.saveData.points || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Deaths</div>
                    <div class="stat-value">${stats.deathCount || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total Upgrades</div>
                    <div class="stat-value">${totalUpgrades}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">No-Hit Boss Kills</div>
                    <div class="stat-value">${stats.noHitBossKills || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Max Survival Time</div>
                    <div class="stat-value">${Utils.formatTime(stats.maxSurvivalTime || 0)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Max Kills in Run</div>
                    <div class="stat-value">${stats.maxKillsInRun || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Max Points in Run</div>
                    <div class="stat-value">${stats.maxPointsInRun || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Boss Kills (Beginner)</div>
                    <div class="stat-value">${(stats.bossKillsByDiff && stats.bossKillsByDiff.BEGINNER) || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Boss Kills (Novice)</div>
                    <div class="stat-value">${(stats.bossKillsByDiff && stats.bossKillsByDiff.NOVICE) || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Boss Kills (Hard)</div>
                    <div class="stat-value">${(stats.bossKillsByDiff && stats.bossKillsByDiff.HARD) || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Boss Kills (???)</div>
                    <div class="stat-value">${(stats.bossKillsByDiff && stats.bossKillsByDiff.UNKNOWN) || 0}</div>
                </div>
            </div>
        `;
    },
    
    populateAchievements: function() {
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';
        
        if (!Achievements || !Achievements.list) return;
        
        const achievements = Achievements.list;
        let unlockedCount = 0;
        
        achievements.forEach(achievement => {
            const isUnlocked = achievement.check();
            if (isUnlocked) unlockedCount++;
            
            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                <div class="achievement-status ${isUnlocked ? 'unlocked' : ''}">
                    ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </div>
            `;
            container.appendChild(card);
        });
        
        document.getElementById('unlocked-count').textContent = unlockedCount;
        document.getElementById('total-count').textContent = achievements.length;
    },
    
    populateLevelUpCards: function() {
        const container = document.getElementById('upgrade-cards-container');
        container.innerHTML = '';
        
        const availableUpgrades = [...Game.upgradePool];
        const selectedUpgrades = [];
        
        for (let i = 0; i < 3 && availableUpgrades.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            selectedUpgrades.push(availableUpgrades[randomIndex]);
            availableUpgrades.splice(randomIndex, 1);
        }
        
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
            UI.elements.levelUp, UI.elements.resetConfirm,
            UI.elements.achievements, UI.elements.playerStats,
            UI.elements.quitConfirm
        ];
        
        screens.forEach(el => el.classList.add('hidden'));

        UI.elements.hud.classList.add('hidden');
        UI.elements.timer.classList.add('hidden');
        UI.elements.expHeader.classList.add('hidden');
        UI.elements.levelText.classList.add('hidden');
        UI.elements.lowHealthBorder.classList.add('hidden');

        const isOverlayState = (
            Game.state === 'PAUSED' || 
            Game.state === 'GAMEOVER' || 
            Game.state === 'LEVELUP' ||
            Game.state === 'QUIT_CONFIRM'
        );

        if (isOverlayState) {
            document.body.classList.add('game-overlay-active');
        } else {
            document.body.classList.remove('game-overlay-active');
        }

        if (Game.state === 'PLAYING' || Game.state === 'PAUSED' || Game.state === 'GAMEOVER' || Game.state === 'LEVELUP' || Game.state === 'QUIT_CONFIRM') {
            UI.elements.hud.classList.remove('hidden');
            UI.elements.timer.classList.remove('hidden');
            UI.elements.expHeader.classList.remove('hidden');
            UI.elements.levelText.classList.remove('hidden');
            UI.elements.lowHealthBorder.classList.remove('hidden');
        }

        if (Game.state === 'PLAYING' && !Game.isPaused) {
            document.body.style.cursor = 'none';
            document.body.classList.add('playing-cursor');
        } else {
            document.body.style.cursor = 'default';
            document.body.classList.remove('playing-cursor');
        }

        if (Game.state === 'MENU') UI.elements.menu.classList.remove('hidden');
        if (Game.state === 'SELECT') UI.elements.select.classList.remove('hidden');
        if (Game.state === 'GAMEOVER') UI.elements.death.classList.remove('hidden');
        if (Game.state === 'SETTINGS') {
            UI.elements.settings.classList.remove('hidden');
            UI.updateFPSButton();
        }
        if (Game.state === 'PAUSED') UI.elements.pause.classList.remove('hidden');
        if (Game.state === 'UPGRADES') UI.elements.upgrades.classList.remove('hidden');
        if (Game.state === 'RESET_CONFIRM') UI.elements.resetConfirm.classList.remove('hidden');
        if (Game.state === 'LEVELUP') UI.elements.levelUp.classList.remove('hidden');
        if (Game.state === 'ACHIEVEMENTS') UI.elements.achievements.classList.remove('hidden');
        if (Game.state === 'PLAYER_STATS') UI.elements.playerStats.classList.remove('hidden');
        if (Game.state === 'QUIT_CONFIRM') UI.elements.quitConfirm.classList.remove('hidden');
        
        if (Game.state === 'PAUSED' && Game.player) {
            UI.updateStatsDisplay();
        }
        
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
            
            document.getElementById(`desc-${type}`).textContent = desc;
            
            const btn = document.querySelector(`button[onclick="Game.buyUpgrade('${type}')"]`);
            if (btn) {
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
            statsDiv.style.cssText = 'position: absolute; bottom: 40px; left: 40px; color: white; font-size: 22px; background: rgba(0,0,0,0.8); padding: 25px; border-radius: 10px; pointer-events: none; z-index: 30; min-width: 300px;';
            UI.elements.pause.appendChild(statsDiv);
        }
        
        statsDiv.innerHTML = `
            <div style="margin-bottom: 10px; color: #00d4ff; font-weight: bold; font-size: 24px;">PLAYER STATS</div>
            <div style="margin-bottom: 8px;">Level: <span style="color: #FFD700;">${stats.level}</span></div>
            <div style="margin-bottom: 8px;">HP: <span style="color: #ff4444;">${stats.hp}</span>/<span style="color: #44ff44;">${stats.maxHp}</span></div>
            <div style="margin-bottom: 8px;">Damage: <span style="color: #ffaa00;">${stats.damage}</span></div>
            <div style="margin-bottom: 8px;">Crit Chance: <span style="color: #ff00ff;">${stats.critChance}</span></div>
            <div style="margin-bottom: 8px;">Speed: <span style="color: #00ffff;">${stats.speed}</span></div>
            <div style="margin-bottom: 8px;">EXP: <span style="color: #00d4ff;">${stats.exp}</span>/<span style="color: #00d4ff;">${stats.expNext}</span></div>
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
        
        UI.updateLowHealthEffect();
    },

    updateLowHealthEffect: function() {
        if (!Game.player) return;
        
        const border = UI.elements.lowHealthBorder;
        const hpPercent = Game.player.hp / Game.player.maxHp;
        
        if (hpPercent <= 0.3 && Game.state === 'PLAYING' && !Game.isPaused) {
            const opacity = Math.max(0.3, 1 - (hpPercent / 0.3));
            border.style.opacity = opacity.toString();
            
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