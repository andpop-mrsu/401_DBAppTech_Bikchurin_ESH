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

        // Разблокируем поля ввода
        document.getElementById('guess-input').disabled = false;
        document.getElementById('guess-btn').disabled = false;
        document.getElementById('guess-input').value = '';
        document.getElementById('guess-input').focus();
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
            const status = game.is_completed ?
                (game.is_won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') :
                'В ПРОЦЕССЕ (можно продолжить)';

            const statusClass = game.is_completed ?
                (game.is_won ? 'won' : 'lost') :
                'in-progress';

            // Добавляем класс clickable и data-атрибут для кликабельности
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

    static showReplayScreen() {
        this.showScreen('replay-screen');
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

    static showReplayAttempt(attemptIndex) {
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

    static setupReplayControls(onPause, onResume, onStop, onBack) {
        const pauseBtn = document.getElementById('pause-replay');
        const resumeBtn = document.getElementById('resume-replay');
        const stopBtn = document.getElementById('stop-replay');
        const backBtn = document.getElementById('back-to-menu-from-replay');

        // Убираем старые обработчики
        if (pauseBtn) pauseBtn.onclick = null;
        if (resumeBtn) resumeBtn.onclick = null;
        if (stopBtn) stopBtn.onclick = null;
        if (backBtn) backBtn.onclick = null;

        // Устанавливаем новые обработчики
        if (pauseBtn) {
            pauseBtn.addEventListener('click', onPause);
        }
        if (resumeBtn) {
            resumeBtn.addEventListener('click', onResume);
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', onStop);
        }
        if (backBtn) {
            backBtn.addEventListener('click', onBack);
        }
    }

    static setReplayPaused(isPaused) {
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
            });
        });
    }
}