<?php

namespace aiten163\GuessNumber;

use RedBeanPHP\R;

class Database
{
    private static $instance = null;

    private function __construct()
    {
        $dbPath = __DIR__ . '/../data/game.db';
        $dbDir = dirname($dbPath);

        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        // Настройка RedBeanPHP
        R::setup('sqlite:' . $dbPath);
        R::useFeatureSet('novice/latest');

        // Включить отладку только в development
        if (getenv('APP_ENV') === 'development') {
            R::debug(true, 1);
        }

        $this->createTables();
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function createTables()
    {
        // RedBeanPHP автоматически создаст таблицы при первом использовании
        // Мы можем проверить существование таблиц
        $tables = R::inspect();

        if (!in_array('game', $tables)) {
            // Создадим первую запись чтобы инициализировать таблицу
            $game = R::dispense('game');
            $game->playerName = 'test';
            $game->secretNumber = 1;
            $game->maxNumber = 100;
            $game->maxAttempts = 10;
            $game->isCompleted = false;
            $game->isWon = false;
            $game->attemptsCount = 0;
            $game->startTime = date('Y-m-d H:i:s');
            R::store($game);
            R::trash($game); // Удаляем тестовую запись
        }
    }

    public function saveGame($playerName, $secretNumber, $maxNumber, $maxAttempts)
    {
        $game = R::dispense('game');
        $game->playerName = $playerName;
        $game->secretNumber = $secretNumber;
        $game->maxNumber = $maxNumber;
        $game->maxAttempts = $maxAttempts;
        $game->isCompleted = false;
        $game->isWon = false;
        $game->attemptsCount = 0;
        $game->startTime = date('Y-m-d H:i:s');

        return R::store($game);
    }

    public function saveAttempt($gameId, $attemptNumber, $guess, $result)
    {
        $attempt = R::dispense('attempt');
        $attempt->gameId = $gameId;
        $attempt->attemptNumber = $attemptNumber;
        $attempt->guess = $guess;
        $attempt->result = $result;
        $attempt->attemptTime = date('Y-m-d H:i:s');

        R::store($attempt);
    }

    public function completeGame($gameId, $isWon, $attemptsCount)
    {
        $game = R::load('game', $gameId);
        if ($game->id) {
            $game->isCompleted = true;
            $game->isWon = $isWon;
            $game->attemptsCount = $attemptsCount;
            $game->endTime = date('Y-m-d H:i:s');
            R::store($game);
        }
    }

    public function getAllGames()
    {
        return R::findAll('game', ' ORDER BY start_time DESC');
    }

    public function getWonGames()
    {
        return R::find('game', ' is_won = ? ORDER BY start_time DESC', [1]);
    }

    public function getLostGames()
    {
        return R::find('game', ' is_completed = ? AND is_won = ? ORDER BY start_time DESC', [1, 0]);
    }

    public function getGameAttempts($gameId)
    {
        return R::find('attempt', ' game_id = ? ORDER BY attempt_number', [$gameId]);
    }

    public function getGameById($gameId)
    {
        return R::load('game', $gameId);
    }

    public function getPlayerStats()
    {
        $sql = "
            SELECT 
                player_name,
                COUNT(*) as total_games,
                SUM(CASE WHEN is_won = 1 THEN 1 ELSE 0 END) as won_games,
                SUM(CASE WHEN is_completed = 1 AND is_won = 0 THEN 1 ELSE 0 END) as lost_games,
                AVG(CASE WHEN is_won = 1 THEN attempts_count ELSE NULL END) as avg_attempts_to_win,
                MIN(CASE WHEN is_won = 1 THEN attempts_count ELSE NULL END) as min_attempts_to_win,
                MAX(CASE WHEN is_won = 1 THEN attempts_count ELSE NULL END) as max_attempts_to_win
            FROM game 
            WHERE is_completed = 1
            GROUP BY player_name
            ORDER BY won_games DESC, total_games DESC
        ";

        return R::getAll($sql);
    }

    public function closeConnection()
    {
        R::close();
    }
}