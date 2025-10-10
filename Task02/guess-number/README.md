# Guess Number

Угадай число - консольная игра. Игрок должен отгадать число.

## Требования

PHP версии не ниже 7.4

Composer версии не ниже 2.0

В php.ini должны быть включены:
extension=mbstring

## Установка и запуск
### Вариант 1. Локально (через git clone)

1. Клонировать репозиторий: git clone https://github.com/aiten163/guess-number.git

2. Перейти в каталог проекта: cd guess-number

3. Установить зависимости: composer install

4. Запустить игру: php bin/guess-number

### Вариант 2. Через Packagist (глобально)

1. Установить пакет: composer global require aiten163/guess-number

2. Запустить игру командой: guess-number