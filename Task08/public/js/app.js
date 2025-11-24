class App {
    constructor() {
        this.currentGame = null;
        this.replayInterval = null;
        this.currentReplayIndex = 0;
        this.isReplayPaused = false;
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.showMainMenu();
        } catch (error) {
            this.showError('Ошибка инициализации: ' + error.message);
        }
    }

    setupEventListeners() {
        // Основные навигационные обработчики
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

        // Кнопки назад
        document.getElementById('back-to-menu-from-new').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-menu-from-game').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-menu-from-history').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('back-to-menu-from-replay').addEventListener('click', () => {
            this.stopReplay();
            this.showMainMenu();
        });

        // Обработчики воспроизведения
        document.getElementById('pause-replay').addEventListener('click', () => {
            this.pauseReplay();
        });

        document.getElementById('resume-replay').addEventListener('click', () => {
            this.resumeReplay();
        });

        document.getElementById('stop-replay').addEventListener('click', () => {
            this.stopReplay();
            this.showMainMenu();
        });

        // Делегирование событий для кликов по играм в истории
        document.addEventListener('click', (e) => {
            const gameItem = e.target.closest('.game-item.clickable');
            if (gameItem) {
                const gameId = parseInt(gameItem.getAttribute('data-game-id'));
                console.log('Клик по игре:', gameId);
                this.showGameReplay(gameId);
            }
        });

        // Табы
        this.setupTabs();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');

                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });

                button.classList.add('active');
                const gamesList = document.getElementById('games-list');
                if (gamesList) {
                    gamesList.classList.add('active');
                }

                this.loadTabContent(tabName);
            });
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showMainMenu() {
        this.showScreen('main-menu');
    }

    showNewGameScreen() {
        this.showScreen('new-game-screen');
        document.getElementById('player-name').focus();
    }

    showGameScreen() {
        this.showScreen('game-screen');
        document.getElementById('guess-input').focus();
    }

    showHistoryScreen() {
        this.showScreen('history-screen');
        this.loadTabContent('all');
    }

    showReplayScreen() {
        this.showScreen('replay-screen');
    }

    async showGameReplay(gameId) {
        try {
            console.log('Загрузка игры для воспроизведения:', gameId);
            const response = await fetch(`/games/${gameId}`);
            if (!response.ok) {
                throw new Error('Game not found');
            }

            const data = await response.json();
            const game = data.game;
            const attempts = data.attempts;

            if (!game.is_completed) {
                const continueGame = confirm('Эта игра еще не завершена. Хотите продолжить?');
                if (continueGame) {
                    await this.continueGame(game, attempts);
                    return;
                } else {
                    return;
                }
            }

            this.showReplay(game, attempts);
            this.showReplayScreen();
            this.startReplay(attempts);

        } catch (error) {
            console.error('Ошибка при загрузке игры:', error);
            this.showError('Ошибка при загрузке игры: ' + error.message);
        }
    }

    showReplay(game, attempts) {
        const container = document.getElementById('replay-content');
        if (!container) return;

        if (!game) {
            container.innerHTML = '<p class="message error">Игра с указанным ID не найдена.</p>';
            return;
        }

        let html = `
            <div class="replay-info">
                <h3>Повтор игры ID: ${game.id}</h3>
                <p>Игрок: ${game.player_name}</p>
                <p>Загаданное число: ${game.secret_number}</p>
                <p>Максимальное число: ${game.max_number}</p>
                <p>Максимальное количество попыток: ${game.max_attempts}</p>
                <p>Результат: ${game.is_won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</p>
                <p>Количество попыток: ${game.attempts_count}</p>
            </div>
            <div class="replay-attempts">
                <h4>Ход игры:</h4>
                <div id="replay-attempts-list">
        `;

        attempts.forEach((attempt, index) => {
            let resultText = '';
            switch (attempt.result) {
                case 'win':
                    resultText = 'ПОБЕДА! Число угадано!';
                    break;
                case 'greater':
                    resultText = 'Загаданное число БОЛЬШЕ';
                    break;
                case 'less':
                    resultText = 'Загаданное число МЕНЬШЕ';
                    break;
            }

            html += `
                <div class="attempt-item replay-item" data-attempt-index="${index}" style="display: none;">
                    Попытка ${attempt.attempt_number}: ${attempt.guess} - ${resultText}
                </div>
            `;
        });

        html += `
                </div>
            </div>
            <div class="replay-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="replay-progress"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    showReplayAttempt(attemptIndex) {
        const attemptElement = document.querySelector(`[data-attempt-index="${attemptIndex}"]`);
        if (attemptElement) {
            attemptElement.style.display = 'block';
            attemptElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Обновляем прогресс
        const totalAttempts = document.querySelectorAll('.replay-item').length;
        const progress = ((attemptIndex + 1) / totalAttempts) * 100;
        const progressFill = document.getElementById('replay-progress');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }

    setReplayPaused(isPaused) {
        const pauseBtn = document.getElementById('pause-replay');
        const resumeBtn = document.getElementById('resume-replay');

        if (pauseBtn && resumeBtn) {
            if (isPaused) {
                pauseBtn.style.display = 'none';
                resumeBtn.style.display = 'inline-block';
            } else {
                pauseBtn.style.display = 'inline-block';
                resumeBtn.style.display = 'none';
            }
        }
    }

    startReplay(attempts) {
        this.stopReplay();

        this.currentReplayIndex = 0;
        this.isReplayPaused = false;
        this.setReplayPaused(false);

        console.log('Запуск воспроизведения, всего попыток:', attempts.length);

        // Сначала показываем первую попытку сразу
        if (attempts.length > 0) {
            this.showReplayAttempt(this.currentReplayIndex);
            this.currentReplayIndex++;
        }

        this.replayInterval = setInterval(() => {
            if (!this.isReplayPaused && this.currentReplayIndex < attempts.length) {
                this.showReplayAttempt(this.currentReplayIndex);
                this.currentReplayIndex++;

                if (this.currentReplayIndex >= attempts.length) {
                    setTimeout(() => {
                        console.log('Воспроизведение завершено');
                    }, 1000);
                }
            }
        }, 1500);
    }

    pauseReplay() {
        this.isReplayPaused = true;
        this.setReplayPaused(true);
        console.log('Воспроизведение на паузе');
    }

    resumeReplay() {
        this.isReplayPaused = false;
        this.setReplayPaused(false);
        console.log('Воспроизведение продолжено');
    }

    stopReplay() {
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = null;
        }
        this.isReplayPaused = false;
        this.currentReplayIndex = 0;
    }

    async continueGame(gameData, attemptsData) {
        try {
            this.currentGame = new Game();
            this.currentGame.loadFromData(gameData, attemptsData);

            this.showGameStart(
                gameData.player_name,
                gameData.max_number,
                gameData.max_attempts
            );

            this.restoreAttemptsHistory(attemptsData);
            this.showGameScreen();

        } catch (error) {
            this.showError('Ошибка при загрузке игры: ' + error.message);
        }
    }

    restoreAttemptsHistory(attempts) {
        this.clearGameMessages();
        this.clearAttemptsHistory();

        const messagesContainer = document.getElementById('game-messages');
        const attemptsContainer = document.getElementById('attempts-history');

        if (!messagesContainer || !attemptsContainer) return;

        attempts.forEach(attempt => {
            let message = '';
            let messageClass = 'info';

            switch (attempt.result) {
                case 'win':
                    message = `Поздравляем! Вы угадали число ${attempt.guess} за ${attempt.attempt_number} попыток!`;
                    messageClass = 'success';
                    break;
                case 'greater':
                    message = `Попытка ${attempt.attempt_number}: ${attempt.guess} - Загаданное число больше`;
                    messageClass = 'info';
                    break;
                case 'less':
                    message = `Попытка ${attempt.attempt_number}: ${attempt.guess} - Загаданное число меньше`;
                    messageClass = 'info';
                    break;
            }

            const messageElement = document.createElement('div');
            messageElement.className = `message ${messageClass}`;
            messageElement.textContent = message;
            messagesContainer.appendChild(messageElement);

            if (attempt.result !== 'win') {
                const attemptElement = document.createElement('div');
                attemptElement.className = 'attempt-item';
                attemptElement.textContent = `Попытка ${attempt.attempt_number}: ${attempt.guess} - ${attempt.result === 'greater' ? 'больше' : 'меньше'}`;
                attemptsContainer.appendChild(attemptElement);
            }
        });

        const currentAttempt = attempts.length + 1;
        this.updateProgress(currentAttempt, this.currentGame.getMaxAttempts());
        document.getElementById('current-attempt').textContent = currentAttempt;

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        attemptsContainer.scrollTop = attemptsContainer.scrollHeight;

        const lastAttempt = attempts[attempts.length - 1];
        if (lastAttempt && lastAttempt.result === 'win') {
            document.getElementById('guess-input').disabled = true;
            document.getElementById('guess-btn').disabled = true;
        } else if (attempts.length >= this.currentGame.getMaxAttempts()) {
            this.showLoseMessage(this.currentGame.getSecretNumber(), this.currentGame.getMaxAttempts());
            document.getElementById('guess-input').disabled = true;
            document.getElementById('guess-btn').disabled = true;
        } else {
            const continueMessage = document.createElement('div');
            continueMessage.className = 'message info';
            continueMessage.textContent = 'Игра продолжена. Сделайте следующую попытку.';
            messagesContainer.appendChild(continueMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    showGameStart(player, maxNumber, maxAttempts) {
        document.getElementById('current-player').textContent = player;
        document.getElementById('current-max-number').textContent = maxNumber;
        document.getElementById('total-attempts').textContent = maxAttempts;
        document.getElementById('current-attempt').textContent = '1';

        this.clearGameMessages();
        this.clearAttemptsHistory();
        this.updateProgress(1, maxAttempts);

        document.getElementById('guess-input').disabled = false;
        document.getElementById('guess-btn').disabled = false;
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').focus();
    }

    updateProgress(currentAttempt, maxAttempts) {
        const progressFill = document.getElementById('progress-fill');
        if (!progressFill) return;

        const usedPercentage = (currentAttempt / maxAttempts) * 100;
        const remainingPercentage = 100 - usedPercentage;

        progressFill.style.width = `${remainingPercentage}%`;

        if (remainingPercentage > 50) {
            progressFill.style.background = 'var(--success-color)';
        } else if (remainingPercentage > 20) {
            progressFill.style.background = 'var(--warning-color)';
        } else {
            progressFill.style.background = 'var(--error-color)';
        }
    }

    showGuessResult(result, guess, attemptNumber, remainingAttempts, maxAttempts) {
        const messagesContainer = document.getElementById('game-messages');
        const attemptsContainer = document.getElementById('attempts-history');

        if (!messagesContainer || !attemptsContainer) return;

        let message = '';
        let messageClass = 'info';

        switch (result) {
            case 'win':
                message = `Поздравляем! Вы угадали число ${guess} за ${attemptNumber} попыток!`;
                messageClass = 'success';
                break;
            case 'greater':
                message = `Попытка ${attemptNumber}: ${guess} - Загаданное число больше`;
                messageClass = 'info';
                break;
            case 'less':
                message = `Попытка ${attemptNumber}: ${guess} - Загаданное число меньше`;
                messageClass = 'info';
                break;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageClass}`;
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);

        if (result !== 'win') {
            const attemptElement = document.createElement('div');
            attemptElement.className = 'attempt-item';
            attemptElement.textContent = `Попытка ${attemptNumber}: ${guess} - ${result === 'greater' ? 'больше' : 'меньше'}`;
            attemptsContainer.appendChild(attemptElement);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        attemptsContainer.scrollTop = attemptsContainer.scrollHeight;

        this.updateProgress(attemptNumber, maxAttempts);
    }

    showRemainingAttempts(remaining, currentAttempt, maxAttempts) {
        const messagesContainer = document.getElementById('game-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message info';
        messageElement.textContent = `Осталось попыток: ${remaining}`;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.updateProgress(currentAttempt, maxAttempts);
    }

    showLoseMessage(secretNumber, maxAttempts) {
        const messagesContainer = document.getElementById('game-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message error';
        messageElement.textContent = `К сожалению, вы проиграли. Загаданное число было: ${secretNumber}`;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.updateProgress(maxAttempts, maxAttempts);
    }

    clearGameMessages() {
        const container = document.getElementById('game-messages');
        if (container) {
            container.innerHTML = `
                <div class="welcome-message">
                    <p>Компьютер загадал число. Попробуйте угадать!</p>
                </div>
            `;
        }
    }

    clearAttemptsHistory() {
        const container = document.getElementById('attempts-history');
        if (container) {
            container.innerHTML = '';
        }
    }

    showGamesList(games) {
        const container = document.getElementById('games-list');
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = '<p>Игры не найдены.</p>';
            return;
        }

        let html = '<div class="games-container">';

        games.forEach(game => {
            const status = game.is_completed ?
                (game.is_won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') :
                'В ПРОЦЕССЕ (можно продолжить)';

            const statusClass = game.is_completed ?
                (game.is_won ? 'won' : 'lost') :
                'in-progress';

            html += `
                <div class="game-item ${statusClass} clickable" data-game-id="${game.id}">
                    <div class="game-item-content">
                        <strong>ID: ${game.id}</strong> | Игрок: ${game.player_name}<br>
                        Число: ${game.secret_number} | Попыток: ${game.attempts_count}/${game.max_attempts}<br>
                        Статус: <span class="status-text">${status}</span> | Дата: ${new Date(game.start_time).toLocaleString()}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    showPlayerStats(stats) {
        const container = document.getElementById('games-list');
        if (!container) return;

        if (stats.length === 0) {
            container.innerHTML = '<p>Статистика игроков не найдена.</p>';
            return;
        }

        let html = '<div class="stats-container">';

        stats.forEach(stat => {
            html += `
                <div class="stat-item">
                    <h3>${stat.playerName}</h3>
                    <p>Всего игр: ${stat.totalGames}</p>
                    <p>Побед: ${stat.wonGames}</p>
                    <p>Поражений: ${stat.lostGames}</p>
                    <p>Процент побед: ${stat.winRate}%</p>
            `;

            if (stat.wonGames > 0) {
                html += `
                    <p>Среднее кол-во попыток для победы: ${stat.avgAttempts}</p>
                    <p>Минимальное кол-во попыток: ${stat.minAttempts}</p>
                    <p>Максимальное кол-во попыток: ${stat.maxAttempts}</p>
                `;
            }

            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    async startNewGame() {
        const playerName = document.getElementById('player-name').value.trim() || 'Игрок';
        const maxNumber = parseInt(document.getElementById('max-number').value);
        const maxAttempts = parseInt(document.getElementById('max-attempts').value);

        if (maxNumber < 10 || maxNumber > 1000 || maxAttempts < 3 || maxAttempts > 50) {
            this.showError('Пожалуйста, проверьте корректность введенных данных');
            return;
        }

        try {
            this.currentGame = new Game(playerName, maxNumber, maxAttempts);
            await this.currentGame.init();

            this.showGameStart(playerName, maxNumber, maxAttempts);
            this.showGameScreen();

        } catch (error) {
            this.showError('Ошибка при создании игры: ' + error.message);
        }
    }

    async makeGuess() {
        if (!this.currentGame) return;

        const guessInput = document.getElementById('guess-input');
        const guess = parseInt(guessInput.value);

        if (isNaN(guess) || guess < 1 || guess > this.currentGame.maxNumber) {
            this.showError(`Введите число от 1 до ${this.currentGame.maxNumber}`);
            guessInput.focus();
            return;
        }

        try {
            const result = await this.currentGame.checkGuess(guess);
            const maxAttempts = this.currentGame.getMaxAttempts();

            this.showGuessResult(result.result, guess, result.attemptNumber, result.remainingAttempts, maxAttempts);

            if (result.result === 'win') {
                await this.currentGame.completeGame(true);
                guessInput.disabled = true;
                document.getElementById('guess-btn').disabled = true;
            } else {
                this.showRemainingAttempts(result.remainingAttempts, result.attemptNumber, maxAttempts);

                if (result.remainingAttempts === 0) {
                    this.showLoseMessage(this.currentGame.getSecretNumber(), maxAttempts);
                    await this.currentGame.completeGame(false);
                    guessInput.disabled = true;
                    document.getElementById('guess-btn').disabled = true;
                }
            }

            guessInput.value = '';
            guessInput.focus();
        } catch (error) {
            this.showError('Ошибка при обработке попытки: ' + error.message);
        }
    }

    async loadTabContent(tab) {
        try {
            let games;

            switch (tab) {
                case 'all':
                    games = await this.fetchGames('/games');
                    this.showGamesList(games);
                    break;
                case 'won':
                    games = await this.fetchGames('/games');
                    games = games.filter(game => game.is_completed && game.is_won);
                    this.showGamesList(games);
                    break;
                case 'lost':
                    games = await this.fetchGames('/games');
                    games = games.filter(game => game.is_completed && !game.is_won);
                    this.showGamesList(games);
                    break;
                case 'stats':
                    const stats = await this.fetchPlayerStats();
                    this.showPlayerStats(stats);
                    break;
            }
        } catch (error) {
            this.showError('Ошибка при загрузке данных: ' + error.message);
        }
    }

    async fetchGames(endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }
        return await response.json();
    }

    async fetchPlayerStats() {
        const games = await this.fetchGames('/games');
        const completedGames = games.filter(game => game.is_completed);

        const stats = {};

        completedGames.forEach(game => {
            if (!stats[game.player_name]) {
                stats[game.player_name] = {
                    playerName: game.player_name,
                    totalGames: 0,
                    wonGames: 0,
                    lostGames: 0,
                    attempts: []
                };
            }

            const playerStats = stats[game.player_name];
            playerStats.totalGames++;

            if (game.is_won) {
                playerStats.wonGames++;
                playerStats.attempts.push(game.attempts_count);
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

    showError(message) {
        alert(`Ошибка: ${message}`);
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});