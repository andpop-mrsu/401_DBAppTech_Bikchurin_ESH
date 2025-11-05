class App {
    constructor() {
        this.currentGame = null;
        this.database = new Database();
        this.init();
    }

    async init() {
        try {
            await this.database.init();
            this.setupEventListeners();
            this.showMainMenu();
        } catch (error) {
            View.showError('Ошибка инициализации: ' + error.message);
        }
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showNewGameScreen();
        });

        document.getElementById('history-btn').addEventListener('click', () => {
            this.showHistoryScreen();
        });

        document.getElementById('new-game-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startNewGame();
        });

        document.getElementById('guess-btn').addEventListener('click', () => {
            this.makeGuess();
        });

        document.getElementById('guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.makeGuess();
            }
        });

        document.getElementById('back-to-menu-from-new').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-menu-from-game').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-menu-from-history').addEventListener('click', () => {
            this.showMainMenu();
        });

        View.setupTabs();

        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const tab = button.getAttribute('data-tab');
                await this.loadTabContent(tab);
            });
        });

        document.addEventListener('click', (e) => {
            const gameItem = e.target.closest('.game-item');
            if (gameItem) {
                const gameId = gameItem.getAttribute('data-game-id');
                this.showGameReplay(gameId);
            }
        });
    }

    showMainMenu() {
        View.showScreen('main-menu');
    }

    showNewGameScreen() {
        View.showScreen('new-game-screen');
        document.getElementById('player-name').focus();
    }

    showGameScreen() {
        View.showScreen('game-screen');
        document.getElementById('guess-input').focus();
    }

    showHistoryScreen() {
        View.showScreen('history-screen');
        this.loadTabContent('all');
    }

    async showGameReplay(gameId) {
        try {
            const game = await this.database.getGameById(gameId);
            const attempts = await this.database.getGameAttempts(gameId);
            View.showReplay(game, attempts);
        } catch (error) {
            View.showError('Ошибка при загрузке игры: ' + error.message);
        }
    }

    async startNewGame() {
        const playerName = document.getElementById('player-name').value.trim() || 'Игрок';
        const maxNumber = parseInt(document.getElementById('max-number').value);
        const maxAttempts = parseInt(document.getElementById('max-attempts').value);

        if (maxNumber < 10 || maxNumber > 1000 || maxAttempts < 3 || maxAttempts > 50) {
            View.showError('Пожалуйста, проверьте корректность введенных данных');
            return;
        }

        try {
            this.currentGame = new Game(playerName, maxNumber, maxAttempts);
            await this.currentGame.init();

            View.showGameStart(playerName, maxNumber, maxAttempts);
            this.showGameScreen();

        } catch (error) {
            View.showError('Ошибка при создании игры: ' + error.message);
        }
    }

    async makeGuess() {
        if (!this.currentGame) return;

        const guessInput = document.getElementById('guess-input');
        const guess = parseInt(guessInput.value);

        if (isNaN(guess) || guess < 1 || guess > this.currentGame.maxNumber) {
            View.showError(`Введите число от 1 до ${this.currentGame.maxNumber}`);
            guessInput.focus();
            return;
        }

        try {
            const result = await this.currentGame.checkGuess(guess);
            const maxAttempts = this.currentGame.getMaxAttempts();

            View.showGuessResult(result.result, guess, result.attemptNumber, result.remainingAttempts, maxAttempts);

            if (result.result === 'win') {
                await this.currentGame.completeGame(true);
                guessInput.disabled = true;
                document.getElementById('guess-btn').disabled = true;
            } else {
                View.showRemainingAttempts(result.remainingAttempts, result.attemptNumber, maxAttempts);

                if (result.remainingAttempts === 0) {
                    View.showLoseMessage(this.currentGame.getSecretNumber(), maxAttempts);
                    await this.currentGame.completeGame(false);
                    guessInput.disabled = true;
                    document.getElementById('guess-btn').disabled = true;
                }
            }

            guessInput.value = '';
            guessInput.focus();
        } catch (error) {
            View.showError('Ошибка при обработке попытки: ' + error.message);
        }
    }

    async loadTabContent(tab) {
        try {
            let games;

            switch (tab) {
                case 'all':
                    games = await this.database.getAllGames();
                    View.showGamesList(games);
                    break;
                case 'won':
                    games = await this.database.getWonGames();
                    View.showWonGames(games);
                    break;
                case 'lost':
                    games = await this.database.getLostGames();
                    View.showLostGames(games);
                    break;
                case 'stats':
                    const stats = await this.database.getPlayerStats();
                    View.showPlayerStats(stats);
                    break;
            }
        } catch (error) {
            View.showError('Ошибка при загрузке данных: ' + error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});