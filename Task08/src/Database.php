<?php
class Database {
    private $pdo;

    public function __construct() {
        $dbPath = __DIR__ . '/../db/games.db';
        $dir = dirname($dbPath);

        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $this->pdo = new PDO("sqlite:$dbPath");
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->createTables();
    }

    private function createTables() {
        $this->pdo->exec("
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
            )
        ");

        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                attempt_number INTEGER NOT NULL,
                guess INTEGER NOT NULL,
                result TEXT NOT NULL,
                attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
            )
        ");

        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_games_start_time ON games(start_time)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_games_is_completed ON games(is_completed)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_games_is_won ON games(is_won)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_attempts_game_id ON attempts(game_id)");
    }

    public function getAllGames() {
        $stmt = $this->pdo->query("
            SELECT * FROM games 
            ORDER BY start_time DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getGameById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM games WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getGameAttempts($gameId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM attempts 
            WHERE game_id = ? 
            ORDER BY attempt_number ASC
        ");
        $stmt->execute([$gameId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createGame($playerName, $maxNumber, $maxAttempts, $secretNumber) {
        $stmt = $this->pdo->prepare("
            INSERT INTO games (player_name, secret_number, max_number, max_attempts) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$playerName, $secretNumber, $maxNumber, $maxAttempts]);
        return $this->pdo->lastInsertId();
    }

    public function saveAttempt($gameId, $attemptNumber, $guess, $result) {
        $stmt = $this->pdo->prepare("
            INSERT INTO attempts (game_id, attempt_number, guess, result) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$gameId, $attemptNumber, $guess, $result]);

        $stmt = $this->pdo->prepare("
            UPDATE games 
            SET attempts_count = ? 
            WHERE id = ?
        ");
        $stmt->execute([$attemptNumber, $gameId]);

        if ($result === 'win' || $attemptNumber >= $this->getMaxAttempts($gameId)) {
            $isWon = ($result === 'win');
            $this->completeGame($gameId, $isWon, $attemptNumber);
        }

        return $this->pdo->lastInsertId();
    }

    private function getMaxAttempts($gameId) {
        $stmt = $this->pdo->prepare("SELECT max_attempts FROM games WHERE id = ?");
        $stmt->execute([$gameId]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        return $game['max_attempts'] ?? 10;
    }

    private function completeGame($gameId, $isWon, $attemptsCount) {
        $stmt = $this->pdo->prepare("
            UPDATE games 
            SET is_completed = 1, is_won = ?, attempts_count = ?, end_time = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $stmt->execute([$isWon ? 1 : 0, $attemptsCount, $gameId]);
    }

    public function getWonGames() {
        $stmt = $this->pdo->query("
            SELECT * FROM games 
            WHERE is_completed = 1 AND is_won = 1 
            ORDER BY start_time DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getLostGames() {
        $stmt = $this->pdo->query("
            SELECT * FROM games 
            WHERE is_completed = 1 AND is_won = 0 
            ORDER BY start_time DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPlayerStats() {
        $stmt = $this->pdo->query("
            SELECT 
                player_name,
                COUNT(*) as total_games,
                SUM(CASE WHEN is_won = 1 THEN 1 ELSE 0 END) as won_games,
                SUM(CASE WHEN is_completed = 1 AND is_won = 0 THEN 1 ELSE 0 END) as lost_games
            FROM games 
            WHERE is_completed = 1
            GROUP BY player_name
            ORDER BY won_games DESC, total_games DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>