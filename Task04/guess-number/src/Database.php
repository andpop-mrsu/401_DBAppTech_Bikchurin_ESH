<?php
namespace aiten163\GuessNumber;

class Database
{
    private $pdo;
    private static $instance = null;

    private function __construct()
    {
        $dbPath = __DIR__ . '/../data/game.db';
        $dbDir = dirname($dbPath);

        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $this->pdo = new \PDO("sqlite:$dbPath");
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
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
        $sql = "
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                secret_number INTEGER NOT NULL,
                max_number INTEGER NOT NULL,
                max_attempts INTEGER NOT NULL,
                is_completed BOOLEAN DEFAULT 0,
                is_won BOOLEAN DEFAULT 0,
                attempts_count INTEGER DEFAULT 0,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME
            );
            
            CREATE TABLE IF NOT EXISTS game_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                attempt_number INTEGER NOT NULL,
                guess INTEGER NOT NULL,
                result TEXT NOT NULL,
                attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
            );
        ";

        $this->pdo->exec($sql);
    }

    public function saveGame($playerName, $secretNumber, $maxNumber, $maxAttempts)
    {
        $sql = "INSERT INTO games (player_name, secret_number, max_number, max_attempts) 
                VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$playerName, $secretNumber, $maxNumber, $maxAttempts]);
        return $this->pdo->lastInsertId();
    }

    public function saveAttempt($gameId, $attemptNumber, $guess, $result)
    {
        $sql = "INSERT INTO game_attempts (game_id, attempt_number, guess, result) 
                VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gameId, $attemptNumber, $guess, $result]);
    }

    public function completeGame($gameId, $isWon, $attemptsCount)
    {
        $sql = "UPDATE games SET is_completed = 1, is_won = ?, attempts_count = ?, end_time = CURRENT_TIMESTAMP 
                WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$isWon ? 1 : 0, $attemptsCount, $gameId]);
    }

    public function getAllGames()
    {
        $sql = "SELECT * FROM games ORDER BY start_time DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getWonGames()
    {
        $sql = "SELECT * FROM games WHERE is_won = 1 ORDER BY start_time DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getLostGames()
    {
        $sql = "SELECT * FROM games WHERE is_completed = 1 AND is_won = 0 ORDER BY start_time DESC";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getGameAttempts($gameId)
    {
        $sql = "SELECT * FROM game_attempts WHERE game_id = ? ORDER BY attempt_number";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gameId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getGameById($gameId)
    {
        $sql = "SELECT * FROM games WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$gameId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
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
            FROM games 
            WHERE is_completed = 1
            GROUP BY player_name
            ORDER BY won_games DESC, total_games DESC
        ";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}