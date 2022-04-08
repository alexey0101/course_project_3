const AsyncLock = require('async-lock');
const lock = new AsyncLock();

const Game = require('../models/game');
const Quiz = require('../models/quiz');
const User = require('../models/user');

var games = [];

const validateGameInfo = async function (roomName, maxPlayers, quizId, access, userId, password) {

    if (!roomName || !maxPlayers || !quizId || !access || (!password && access === 'Private')) {
        throw new Error('Заполните все поля!');
    }

    const user = await User.findById(userId);
    const userQuizzes = user.quizzes.map(quiz => quiz.quiz);
    
    if (await Quiz.findById(quizId) === null || !userQuizzes.some(quiz => quiz.equals(quizId))) {
        throw new Error('Викторины с таким id не существует!');
    }

    if (roomName.length < 3) {
        throw new Error('Название комнаты должно содержать хотя бы 3 символа!');
    }

    if (maxPlayers < 2 || maxPlayers > 16) {
        throw new Error('Количество игроков должно быть в пределах от 2 до 16!');
    }

    if (access !== 'Public' && access !== 'Private') {
        throw new Error('Доступ должен быть публичным или приватным!');
    }
};

const addGame = async function (roomName, maxPlayers, quizId, access, userId, password) {

    try {

        await validateGameInfo(roomName, maxPlayers, quizId, access, userId, password);

        var status = 0;

        await lock.acquire('gamesLock', function () {
            const res = games.filter(game => game.roomName === roomName);
            if (res.length === 0) {
                status = 1;
                const game = new Game(roomName, maxPlayers, quizId, access, userId, password);
                games.push(game);
            }
        });

        return status;
    } catch (e) {
        return {error: e};
    }
};

const deleteGame = async function (roomName) {
    var status = 0;
    await lock.acquire('gamesLock', function () {
        const index = games.findIndex(game => game.roomName === roomName);

        if (index !== -1) {
            status = 1;
            return games.splice(index, 1)[0];
        }

    });

    return status;
};

const getGames = async function () {

    var gamesArr = [];

    await lock.acquire('gamesLock', function () {
        gamesArr = [...games];
    });

    return gamesArr;
};

const getGame = async function (roomName) {

    var game;

    await lock.acquire('gamesLock', function () {
        const index = games.findIndex(game => game.roomName === roomName);

        if (index !== -1) {
            game = games[index];
        }
    });

    return game;
};

module.exports = {
    addGame,
    deleteGame,
    getGames,
    getGame
};