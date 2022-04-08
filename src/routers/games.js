const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const Quiz = require('../models/quiz');
const auth = require('../middleware/auth');
const games = require('../utils/games');
const router = new express.Router();

router.post('/api/games', auth, async (req, res) => {
    try {
        var { roomName, maxPlayers, quizId, access, password } = req.body;

        if (!quizId) {
            throw new Error('Викторина не указана!');
        }

        const status = await games.addGame(roomName, maxPlayers, new mongoose.Types.ObjectId(quizId), access, req.user._id, password);

        if (status !== 1) {
            if (status === 0) {
                throw new Error('Комната с таким названием уже существует!');
            } else {
                throw new Error(status.error.message);
            }
        }

        res.send({ message: 'Game was created!' });
    } catch(e) {
        res.status(400).send( { error: e.message } );
    }
});

router.get('/api/games', auth, async (req, res) => {
    try {

        let gameList = await games.getGames();

        if (req.query.roomName) {
            gameList = gameList.filter(game => game.roomName.toLowerCase().includes(req.query.roomName.toLowerCase()));
        }

        gameList = gameList.filter(game => !game.gameStarted);
        
        delete gameList.password;

        res.send(await getGameInfo(gameList));
    } catch(e) {
        res.status(400).send( { error: e.message } );
    }
});

const getGameInfo = (gameList) => {
    const promises = gameList.map(async ({ roomName, maxPlayers, quizId, access, host, players }) => {
        return {
            roomName,
            maxPlayers,
            quizName: (await Quiz.findById(quizId)).name,
            themes: (await Quiz.findById(quizId)).questions.map(question => question.theme),
            access: access === 'Public' ? 'Публичный' : 'Приватный',
            players: players.length,
            host: (await User.findById(host)).username
        };
    });

    return Promise.all(promises);
};

module.exports = router;