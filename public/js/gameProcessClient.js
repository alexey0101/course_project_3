const getAuthToken = async () => {

    const response = await fetch(`${host}/api/users/getAuthToken`, {
        method: 'GET',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        credentials: "same-origin",
    });

    return await response.json();

};

const questionDisplay = document.querySelector('#question-display');
const resultDisplay = document.querySelector('#result-display');
const passwordDisplay = document.querySelector('#password-display');

const startButton = document.querySelector('#start-game');
const closeButton = document.querySelector('#close-game');

const passwordInput = document.querySelector('#lobby-password');
const sendPasswordButton = document.querySelector('#send-password');

const timer = document.querySelectorAll('.timer');

const answerScores = document.querySelector('#answer-scores');
const questionText = document.querySelector('#question-text');
const answerResultLabel = document.querySelector('#answer-label');
const place = document.querySelector('#place');
const scores = document.querySelector('#scores');

const options = document.querySelector('#options');
const firstOption = document.querySelector('#option-1');
const secondOption = document.querySelector('#option-2');
const thirdOption = document.querySelector('#option-3');
const fourthOption = document.querySelector('#option-4');



getAuthToken().then(async (response) => {

    const path = this.pathname || window.location.pathname;
    const roomName = path.substr(path.lastIndexOf('/') + 1);
    const username = response.username;

    var responseGames = await fetch(`${host}/api/games?roomName=${roomName}`, {
        method: 'GET',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        credentials: "same-origin"
    });

    const games = await responseGames.json();
    const foundGame = games.find(game => game.roomName === roomName);

    if (!foundGame) {
        alert('Игра не найдена/уже началась!');
        document.location = '/';
    }
    

    if (foundGame.access === 'Публичный' || username === games.find(game => game.roomName === roomName).host) {
        document.querySelector('#lobby-info-block').classList.remove('d-none');
        passwordDisplay.classList.add('d-none');
        game(undefined);
    }

    sendPasswordButton.addEventListener('click', () => {
        game(passwordInput.value);
    });

    async function game(password) {
        const socket = await io.connect(`${host}`, {
            query: {
                token: response.token,
                roomName,
                password
            }
        });

        socket.on('connect_error', err => {
            alert('Неправильный пароль!');
            socket.disconnect();
        });

        socket.on('connect', async () => {
            if (password) {
                passwordDisplay.classList.add('d-none');
                document.querySelector('#lobby-info-block').classList.remove('d-none');
            }
            let time;
            let timerCountdown;
            let timerType;

            const runTimer = async (seconds, timerT) => {
                clearInterval(timerCountdown);
                timerType = timerT;
                timerCountdown = setInterval(updateTimer, 1000);
                time = seconds;
            };

            function updateTimer() {
                let minutes = Math.floor(time / 60);
                let seconds = time % 60;

                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;

                timer.forEach(timer => {
                    timer.innerHTML = `<h1>${minutes} : ${seconds}</h1>`;
                });

                time--;

                if (time === -1) {
                    clearInterval(timerCountdown);
                    if (timerType === 'Question' && !options.classList.contains('d-none')) {
                        socket.emit('emptyAnswer');
                    }
                }
            }

            startButton.addEventListener('click', () => {
                document.querySelector('#lobby-info-block').classList.add('d-none');
                socket.emit('startGame');
            });

            closeButton.addEventListener('click', () => {
                document.location = '/';
            });

            let score = 0;

            firstOption.addEventListener('click', async () => {
                socket.emit('sendAnswer', {
                    answer: 1
                });

                options.classList.add('d-none');
            });

            secondOption.addEventListener('click', async () => {
                socket.emit('sendAnswer', {
                    answer: 2
                });

                options.classList.add('d-none');
            });

            thirdOption.addEventListener('click', async () => {
                socket.emit('sendAnswer', {
                    answer: 3
                });

                options.classList.add('d-none');
            });

            fourthOption.addEventListener('click', async () => {
                socket.emit('sendAnswer', {
                    answer: 4
                });

                options.classList.add('d-none');
            });

            socket.on('playersNumber', (players) => {
                console.log(players);
                const counter = document.querySelector('#players-number');
                counter.textContent = players.players + '/' + players.maxPlayers;
            });

            socket.on('hostMissing', () => {
                alert('Создатель комнаты ещё не зашёл!');
                document.location = '/';
            });

            socket.on('roomFull', () => {
                alert('Комната полная!');
                document.location = '/';
            });

            socket.on('doubleSession', () => {
                alert('Вы уже подключены к игре!');
                document.location = '/';
            });

            socket.on('nullRoom', () => {
                const w = alert('Нет комнаты с таким названием!');
                document.location = '/';
            });

            socket.on('hostDisconnect', () => {
                alert('Создатель комнаты вышел!');
                document.location = '/';
            });

            socket.on('hostMode', () => {
                startButton.classList.remove("invisible");
                closeButton.classList.remove("invisible");
            });

            socket.on('getQuestion', (question, { tablescore }) => {
                runTimer(60, 'Question');

                if (!document.querySelector('#lobby-info-block').classList.contains('d-none')) {
                    document.querySelector('#lobby-info-block').classList.add('d-none');
                }

                resultDisplay.classList.add('d-none');
                questionDisplay.classList.remove('d-none');
                options.classList.remove('d-none');

                questionText.textContent = question.description;

                firstOption.textContent = question.answers[0];
                secondOption.textContent = question.answers[1];
                thirdOption.textContent = question.answers[2];
                fourthOption.textContent = question.answers[3];

                const record = tablescore[tablescore.findIndex(element => element.user === username)];

                place.innerHTML = `Ваше место:<br> ${tablescore.findIndex(element => element.user === username) + 1}`;
                scores.innerHTML = `Ваши очки:<br> ${record.scores}`;
            });

            socket.on('getResult', (result) => {
                runTimer(8, 'Result');

                questionDisplay.classList.add('d-none');
                resultDisplay.classList.remove('d-none');

                const scoreDiff = result.tablescore[result.tablescore.findIndex(element => element.user === username)].scores - score;

                if (scoreDiff > 0) {
                    answerResultLabel.textContent = 'Правильный ответ!';
                    answerScores.textContent = `Очки: +${scoreDiff}`;
                } else {
                    answerResultLabel.textContent = 'Неправильный ответ!';
                    answerScores.textContent = `Очки: 0`;
                }

                score = result.tablescore[result.tablescore.findIndex(element => element.user === username)].scores;
            });

            socket.on('questionOver', () => {
                socket.emit('nextQuestion');
            });

            socket.on('gameOver', ({ tablescore }) => {
                document.querySelector('#lobby-info-block').classList.add('d-none');
                questionDisplay.classList.add('d-none');
                resultDisplay.classList.add('d-none');

                const endGameDisplay = document.querySelector('#end-game-display');
                const endGameTemplate = document.querySelector('#end-game-template').innerHTML;

                const resultTable = document.querySelector('#result-table');

                const html = Mustache.render(endGameTemplate, { tablescore });
                resultTable.innerHTML = html;

                endGameDisplay.classList.remove('d-none');

                // window.location = '/';
            });

            socket.emit('join');
        });
    }
});