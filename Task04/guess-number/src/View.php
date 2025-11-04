<?php
namespace aiten163\GuessNumber;

class View
{
    public static function showHelp() {
        echo "Игра 'Угадай число'\n\n";
        echo "Использование:\n";
        echo "  guess-number new [--player NAME] [--max-number N] [--max-attempts N]\n";
        echo "  guess-number list\n";
        echo "  guess-number win\n";
        echo "  guess-number lose\n";
        echo "  guess-number stats\n";
        echo "  guess-number replay ID\n\n";
        echo "Команды:\n";
        echo "  new     - Начать новую игру\n";
        echo "  list    - Показать список всех игр\n";
        echo "  win     - Показать выигранные игры\n";
        echo "  lose    - Показать проигранные игры\n";
        echo "  stats   - Показать статистику игроков\n";
        echo "  replay  - Повторить игру по ID\n\n";
        echo "Параметры для new:\n";
        echo "  --player NAME       - Имя игрока (по умолчанию: Player)\n";
        echo "  --max-number N      - Максимальное число (по умолчанию: 100)\n";
        echo "  --max-attempts N    - Максимальное число попыток (по умолчанию: 10)\n";
    }

    public static function showGameStart($player, $maxNumber, $maxAttempts) {
        echo "=== Новая игра ===\n";
        echo "Игрок: $player\n";
        echo "Диапазон чисел: 1 - $maxNumber\n";
        echo "Максимальное количество попыток: $maxAttempts\n";
        echo "Компьютер загадал число. Попробуйте угадать!\n\n";
    }

    public static function promptGuess($currentAttempt, $maxAttempts) {
        return \cli\prompt("Попытка $currentAttempt/$maxAttempts. Введите число");
    }

    public static function showInvalidInput($maxNumber) {
        echo "Ошибка! Введите число от 1 до $maxNumber\n";
    }

    public static function showHintLess() {
        echo "Загаданное число МЕНЬШЕ\n";
    }

    public static function showHintGreater() {
        echo "Загаданное число БОЛЬШЕ\n";
    }

    public static function showWinMessage($attempts, $secretNumber, $gameId) {
        echo "\nПоздравляем! Вы угадали число $secretNumber за $attempts попыток!\n";
        echo "ID игры: $gameId (сохранено в базе данных)\n";
    }

    public static function showLoseMessage($secretNumber, $gameId) {
        echo "\nК сожалению, вы проиграли. Загаданное число было: $secretNumber\n";
        echo "ID игры: $gameId (сохранено в базе данных)\n";
    }

    public static function showRemainingAttempts($remaining) {
        echo "Осталось попыток: $remaining\n\n";
    }

    public static function showGamesList($games) {
        if (empty($games)) {
            echo "Игры не найдены.\n";
            return;
        }

        echo "=== Список всех игр ===\n";
        foreach ($games as $game) {
            $status = $game['is_completed']
                ? ($game['is_won'] ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ')
                : 'В ПРОЦЕССЕ';
            echo "ID: {$game['id']} | Игрок: {$game['player_name']} | ";
            echo "Число: {$game['secret_number']} | Попыток: {$game['attempts_count']}/{$game['max_attempts']} | ";
            echo "Статус: $status | Дата: {$game['start_time']}\n";
        }
    }

    public static function showWonGames($games) {
        if (empty($games)) {
            echo "Выигранные игры не найдены.\n";
            return;
        }

        echo "=== Выигранные игры ===\n";
        foreach ($games as $game) {
            echo "ID: {$game['id']} | Игрок: {$game['player_name']} | ";
            echo "Число: {$game['secret_number']} | Попыток: {$game['attempts_count']}/{$game['max_attempts']} | ";
            echo "Дата: {$game['start_time']}\n";
        }
    }

    public static function showLostGames($games) {
        if (empty($games)) {
            echo "Проигранные игры не найдены.\n";
            return;
        }

        echo "=== Проигранные игры ===\n";
        foreach ($games as $game) {
            echo "ID: {$game['id']} | Игрок: {$game['player_name']} | ";
            echo "Число: {$game['secret_number']} | Попыток: {$game['attempts_count']}/{$game['max_attempts']} | ";
            echo "Дата: {$game['start_time']}\n";
        }
    }

    public static function showPlayerStats($stats) {
        if (empty($stats)) {
            echo "Статистика игроков не найдена.\n";
            return;
        }

        echo "=== Статистика игроков ===\n";
        foreach ($stats as $stat) {
            $winRate = $stat['total_games'] > 0
                ? round(($stat['won_games'] / $stat['total_games']) * 100, 2)
                : 0;

            echo "Игрок: {$stat['player_name']}\n";
            echo "  Всего игр: {$stat['total_games']}\n";
            echo "  Побед: {$stat['won_games']}\n";
            echo "  Поражений: {$stat['lost_games']}\n";
            echo "  Процент побед: {$winRate}%\n";

            if ($stat['won_games'] > 0) {
                echo "  Среднее кол-во попыток для победы: " . round($stat['avg_attempts_to_win'], 2) . "\n";
                echo "  Минимальное кол-во попыток для победы: {$stat['min_attempts_to_win']}\n";
                echo "  Максимальное кол-во попыток для победы: {$stat['max_attempts_to_win']}\n";
            }
            echo "\n";
        }
    }

    public static function showReplay($game, $attempts) {
        if (!$game) {
            echo "Игра с указанным ID не найдена.\n";
            return;
        }

        echo "=== Повтор игры ID: {$game['id']} ===\n";
        echo "Игрок: {$game['player_name']}\n";
        echo "Загаданное число: {$game['secret_number']}\n";
        echo "Максимальное число: {$game['max_number']}\n";
        echo "Максимальное количество попыток: {$game['max_attempts']}\n";
        echo "Результат: " . ($game['is_won'] ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') . "\n";
        echo "Количество попыток: {$game['attempts_count']}\n\n";

        echo "Ход игры:\n";
        foreach ($attempts as $attempt) {
            echo "Попытка {$attempt['attempt_number']}: {$attempt['guess']} - ";
            switch ($attempt['result']) {
                case 'win':
                    echo "ПОБЕДА! Число угадано!\n";
                    break;
                case 'greater':
                    echo "Загаданное число БОЛЬШЕ\n";
                    break;
                case 'less':
                    echo "Загаданное число МЕНЬШЕ\n";
                    break;
            }
        }
    }

    public static function showError($message) {
        echo "Ошибка: $message\n";
    }
}