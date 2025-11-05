class Game {
    constructor(playerName, maxNumber = 100, maxAttempts = 10) {
        this.playerName = playerName;
        this.maxNumber = maxNumber;
        this.maxAttempts = maxAttempts;
        this.secretNumber = this.generateSecretNumber();
        this.attempts = [];
        this.gameId = null;
        this.database = new Database();
    }

    generateSecretNumber() {
        return Math.floor(Math.random() * this.maxNumber) + 1;
    }

    async init() {
        await this.database.init();

        this.gameId = await this.database.saveGame({
            playerName: this.playerName,
            secretNumber: this.secretNumber,
            maxNumber: this.maxNumber,
            maxAttempts: this.maxAttempts
        });

        return this.gameId;
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

        await this.database.saveAttempt({
            gameId: this.gameId,
            attemptNumber: attemptNumber,
            guess: guess,
            result: result
        });

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
        await this.database.completeGame(
            this.gameId,
            isWon,
            this.attempts.length
        );
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
}