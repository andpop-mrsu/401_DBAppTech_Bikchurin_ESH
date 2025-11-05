<?php

namespace aiten163\GuessNumber;

class Game
{
    private $secretNumber;
    private $maxNumber;
    private $maxAttempts;
    private $gameId;
    private $playerName;
    private $attempts;
    private $database;

    public function __construct($playerName, $maxNumber = 100, $maxAttempts = 10)
    {
        $this->playerName = $playerName;
        $this->maxNumber = $maxNumber;
        $this->maxAttempts = $maxAttempts;
        $this->secretNumber = rand(1, $maxNumber);
        $this->attempts = [];
        $this->database = Database::getInstance();

        // Сохраняем игру в базу данных
        $this->gameId = $this->database->saveGame(
            $playerName,
            $this->secretNumber,
            $maxNumber,
            $maxAttempts
        );
    }

    public function checkGuess($guess)
    {
        $attemptNumber = count($this->attempts) + 1;
        $result = '';

        if ($guess === $this->secretNumber) {
            $result = 'win';
        } elseif ($guess < $this->secretNumber) {
            $result = 'greater';
        } else {
            $result = 'less';
        }

        // Сохраняем попытку в базу данных
        $this->database->saveAttempt($this->gameId, $attemptNumber, $guess, $result);
        $this->attempts[] = ['guess' => $guess, 'result' => $result];

        return $result;
    }

    public function completeGame($isWon)
    {
        $this->database->completeGame($this->gameId, $isWon, count($this->attempts));
    }

    public function getSecretNumber()
    {
        return $this->secretNumber;
    }

    public function getMaxAttempts()
    {
        return $this->maxAttempts;
    }

    public function getMaxNumber()
    {
        return $this->maxNumber;
    }

    public function getGameId()
    {
        return $this->gameId;
    }

    public function getAttemptsCount()
    {
        return count($this->attempts);
    }
}