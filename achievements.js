// achievements.js
const Achievements = {
    list: [
        // Boss-related achievements
        {
            id: 'boss_beginner',
            name: 'Baby Steps',
            description: 'Defeat the boss in BEGINNER difficulty',
            icon: 'B',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.BEGINNER >= 1;
            }
        },
        {
            id: 'boss_novice',
            name: 'Getting Serious',
            description: 'Defeat the boss in NOVICE difficulty',
            icon: 'S',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.NOVICE >= 1;
            }
        },
        {
            id: 'boss_hard',
            name: 'Veteran',
            description: 'Defeat the boss in HARD difficulty',
            icon: 'V',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.HARD >= 1;
            }
        },
        {
            id: 'boss_unknown',
            name: 'The Unknowable',
            description: 'Defeat the boss in ??? difficulty',
            icon: '?',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.bossKillsByDiff?.UNKNOWN >= 1;
            }
        },
        {
            id: 'boss_all',
            name: 'Master of All',
            description: 'Defeat the boss in ALL difficulties',
            icon: 'M',
            check: () => {
                const data = Game.saveData.achievements || {};
                const kills = data.bossKillsByDiff || {};
                return kills.BEGINNER >= 1 && kills.NOVICE >= 1 && 
                       kills.HARD >= 1 && kills.UNKNOWN >= 1;
            }
        },
        
        // No-hit boss achievements
        {
            id: 'nohit_boss_1',
            name: 'Untouchable',
            description: 'Defeat a boss without getting hit',
            icon: 'N',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.noHitBossKills >= 1;
            }
        },
        {
            id: 'nohit_boss_2',
            name: 'Not a Fluke',
            description: 'Defeat 2 bosses without getting hit',
            icon: 'N',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.noHitBossKills >= 5;
            }
        },
        
        // Kill-based achievements
        {
            id: 'kills_100',
            name: 'Initiate Slayer',
            description: 'Kill 100 enemies in one run',
            icon: 'K',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 100;
            }
        },
        {
            id: 'kills_500',
            name: 'Seasoned Hunter',
            description: 'Kill 500 enemies in one run',
            icon: 'H',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 500;
            }
        },
        {
            id: 'kills_1000',
            name: 'Walking Apocalypse',
            description: 'Kill 1000 enemies in one run',
            icon: 'A',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxKillsInRun >= 1000;
            }
        },
        {
            id: 'total_kills_5000',
            name: 'Genocide',
            description: 'Kill 5000 enemies total',
            icon: 'G',
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
            icon: 'R',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 5000;
            }
        },
        {
            id: 'points_10000',
            name: 'Loaded',
            description: 'Earn 10000 points in one run',
            icon: 'L',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 10000;
            }
        },
        {
            id: 'points_25000',
            name: 'Richer Than God',
            description: 'Earn 25000 points in one run',
            icon: 'G',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxPointsInRun >= 25000;
            }
        },
        {
            id: 'total_points_50000',
            name: 'Point Hoarder',
            description: 'Accumulate 50000 points total',
            icon: 'P',
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
            icon: 'T',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 300;
            }
        },
        {
            id: 'time_10',
            name: 'Endurance',
            description: 'Survive 10 minutes in one run',
            icon: 'E',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 600;
            }
        },
        {
            id: 'time_15',
            name: 'Unstoppable',
            description: 'Survive 15 minutes in one run',
            icon: 'U',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.maxSurvivalTime >= 900;
            }
        },
        
        // Playtime achievements
        {
            id: 'playtime_1',
            name: 'Dedicated',
            description: 'Play for 1 hour total',
            icon: 'D',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalPlayTime >= 3600; // 1 hour in seconds
            }
        },
        {
            id: 'playtime_5',
            name: 'Hardcore',
            description: 'Play for 5 hours total',
            icon: 'H',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalPlayTime >= 18000; // 5 hours in seconds
            }
        },
        {
            id: 'playtime_10',
            name: 'Addicted',
            description: 'Play for 10 hours total',
            icon: 'A',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalPlayTime >= 36000; // 10 hours in seconds
            }
        },
        {
            id: 'playtime_25',
            name: 'No Life',
            description: 'Play for 25 hours total',
            icon: 'N',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.totalPlayTime >= 90000; // 25 hours in seconds
            }
        },
        
        // Upgrade achievements (tiered)
        {
			id: 'upgrades_10_each',
			name: 'Balanced',
			description: 'Reach level 10 in all upgrades',
			icon: 'B',
			check: () => {
				const upgrades = Game.saveData.upgrades || {};
				return upgrades.hp >= 10 && upgrades.dmg >= 10 && upgrades.crit >= 10;
			}
		},
		{
			id: 'upgrades_20_each',
			name: 'Maxed Out',
			description: 'Reach level 20 in all upgrades',
			icon: 'M',
			check: () => {
				const upgrades = Game.saveData.upgrades || {};
				return upgrades.hp >= 20 && upgrades.dmg >= 20 && upgrades.crit >= 20;
			}
		},
		{
			id: 'upgrades_30_each',
			name: 'Perfection',
			description: 'Reach level 30 in all upgrades',
			icon: 'P',
			check: () => {
				const upgrades = Game.saveData.upgrades || {};
				return upgrades.hp >= 30 && upgrades.dmg >= 30 && upgrades.crit >= 30;
			}
		},
        
        // Special achievements
        {
            id: 'first_death',
            name: 'First Blood',
            description: 'Die for the first time',
            icon: 'F',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.deathCount >= 1;
            }
        },
        {
            id: 'death_10',
            name: 'Persistent',
            description: 'Die 10 times',
            icon: 'X',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.deathCount >= 10;
            }
        },
        {
            id: 'death_50',
            name: 'Unbreakable',
            description: 'Die 50 times',
            icon: 'U',
            check: () => {
                const data = Game.saveData.achievements || {};
                return data.deathCount >= 50;
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
                deathCount: 0,
                totalPlayTime: 0,
                noHitBossKills: 0
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
                deathCount: 0,
                totalPlayTime: 0,
                noHitBossKills: 0
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