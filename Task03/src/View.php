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

    public static function showWinMessage($attempts, $secretNumber) {
        echo "\nПоздравляем! Вы угадали число $secretNumber за $attempts попыток!\n";
    }

    public static function showLoseMessage($secretNumber) {
        echo "\nК сожалению, вы проиграли. Загаданное число было: $secretNumber\n";
    }

    public static function showRemainingAttempts($remaining) {
        echo "Осталось попыток: $remaining\n\n";
    }

    public static function showDatabaseMessage($feature) {
        echo "Функция $feature пока не реализована (работа с БД)\n";
    }
}
