class View {
    static showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    static showGameStart(player, maxNumber, maxAttempts) {
        document.getElementById('current-player').textContent = player;
        document.getElementById('current-max-number').textContent = maxNumber;
        document.getElementById('total-attempts').textContent = maxAttempts;
        document.getElementById('current-attempt').textContent = '1';

        this.clearGameMessages();
        this.clearAttemptsHistory();
        this.updateProgress(1, maxAttempts);
    }

    static updateGameState(currentAttempt, maxAttempts) {
        document.getElementById('current-attempt').textContent = currentAttempt;
        this.updateProgress(currentAttempt, maxAttempts);
    }

    static updateProgress(currentAttempt, maxAttempts) {
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

    static showGuessResult(result, guess, attemptNumber, remainingAttempts, maxAttempts) {
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

    static showRemainingAttempts(remaining, currentAttempt, maxAttempts) {
        const messagesContainer = document.getElementById('game-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message info';
        messageElement.textContent = `Осталось попыток: ${remaining}`;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.updateProgress(currentAttempt, maxAttempts);
    }

    static showLoseMessage(secretNumber, maxAttempts) {
        const messagesContainer = document.getElementById('game-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message error';
        messageElement.textContent = `К сожалению, вы проиграли. Загаданное число было: ${secretNumber}`;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.updateProgress(maxAttempts, maxAttempts);
    }

    static clearGameMessages() {
        const container = document.getElementById('game-messages');
        if (container) {
            container.innerHTML = `
                <div class="welcome-message">
                    <p>Компьютер загадал число. Попробуйте угадать!</p>
                </div>
            `;
        }
    }

    static clearAttemptsHistory() {
        const container = document.getElementById('attempts-history');
        if (container) {
            container.innerHTML = '';
        }
    }

    static showGamesList(games) {
        const container = document.getElementById('games-list');
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = '<p>Игры не найдены.</p>';
            return;
        }

        let html = '<div class="games-container">';

        games.forEach(game => {
            const status = game.isCompleted ?
                (game.isWon ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') :
                'В ПРОЦЕССЕ';

            const statusClass = game.isCompleted ?
                (game.isWon ? 'won' : 'lost') :
                'in-progress';

            html += `
                <div class="game-item ${statusClass}" data-game-id="${game.id}">
                    <strong>ID: ${game.id}</strong> | Игрок: ${game.playerName}<br>
                    Число: ${game.secretNumber} | Попыток: ${game.attemptsCount}/${game.maxAttempts}<br>
                    Статус: ${status} | Дата: ${new Date(game.startTime).toLocaleString()}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    static showWonGames(games) {
        this.showGamesList(games);
    }

    static showLostGames(games) {
        this.showGamesList(games);
    }

    static showPlayerStats(stats) {
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

    static showReplay(game, attempts) {
        const container = document.getElementById('replay-content');
        if (!container) return;

        if (!game) {
            container.innerHTML = '<p class="message error">Игра с указанным ID не найдена.</p>';
            return;
        }

        let html = `
            <div class="replay-info">
                <h3>Повтор игры ID: ${game.id}</h3>
                <p>Игрок: ${game.playerName}</p>
                <p>Загаданное число: ${game.secretNumber}</p>
                <p>Максимальное число: ${game.maxNumber}</p>
                <p>Максимальное количество попыток: ${game.maxAttempts}</p>
                <p>Результат: ${game.isWon ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</p>
                <p>Количество попыток: ${game.attemptsCount}</p>
            </div>
            <div class="replay-attempts">
                <h4>Ход игры:</h4>
        `;

        attempts.forEach(attempt => {
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
                <div class="attempt-item">
                    Попытка ${attempt.attemptNumber}: ${attempt.guess} - ${resultText}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    static showError(message) {
        alert(`Ошибка: ${message}`);
    }

    static setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');

                tabButtons.forEach(btn => {
                    if (btn.classList) btn.classList.remove('active');
                });
                tabContents.forEach(content => {
                    if (content.classList) content.classList.remove('active');
                });

                if (button.classList) button.classList.add('active');
                const gamesList = document.getElementById('games-list');
                if (gamesList && gamesList.classList) {
                    gamesList.classList.add('active');
                }
            });
        });
    }
}