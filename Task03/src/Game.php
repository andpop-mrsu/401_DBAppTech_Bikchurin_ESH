<?php
namespace aiten163\GuessNumber;

class Game {
    private $secretNumber;
    private $maxNumber;
    private $maxAttempts;

    public function __construct($maxNumber = 100, $maxAttempts = 10) {
        $this->maxNumber = $maxNumber;
        $this->maxAttempts = $maxAttempts;
        $this->secretNumber = rand(1, $maxNumber);
    }

    public function checkGuess($guess) {
        if ($guess === $this->secretNumber) {
            return 'win';
        } elseif ($guess < $this->secretNumber) {
            return 'greater';
        } else {
            return 'less';
        }
    }

    public function getSecretNumber() {
        return $this->secretNumber;
    }

    public function getMaxAttempts() {
        return $this->maxAttempts;
    }

    public function getMaxNumber() {
        return $this->maxNumber;
    }
}