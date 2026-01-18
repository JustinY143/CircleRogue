// achievements.js
const Achievements = {
    list: [
        // Boss-related achievements
        {
            id: 'boss_beginner',
            name: 'Baby Steps',
            description: 'Defeat the boss in BEGINNER difficulty',
            icon: 'B',  // Changed from 👶
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.BEGINNER >= 1;
            }
        },
        {
            id: 'boss_novice',
            name: 'Getting Serious',
            description: 'Defeat the boss in NOVICE difficulty',
            icon: 'S',  // Changed from 🎯
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.NOVICE >= 1;
            }
        },
        {
            id: 'boss_hard',
            name: 'Veteran',
            description: 'Defeat the boss in HARD difficulty',
            icon: 'V',  // Changed from 💪
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.HARD >= 1;
            }
        },
        {
            id: 'boss_unknown',
            name: 'The Unknowable',
            description: 'Defeat the boss in ??? difficulty',
            icon: '?',  // Changed from ❓
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.UNKNOWN >= 1;
            }
        },
        {
            id: 'boss_all',
            name: 'Master of All',
            description: 'Defeat the boss in ALL difficulties',
            icon: 'M',  // Changed from 👑
            check: () => {
                const data = Game.saveData.achievements || {};
                const kills = data.bossKillsByDiff || {};
                return kills.BEGINNER >= 1 && kills.NOVICE >= 1 && 
                       kills.HARD >= 1 && kills.UNKNOWN >= 1;
            }
        },
        
        // Kill-based achievements
        {
            id: 'kills_100',
            name: 'Initiate Slayer',
            description: 'Kill 100 enemies in one run',
            icon: 'K',  // Changed from ⚔️
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 100;
            }
        },
        {
            id: 'kills_500',
            name: 'Seasoned Hunter',
            description: 'Kill 500 enemies in one run',
            icon: 'H',  // Changed from 🏹
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 500;
            }
        },
        {
            id: 'kills_1000',
            name: 'Walking Apocalypse',
            description: 'Kill 1000 enemies in one run',
            icon: 'A',  // Changed from ☠️
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 1000;
            }
        },
        {
            id: 'total_kills_5000',
            name: 'Genocide',
            description: 'Kill 5000 enemies total',
            icon: 'G',  // Changed from 💀
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalKills >= 5000;
            }
        },
        
        // Point-based achievements
        {
            id: 'points_5000',
            name: 'Rich',
            description: 'Earn 5000 points in one run',
            icon: 'R',  // Changed from 💰
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 5000;
            }
        },
        {
            id: 'points_10000',
            name: 'Loaded',
            description: 'Earn 10000 points in one run',
            icon: 'L',  // Changed from 💎
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 10000;
            }
        },
        {
            id: 'points_25000',
            name: 'Richer Than God',
            description: 'Earn 25000 points in one run',
            icon: 'G',  // Changed from 👑 (using G for God)
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 25000;
            }
        },
        {
            id: 'total_points_50000',
            name: 'Point Hoarder',
            description: 'Accumulate 50000 points total',
            icon: 'P',  // Changed from 🏦
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalPointsEarned >= 50000;
            }
        },
        
        // Time-based achievements
        {
            id: 'time_5',
            name: 'Survivor',
            description: 'Survive 5 minutes in one run',
            icon: 'T',  // Changed from ⏱️
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 300;
            }
        },
        {
            id: 'time_10',
            name: 'Endurance',
            description: 'Survive 10 minutes in one run',
            icon: 'E',  // Changed from 🛡️
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 600;
            }
        },
        {
            id: 'time_15',
            name: 'Unstoppable',
            description: 'Survive 15 minutes in one run',
            icon: 'U',  // Changed from ⚡
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 900;
            }
        },
        
        // Upgrade achievements
        {
            id: 'max_upgrades',
            name: 'Perfection',
            description: 'Max out all upgrades',
            icon: '★',  // Changed from ⭐ (using star symbol)
            check: () => {
                const upgrades = Game.saveData.upgrades || {};
                return upgrades.hp >= 10 && upgrades.dmg >= 10 && upgrades.crit >= 10;
            }
        },
        
        // Special achievements
        {
            id: 'first_death',
            name: 'First Blood',
            description: 'Die for the first time',
            icon: 'D',  // Changed from 💔
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.deathCount >= 1;
            }
        },
        {
            id: 'death_10',
            name: 'Persistent',
            description: 'Die 10 times',
            icon: 'X',  // Changed from 🔄
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.deathCount >= 10;
            }
        }
    ],

    checkAndUnlock: function(achievementId) {
        if (!Game.saveData.achievements) {
            Game.saveData.achievements = { unlocked: {} };
        }
        
        if (!Game.saveData.achievements.unlocked[achievementId]) {
            Game.saveData.achievements.unlocked[achievementId] = true;
            this.showNotification(achievementId);
            Game.save();
        }
    },

    showNotification: function(achievementId) {
        const achievement = this.list.find(a => a.id === achievementId);
        if (!achievement) return;

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-icon" style="font-size: 40px; font-weight: bold;">${achievement.icon}</div>
                <div class="achievement-text">
                    <div class="achievement-title">ACHIEVEMENT UNLOCKED!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border: 3px solid gold;
            border-radius: 10px;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.5s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    },

    checkAllAchievements: function() {
        if (!Game.saveData.achievements) {
            Game.saveData.achievements = {
                unlocked: {},
                bossKillsByDiff: {},
                totalKills: 0,
                maxKillsInRun: 0,
                totalPointsEarned: Game.saveData.points || 0,
                maxPointsInRun: 0,
                maxSurvivalTime: 0,
                deathCount: 0
            };
        }
        
        this.list.forEach(achievement => {
            if (achievement.check() && !Game.saveData.achievements.unlocked[achievement.id]) {
                this.checkAndUnlock(achievement.id);
            }
        });
    },

    // Called when boss is killed
    recordBossKill: function(difficulty) {
        if (!Game.saveData.achievements) {
            Game.saveData.achievements = { bossKillsByDiff: {} };
        }
        
        if (!Game.saveData.achievements.bossKillsByDiff[difficulty]) {
            Game.saveData.achievements.bossKillsByDiff[difficulty] = 0;
        }
        Game.saveData.achievements.bossKillsByDiff[difficulty]++;
        
        // Check boss achievements
        this.checkAllAchievements();
    },

    // Called when game ends
    recordRunStats: function(kills, points, survivalTime) {
        if (!Game.saveData.achievements) {
            Game.saveData.achievements = {
                totalKills: 0,
                maxKillsInRun: 0,
                totalPointsEarned: 0,
                maxPointsInRun: 0,
                maxSurvivalTime: 0,
                deathCount: 0
            };
        }
        
        // Update total stats
        Game.saveData.achievements.totalKills += kills;
        Game.saveData.achievements.totalPointsEarned += points;
        Game.saveData.achievements.deathCount = (Game.saveData.achievements.deathCount || 0) + 1;
        
        // Update max stats if this run was better
        if (kills > Game.saveData.achievements.maxKillsInRun) {
            Game.saveData.achievements.maxKillsInRun = kills;
        }
        if (points > Game.saveData.achievements.maxPointsInRun) {
            Game.saveData.achievements.maxPointsInRun = points;
        }
        if (survivalTime > Game.saveData.achievements.maxSurvivalTime) {
            Game.saveData.achievements.maxSurvivalTime = survivalTime;
        }
        
        this.checkAllAchievements();
    }
};