class Database {
    constructor() {
        this.dbName = 'GuessNumberDB';
        this.dbVersion = 2;
        this.db = null;
    }

    async init() {
        this.db = await idb.openDB(this.dbName, this.dbVersion, {
            upgrade(db, oldVersion, newVersion) {
                if (!db.objectStoreNames.contains('games')) {
                    const gamesStore = db.createObjectStore('games', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    gamesStore.createIndex('playerName', 'playerName', { unique: false });
                    gamesStore.createIndex('isCompleted', 'isCompleted', { unique: false });
                    gamesStore.createIndex('isWon', 'isWon', { unique: false });
                    gamesStore.createIndex('startTime', 'startTime', { unique: false });
                    gamesStore.createIndex('endTime', 'endTime', { unique: false });
                }

                if (!db.objectStoreNames.contains('attempts')) {
                    const attemptsStore = db.createObjectStore('attempts', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    attemptsStore.createIndex('gameId', 'gameId', { unique: false });
                    attemptsStore.createIndex('attemptNumber', 'attemptNumber', { unique: false });
                }
            }
        });
        return this.db;
    }

    async saveGame(gameData) {
        const id = await this.db.add('games', {
            playerName: gameData.playerName,
            secretNumber: gameData.secretNumber,
            maxNumber: gameData.maxNumber,
            maxAttempts: gameData.maxAttempts,
            isCompleted: false,
            isWon: false,
            attemptsCount: 0,
            startTime: new Date().toISOString(),
            endTime: null
        });
        return id;
    }

    async saveAttempt(attemptData) {
        const id = await this.db.add('attempts', {
            gameId: attemptData.gameId,
            attemptNumber: attemptData.attemptNumber,
            guess: attemptData.guess,
            result: attemptData.result,
            attemptTime: new Date().toISOString()
        });
        return id;
    }

    async completeGame(gameId, isWon, attemptsCount) {
        const game = await this.db.get('games', gameId);
        if (game) {
            game.isCompleted = true;
            game.isWon = isWon;
            game.attemptsCount = attemptsCount;
            game.endTime = new Date().toISOString();
            await this.db.put('games', game);
        } else {
            throw new Error('Game not found');
        }
    }

    async getAllGames() {
        return await this.db.getAllFromIndex('games', 'startTime');
    }

    async getWonGames() {
        return await this.db.getAllFromIndex('games', 'isWon', 1);
    }

    async getLostGames() {
        const games = await this.db.getAll('games');
        return games.filter(game => game.isCompleted && !game.isWon);
    }

    async getGameAttempts(gameId) {
        const attempts = await this.db.getAllFromIndex('attempts', 'gameId', gameId);
        return attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    }

    async getGameById(gameId) {
        return await this.db.get('games', gameId);
    }

    async deleteGame(gameId) {
        const tx = this.db.transaction(['games', 'attempts'], 'readwrite');

        const attemptsIndex = tx.objectStore('attempts').index('gameId');
        let cursor = await attemptsIndex.openCursor(gameId);
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }

        await tx.objectStore('games').delete(gameId);

        await tx.done;
    }

    async clearAllGames() {
        const tx = this.db.transaction(['games', 'attempts'], 'readwrite');
        await tx.objectStore('games').clear();
        await tx.objectStore('attempts').clear();
        await tx.done;
    }

    async getPlayerStats() {
        const games = await this.getAllGames();
        const completedGames = games.filter(game => game.isCompleted);

        const stats = {};

        completedGames.forEach(game => {
            if (!stats[game.playerName]) {
                stats[game.playerName] = {
                    playerName: game.playerName,
                    totalGames: 0,
                    wonGames: 0,
                    lostGames: 0,
                    attempts: []
                };
            }

            const playerStats = stats[game.playerName];
            playerStats.totalGames++;

            if (game.isWon) {
                playerStats.wonGames++;
                playerStats.attempts.push(game.attemptsCount);
            } else {
                playerStats.lostGames++;
            }
        });

        return Object.values(stats).map(stat => {
            const winRate = stat.totalGames > 0 ?
                Math.round((stat.wonGames / stat.totalGames) * 100) : 0;

            const avgAttempts = stat.attempts.length > 0 ?
                Math.round(stat.attempts.reduce((a, b) => a + b, 0) / stat.attempts.length * 100) / 100 : 0;

            const minAttempts = stat.attempts.length > 0 ?
                Math.min(...stat.attempts) : 0;

            const maxAttempts = stat.attempts.length > 0 ?
                Math.max(...stat.attempts) : 0;

            return {
                ...stat,
                winRate,
                avgAttempts,
                minAttempts,
                maxAttempts
            };
        }).sort((a, b) => b.wonGames - a.wonGames || b.totalGames - a.totalGames);
    }
}