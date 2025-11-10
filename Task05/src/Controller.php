<?php

namespace aiten163\GuessNumber;

class Controller
{
    public static function main($argc, $argv)
    {
        $options = static::parseCommandLine($argc, $argv);

        try {
            switch ($options['action']) {
                case 'new':
                    static::startNewGame($options);
                    break;
                case 'list':
                    static::showGamesList();
                    break;
                case 'win':
                    static::showWonGames();
                    break;
                case 'lose':
                    static::showLostGames();
                    break;
                case 'stats':
                    static::showPlayerStats();
                    break;
                case 'replay':
                    static::showReplay($options['game-id']);
                    break;
                default:
                    static::showHelp();
                    break;
            }
        } catch (\Exception $e) {
            View::showError($e->getMessage());
        }
    }

    private static function parseCommandLine($argc, $argv)
    {
        $defaultOptions = [
            'action' => 'help',
            'player' => 'Player',
            'max-number' => 100,
            'max-attempts' => 10,
            'game-id' => null
        ];

        if ($argc < 2) {
            return $defaultOptions;
        }

        $action = $argv[1];
        $options = ['action' => $action];

        for ($i = 2; $i < $argc; $i++) {
            if ($argv[$i] === '--player' && isset($argv[$i + 1])) {
                $options['player'] = $argv[++$i];
            } elseif ($argv[$i] === '--max-number' && isset($argv[$i + 1])) {
                $options['max-number'] = (int)$argv[++$i];
            } elseif ($argv[$i] === '--max-attempts' && isset($argv[$i + 1])) {
                $options['max-attempts'] = (int)$argv[++$i];
            } elseif (is_numeric($argv[$i]) && $action === 'replay') {
                $options['game-id'] = (int)$argv[$i];
            }
        }

        return array_merge($defaultOptions, $options);
    }

    private static function startNewGame($options)
    {
        $player = $options['player'];
        $maxNumber = $options['max-number'];
        $maxAttempts = $options['max-attempts'];

        View::showGameStart($player, $maxNumber, $maxAttempts);

        $game = new Game($player, $maxNumber, $maxAttempts);
        $secretNumber = $game->getSecretNumber();

        $attempts = 0;
        $isWinner = false;

        while ($attempts < $maxAttempts) {
            $guess = View::promptGuess($attempts + 1, $maxAttempts);

            if (!is_numeric($guess) || $guess < 1 || $guess > $maxNumber) {
                View::showInvalidInput($maxNumber);
                continue;
            }

            $attempts++;
            $result = $game->checkGuess((int)$guess);

            switch ($result) {
                case 'win':
                    View::showWinMessage($attempts, $secretNumber, $game->getGameId());
                    $isWinner = true;
                    break 2;
                case 'less':
                    View::showHintLess();
                    break;
                case 'greater':
                    View::showHintGreater();
                    break;
            }

            View::showRemainingAttempts($maxAttempts - $attempts);
        }

        if (!$isWinner) {
            View::showLoseMessage($secretNumber, $game->getGameId());
        }

        // Завершаем игру в базе данных
        $game->completeGame($isWinner);
    }

    private static function showGamesList()
    {
        $database = Database::getInstance();
        $games = $database->getAllGames();
        View::showGamesList($games);
    }

    private static function showWonGames()
    {
        $database = Database::getInstance();
        $games = $database->getWonGames();
        View::showWonGames($games);
    }

    private static function showLostGames()
    {
        $database = Database::getInstance();
        $games = $database->getLostGames();
        View::showLostGames($games);
    }

    private static function showPlayerStats()
    {
        $database = Database::getInstance();
        $stats = $database->getPlayerStats();
        View::showPlayerStats($stats);
    }

    private static function showReplay($gameId)
    {
        if (!$gameId) {
            View::showError("Не указан ID игры для повтора");
            return;
        }

        $database = Database::getInstance();
        $game = $database->getGameById($gameId);
        $attempts = $database->getGameAttempts($gameId);

        View::showReplay($game, $attempts);
    }

    private static function showHelp()
    {
        View::showHelp();
    }
}