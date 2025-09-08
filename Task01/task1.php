<?php

function displayGameInstructions() {
    $border = str_repeat("=", 50);

    echo $border . PHP_EOL;
    echo "         ИГРА 'УГАДАЙ ЧИСЛО'          " . PHP_EOL;
    echo $border . PHP_EOL . PHP_EOL;

    echo " ОПИСАНИЕ ИГРЫ:" . PHP_EOL;
    echo "Компьютер случайным образом выбирает число из заданного диапазона." . PHP_EOL;
    echo "Ваша задача - отгадать это число за ограниченное число попыток." . PHP_EOL . PHP_EOL;

    echo " ПОДСКАЗКИ:" . PHP_EOL;
    echo "После каждой попытки система будет сообщать:" . PHP_EOL;
    echo "  • 'Загаданное число БОЛЬШЕ' - если ваш вариант меньше" . PHP_EOL;
    echo "  • 'Загаданное число МЕНЬШЕ' - если ваш вариант больше" . PHP_EOL . PHP_EOL;

    echo " СТАТИСТИКА:" . PHP_EOL;
    echo "Все игры сохраняются в базе данных SQLite для анализа:" . PHP_EOL;
    echo "  • История всех партий" . PHP_EOL;
    echo "  • Статистика по игрокам" . PHP_EOL;
    echo "  • Детализация попыток" . PHP_EOL . PHP_EOL;

    echo " РЕЖИМЫ РАБОТЫ:" . PHP_EOL;
    echo "1. Новая игра" . PHP_EOL;
    echo "2. Просмотр истории игр" . PHP_EOL;
    echo "3. Победные игры" . PHP_EOL;
    echo "4. Проигранные игры" . PHP_EOL;
    echo "5. Рейтинг игроков" . PHP_EOL;
    echo "6. Воспроизведение сохраненной игры" . PHP_EOL . PHP_EOL;

    echo " НАСТРОЙКИ:" . PHP_EOL;
    echo "• Максимальное число диапазона" . PHP_EOL;
    echo "• Лимит попыток на игру" . PHP_EOL;
    echo "• Имя игрока" . PHP_EOL . PHP_EOL;

    echo $border . PHP_EOL;
}

displayGameInstructions();
?>