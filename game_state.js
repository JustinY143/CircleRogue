const Game = {
    state: 'MENU',
    isPaused: false,
    isTimePaused: false,
    player: null, bullets: [], enemies: [], particles: [], slashes: [], enemyProjectiles: [],
    frameCount: 0, score: 0, startTime: 0, elapsedTime: 0, lastUpdateTime: 0,
    bossActive: false,
    devMode: false,
    
    // Track kills for achievements
    currentRunKills: 0,
    // Track no-hit boss attempt
    bossHitDuringFight: false,
    bossFightStarted: false,
    
    ZOOM_LEVEL: 1.15,

    saveData: {
        points: 0,
        upgrades: { hp: 0, dmg: 0, crit: 0 },
        unlockedHardBoss: false,
        pendingUnlockNotification: false,
        achievements: {
            unlocked: {},
            bossKillsByDiff: {},
            totalKills: 0,
            maxKillsInRun: 0,
            totalPointsEarned: 0,
            maxPointsInRun: 0,
            maxSurvivalTime: 0,
            deathCount: 0,
            totalPlayTime: 0, // Added for playtime tracking
            noHitBossKills: 0 // Added for no-hit achievements
        }
    },
    currentDifficulty: 'NOVICE',

    uiElements: {},

    upgradePool: [
        { id: 'hp', title: 'Vitality', desc: 'Max HP +10', icon: '[ + ]' },
        { id: 'dmg', title: 'Strength', desc: 'Attack DMG +2', icon: '[ ! ]' },
        { id: 'crit', title: 'Deadly Aim', desc: 'Crit Chance +5%', icon: '[ * ]' },
        { id: 'heal', title: 'Recovery', desc: 'Heal 25% HP', icon: '[ H ]' }
    ],

    toLevelUp: function() {
        Game.isPaused = true;
        Game.isTimePaused = true;
        Game.state = 'LEVELUP';
        
        // Generate and display random upgrade options
        UI.populateLevelUpCards();
        UI.update();
    },

    applyInGameUpgrade: function(id) {
        if (id === 'hp') {
            Game.player.maxHp += Utils.getUpgradeAmount('hp');
            Game.player.hp += Utils.getUpgradeAmount('hp');
        } else if (id === 'dmg') {
            Game.player.stats.dmg += Utils.getUpgradeAmount('dmg');
        } else if (id === 'crit') {
            Game.player.stats.critChance += Utils.getUpgradeAmount('crit');
        } else if (id === 'heal') {
            const healAmount = Math.floor(Game.player.maxHp * SETTINGS.UPGRADE_SYSTEM.HEAL_UPGRADE_PERCENT);
            Game.player.heal(healAmount);
        }
        Game.uiElements.levelUp.classList.add('hidden');
        Game.isPaused = false;
        Game.isTimePaused = false;
        Game.state = 'PLAYING';
        UI.update();
    },

    load: function() {
        const data = localStorage.getItem('ClusterBusterSave');
        if (data) {
            const parsed = JSON.parse(data);
            Game.saveData = parsed;
            
            // Initialize achievements if they don't exist
            if (!Game.saveData.achievements) {
                Game.saveData.achievements = {
                    unlocked: {},
                    bossKillsByDiff: {},
                    totalKills: 0,
                    maxKillsInRun: 0,
                    totalPointsEarned: Game.saveData.points || 0,
                    maxPointsInRun: 0,
                    maxSurvivalTime: 0,
                    deathCount: 0,
                    totalPlayTime: 0,
                    noHitBossKills: 0
                };
            }
        }
        
        // Immediately show ??? button if unlocked
        if (Game.saveData.unlockedHardBoss) {
            document.getElementById('btn-diff-unknown').classList.remove('hidden');
        }
    },
    
    save: function() {
        localStorage.setItem('ClusterBusterSave', JSON.stringify(Game.saveData));
    },
    
    resetProgress: function() {
        UI.showResetConfirm();
    },
    
    confirmReset: function() {
        localStorage.removeItem('ClusterBusterSave');
        location.reload();
    },
    
    cancelReset: function() {
        Game.state = 'SETTINGS';
        UI.update();
    },

    toUpgrades: function() {
        Game.state = 'UPGRADES';
        UI.updateUpgradeUI();
        UI.update();
    },

    toAchievements: function() {
        Game.state = 'ACHIEVEMENTS';
        UI.populateAchievements();
        UI.update();
    },

    toPlayerStats: function() {
        Game.state = 'PLAYER_STATS';
        UI.populatePlayerStats();
        UI.update();
    },
    
    buyUpgrade: function(type) {
        const currentLevel = Game.saveData.upgrades[type];
        const cost = Utils.getUpgradeCost(type, currentLevel);
        
        if (Game.devMode || Game.saveData.points >= cost) {
            if (!Game.devMode) {
                Game.saveData.points -= cost;
            }
            Game.saveData.upgrades[type]++;
            Game.save();
            UI.updateUpgradeUI();
            
            // Check upgrade achievements
            if (Achievements) {
                Achievements.checkAllAchievements();
            }
        } else {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = "Not Enough Points!";
            btn.style.background = '#800';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1000);
        }
    },

    setDifficulty: function(diff) {
        Game.currentDifficulty = diff;
        document.getElementById('diff-label').innerText = diff;
        const flyout = document.querySelector('.flyout');
        if (flyout) {
            flyout.style.display = 'none';
            setTimeout(() => { flyout.style.display = ''; }, 500);
        }
    },

    toSettings: function() { 
        Game.state = 'SETTINGS'; 
        UI.update(); 
    },
    
    updateCrosshairColor: function(color) { 
        SETTINGS.CROSSHAIR_COLOR = color; 
    },
    
    toCharSelect: function() { 
        Game.state = 'SELECT'; 
        UI.update(); 
    },
    
    toMainMenu: function() { 
        Game.state = 'MENU'; 
        Game.isPaused = false;
        Game.isTimePaused = false;
        
        // Add playtime from this session
        if (Game.saveData.achievements) {
            Game.saveData.achievements.totalPlayTime += Game.elapsedTime || 0;
            Game.save();
        }
        
        // Show pending unlock notification if there is one
        if (Game.saveData.pendingUnlockNotification) {
            UI.showUnlockNotification();
            Game.saveData.pendingUnlockNotification = false;
            Game.save();
        }
        
        UI.update(); 
    },
    
    togglePause: function() {
        if (Game.state !== 'PLAYING' && Game.state !== 'PAUSED' && Game.state !== 'QUIT_CONFIRM') return;
        
        // If in quit confirmation, close it instead of toggling pause
        if (Game.state === 'QUIT_CONFIRM') {
            Game.state = 'PAUSED';
            Game.isPaused = true;
            Game.isTimePaused = true;
        } else {
            Game.isPaused = !Game.isPaused;
            Game.isTimePaused = Game.isPaused;
            Game.state = Game.isPaused ? 'PAUSED' : 'PLAYING';
        }
        
        UI.update();
    },

    start: function(classType) {
        Game.bullets = []; Game.enemies = []; Game.particles = []; Game.slashes = []; Game.enemyProjectiles = [];
        Game.score = 0; Game.startTime = Date.now(); Game.elapsedTime = 0; 
        Game.isPaused = false; Game.isTimePaused = false;
        Game.lastUpdateTime = Date.now();
        
        // Reset run stats
        Game.currentRunKills = 0;
        Game.bossHitDuringFight = false;
        Game.bossFightStarted = false;
        
        Spawner.bossSpawned = false; 
        Game.bossActive = false;
        
        const startX = WORLD_WIDTH / 2, startY = WORLD_HEIGHT / 2;
        const upgrades = Game.saveData.upgrades;
        Game.player = (classType === 'gunner') 
            ? new Gunner(startX, startY, upgrades) 
            : new Swordsman(startX, startY, upgrades);
        
        Game.state = 'PLAYING';
        UI.update();
    },
    
    die: function() {
        Game.state = 'GAMEOVER';
        let diffMult = DIFFICULTY_MODS[Game.currentDifficulty].score;
        let pointsEarned = Math.floor((Game.score + Game.elapsedTime) * diffMult);
        
        // Calculate kills (each enemy gives 5 score points)
        const kills = Game.score / 5;
        
        // Update save data
        Game.saveData.points += pointsEarned;
        
        // Add playtime
        if (Game.saveData.achievements) {
            Game.saveData.achievements.totalPlayTime += Game.elapsedTime;
        }
        
        // Record achievements
        if (Achievements && Achievements.recordRunStats) {
            Achievements.recordRunStats(kills, pointsEarned, Game.elapsedTime);
        }
        
        Game.save();
        document.getElementById('death-stats').innerHTML = 
            `SURVIVED: ${Utils.formatTime(Game.elapsedTime)}<br>POINTS: ${pointsEarned}`;
        UI.update();
    },

    bossKilled: function() {
        Game.bossActive = false;
        Game.bossFightStarted = false;
        
        // Check for no-hit achievement
        if (!Game.bossHitDuringFight) {
            if (Game.saveData.achievements) {
                Game.saveData.achievements.noHitBossKills = (Game.saveData.achievements.noHitBossKills || 0) + 1;
            }
            if (Achievements) {
                Achievements.checkAllAchievements();
            }
        }
        
        // Set a flag instead of showing alert immediately
        if (Game.currentDifficulty === 'HARD' && !Game.saveData.unlockedHardBoss) {
            Game.saveData.unlockedHardBoss = true;
            Game.saveData.pendingUnlockNotification = true;
            
            // Immediately update the UI to show the ??? button
            document.getElementById('btn-diff-unknown').classList.remove('hidden');
            Game.save();
            
            // Don't show alert here - it will be shown when returning to main menu
        }
        
        // Record boss kill for achievements
        if (Achievements && Achievements.recordBossKill) {
            Achievements.recordBossKill(Game.currentDifficulty);
        }
    },

    // Helper function to track enemy kills
    recordEnemyKill: function() {
        Game.currentRunKills++;
        if (Game.saveData.achievements) {
            Game.saveData.achievements.totalKills++;
            if (Game.currentRunKills > Game.saveData.achievements.maxKillsInRun) {
                Game.saveData.achievements.maxKillsInRun = Game.currentRunKills;
            }
        }
    },
    
    // Track boss fight hits
    playerHitDuringBossFight: function() {
        if (Game.bossActive) {
            Game.bossHitDuringFight = true;
        }
    },
    
    // Start tracking boss fight
    startBossFight: function() {
        Game.bossFightStarted = true;
        Game.bossHitDuringFight = false;
    },

    // Quit confirmation functions
    showQuitConfirm: function() {
        Game.state = 'QUIT_CONFIRM';
        UI.update();
    },

    confirmQuit: function() {
        Game.toMainMenu();
    },

    cancelQuit: function() {
        Game.state = 'PAUSED';
        UI.update();
    }
};