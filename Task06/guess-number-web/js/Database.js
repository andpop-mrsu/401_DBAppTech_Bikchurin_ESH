class Database {
    constructor() {
        this.dbName = 'GuessNumberDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('games')) {
                    const gamesStore = db.createObjectStore('games', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    gamesStore.createIndex('playerName', 'playerName', { unique: false });
                    gamesStore.createIndex('isCompleted', 'isCompleted', { unique: false });
                    gamesStore.createIndex('isWon', 'isWon', { unique: false });
                    gamesStore.createIndex('startTime', 'startTime', { unique: false });
                }

                if (!db.objectStoreNames.contains('attempts')) {
                    const attemptsStore = db.createObjectStore('attempts', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    attemptsStore.createIndex('gameId', 'gameId', { unique: false });
                    attemptsStore.createIndex('attemptNumber', 'attemptNumber', { unique: false });
                }
            };
        });
    }

    async saveGame(gameData) {
        const transaction = this.db.transaction(['games'], 'readwrite');
        const store = transaction.objectStore('games');

        return new Promise((resolve, reject) => {
            const request = store.add({
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

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveAttempt(attemptData) {
        const transaction = this.db.transaction(['attempts'], 'readwrite');
        const store = transaction.objectStore('attempts');

        return new Promise((resolve, reject) => {
            const request = store.add({
                gameId: attemptData.gameId,
                attemptNumber: attemptData.attemptNumber,
                guess: attemptData.guess,
                result: attemptData.result,
                attemptTime: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async completeGame(gameId, isWon, attemptsCount) {
        const transaction = this.db.transaction(['games'], 'readwrite');
        const store = transaction.objectStore('games');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(gameId);

            getRequest.onsuccess = () => {
                const game = getRequest.result;
                if (game) {
                    game.isCompleted = true;
                    game.isWon = isWon;
                    game.attemptsCount = attemptsCount;
                    game.endTime = new Date().toISOString();

                    const updateRequest = store.put(game);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Game not found'));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async getAllGames() {
        const transaction = this.db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');
        const index = store.index('startTime');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const games = [];

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    games.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(games);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getWonGames() {
        const transaction = this.db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');
        const index = store.index('isWon');

        return new Promise((resolve, reject) => {
            const request = index.getAll(1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLostGames() {
        const transaction = this.db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const games = request.result.filter(game =>
                    game.isCompleted && !game.isWon
                );
                resolve(games);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getGameAttempts(gameId) {
        const transaction = this.db.transaction(['attempts'], 'readonly');
        const store = transaction.objectStore('attempts');
        const index = store.index('gameId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(gameId);
            request.onsuccess = () => {
                const attempts = request.result.sort((a, b) =>
                    a.attemptNumber - b.attemptNumber
                );
                resolve(attempts);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getGameById(gameId) {
        const transaction = this.db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');

        return new Promise((resolve, reject) => {
            const request = store.get(gameId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
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