class Game {
    constructor(playerName, maxNumber = 100, maxAttempts = 10) {
        this.playerName = playerName;
        this.maxNumber = maxNumber;
        this.maxAttempts = maxAttempts;
        this.secretNumber = this.generateSecretNumber();
        this.attempts = [];
        this.gameId = null;
    }

    generateSecretNumber() {
        return Math.floor(Math.random() * this.maxNumber) + 1;
    }

    async init() {
        try {
            const response = await fetch('/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: this.playerName,
                    maxNumber: this.maxNumber,
                    maxAttempts: this.maxAttempts,
                    secretNumber: this.secretNumber
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const data = await response.json();
            this.gameId = data.id;
            return this.gameId;
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    async checkGuess(guess) {
        const attemptNumber = this.attempts.length + 1;
        let result = '';

        if (guess === this.secretNumber) {
            result = 'win';
        } else if (guess < this.secretNumber) {
            result = 'greater';
        } else {
            result = 'less';
        }

        // Сохраняем попытку на сервере
        if (this.gameId) {
            try {
                const response = await fetch(`/step/${this.gameId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        attemptNumber: attemptNumber,
                        guess: guess,
                        result: result
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save attempt');
                }
            } catch (error) {
                console.error('Error saving attempt:', error);
                throw error;
            }
        }

        this.attempts.push({
            guess: guess,
            result: result,
            attemptNumber: attemptNumber
        });

        return {
            result: result,
            attemptNumber: attemptNumber,
            remainingAttempts: this.maxAttempts - attemptNumber
        };
    }

    async completeGame(isWon) {
        // В этой реализации игра автоматически завершается при сохранении хода
        // через API, поэтому этот метод может быть пустым
        return Promise.resolve();
    }

    getSecretNumber() {
        return this.secretNumber;
    }

    getMaxAttempts() {
        return this.maxAttempts;
    }

    getMaxNumber() {
        return this.maxNumber;
    }

    getGameId() {
        return this.gameId;
    }

    getAttemptsCount() {
        return this.attempts.length;
    }

    getRemainingAttempts() {
        return this.maxAttempts - this.attempts.length;
    }

    isGameOver() {
        return this.attempts.length >= this.maxAttempts ||
            this.attempts.some(attempt => attempt.result === 'win');
    }

    // Метод для загрузки существующей игры
    loadFromData(gameData, attemptsData) {
        this.gameId = gameData.id;
        this.playerName = gameData.player_name;
        this.maxNumber = gameData.max_number;
        this.maxAttempts = gameData.max_attempts;
        this.secretNumber = gameData.secret_number;
        this.attempts = attemptsData.map(attempt => ({
            guess: attempt.guess,
            result: attempt.result,
            attemptNumber: attempt.attempt_number
        }));
    }
}