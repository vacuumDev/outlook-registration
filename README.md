# 📧 Outlook Registration Automation

Этот проект автоматически регистрирует почтовые аккаунты Outlook через headless-автоматизацию, используя собранные cookie, заголовки и параметры из HTTPDebugger.

## 🧠 Что делает проект

- Заходит на страницу регистрации Outlook и извлекает необходимые параметры
- Создаёт учётную запись через `signup.live.com` с полным воспроизведением HTTP-запросов
- Решает капчу через сервис EZCaptcha
- Работает с proxy и подменой user-agent
- Имитирует действия браузера с помощью Puppeteer
- Поддерживает регистрацию по заданным странам (например, DE, NL)

## 🚀 Запуск

1. Установить зависимости:

npm install

2. Создать `.env` файл на основе `.env.example` и заполнить:

EZ_CAPTCHA_KEY=ключ от ez-captcha  
PROXY_URL=http://user:pass@ip:port  
COUNTRIES=de,nl

3. Запустить:

node src/app.js

## ⚙ Структура

- `src/app.js` — основной скрипт регистрации
- `src/generator.js` — генерация пользовательских данных
- `src/axios-cookie.js` — обёртка над Axios с cookie-сессиями
- `src/helper.js`, `file-handler.js`, `config.js` — вспомогательные утилиты

## 🧩 Зависимости

- puppeteer  
- axios  
- dotenv  
- qs  
- cheerio

## ⚠️ Примечание

Данный проект предназначен исключительно для ознакомительных и исследовательских целей.
