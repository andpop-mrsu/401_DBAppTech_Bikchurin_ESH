#!/bin/bash

DATABASE="launch_history.db"
TABLE="program_launches"
CURRENT_USER=$(whoami)
NOW=$(date '+%Y-%m-%d %H:%M:%S')

export LC_ALL=en_US.UTF-8

if [ ! -f "$DATABASE" ]; then
    sqlite3 "$DATABASE" "CREATE TABLE $TABLE (
        launch_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );"
    echo "База данных создана: $DATABASE"
fi

sqlite3 "$DATABASE" "INSERT INTO $TABLE (username, timestamp) VALUES ('$CURRENT_USER', '$NOW');"

total_launches=$(sqlite3 "$DATABASE" "SELECT COUNT(*) FROM $TABLE;")
first_launch=$(sqlite3 "$DATABASE" "SELECT timestamp FROM $TABLE ORDER BY timestamp ASC LIMIT 1;")

echo "Программа: self-logger.sh"
echo "Всего запусков: $total_launches"
echo "Первая запись: $first_launch"
echo ""
echo "-----------------------------------------"
echo "Пользователь  | Время запуска"
echo "-----------------------------------------"

sqlite3 -header -column "$DATABASE" "SELECT username as 'Пользователь', timestamp as 'Время_запуска' FROM $TABLE;"

echo "-----------------------------------------"
echo "Логирование завершено успешно!"