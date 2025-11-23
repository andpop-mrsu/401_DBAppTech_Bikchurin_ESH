<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../src/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

switch (true) {
    case $path === '/' && $method === 'GET':
        readfile(__DIR__ . '/index.html');
        exit;

    case $path === '/games' && $method === 'GET':
        getGames();
        break;

    case preg_match('#^/games/(\d+)$#', $path, $matches) && $method === 'GET':
        getGame($matches[1]);
        break;

    case $path === '/games' && $method === 'POST':
        createGame();
        break;

    case preg_match('#^/step/(\d+)$#', $path, $matches) && $method === 'POST':
        saveStep($matches[1]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found: ' . $path]);
        break;
}

function getGames() {
    try {
        $db = new Database();
        $games = $db->getAllGames();

        header('Content-Type: application/json');
        echo json_encode($games);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function getGame($id) {
    try {
        $db = new Database();
        $game = $db->getGameById($id);

        if (!$game) {
            http_response_code(404);
            echo json_encode(['error' => 'Game not found']);
            return;
        }

        $attempts = $db->getGameAttempts($id);

        header('Content-Type: application/json');
        echo json_encode([
            'game' => $game,
            'attempts' => $attempts
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function createGame() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        // Валидация входных данных
        if (!isset($input['playerName']) || !isset($input['maxNumber']) || !isset($input['maxAttempts']) || !isset($input['secretNumber'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        $db = new Database();
        $gameId = $db->createGame(
            $input['playerName'],
            $input['maxNumber'],
            $input['maxAttempts'],
            $input['secretNumber']
        );

        header('Content-Type: application/json');
        echo json_encode(['id' => $gameId]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function saveStep($gameId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['attemptNumber']) || !isset($input['guess']) || !isset($input['result'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        $db = new Database();
        $stepId = $db->saveAttempt(
            $gameId,
            $input['attemptNumber'],
            $input['guess'],
            $input['result']
        );

        header('Content-Type: application/json');
        echo json_encode(['id' => $stepId]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>