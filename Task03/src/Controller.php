<?php
namespace aiten163\GuessNumber;

class Controller
{
    public static function  main($argc, $argv) {
        $options = static::parseCommandLine($argc, $argv);

        switch ($options['action']) {
            case 'new':
                static::startNewGame($options);
                break;
            case 'list':
                View::showDatabaseMessage('списка всех игр');
                break;
            case 'win':
                View::showDatabaseMessage('списка выигранных игр');
                break;
            case 'lose':
                View::showDatabaseMessage('списка проигранных игр');
                break;
            case 'stats':
                View::showDatabaseMessage('статистики игроков');
                break;
            case 'replay':
                View::showDatabaseMessage('повтора игры');
                break;
            default:
                static::showHelp();
                break;
        }
    }

    private static function parseCommandLine($argc, $argv) {
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

    private static function startNewGame($options) {
        $player = $options['player'];
        $maxNumber = $options['max-number'];
        $maxAttempts = $options['max-attempts'];

        View::showGameStart($player, $maxNumber, $maxAttempts);

        $game = new Game($maxNumber, $maxAttempts);
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
                    View::showWinMessage($attempts, $secretNumber);
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
            View::showLoseMessage($secretNumber);
        }

        View::showDatabaseMessage('сохранения результатов игры');
    }

    private static function showHelp() {
        View::showHelp();
    }
}
