const express = require('express');
const http = require('http');
const path = require('path');
const hbs = require('hbs');
const socketio = require('socket.io');
const cookieParser = require('cookie-parser');
const User = require('./models/user');
const Quiz = require('./models/quiz');
const jwt = require('jsonwebtoken');
const games = require('./utils/games');
require('./db/mongoose');

const mongoose = require('mongoose');

const userRouter = require('./routers/user');
const viewRouter = require('./routers/views');
const gameRouter = require('./routers/games');
const quizRouter = require('./routers/quizzes');

//const exp = require('constants');
//const { hashSync } = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

app.set('view engine', 'hbs');
app.set('views', viewsPath);

hbs.registerPartials(partialsPath);

hbs.registerHelper('raw-helper', function (options) {
    return options.fn();
});

app.use(express.json());
app.use(cookieParser());
app.use(userRouter);
app.use(viewRouter);
app.use(gameRouter);
app.use(quizRouter);
app.use(express.static(publicDirectoryPath));

app.get('*', async (req, res) => {
    res.status(404).render('404');
});

io.use(async (socket, next) => {
    try {
        if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.roomName) {
            const decoded = jwt.verify(socket.handshake.query.token, 'thisissecret');
            const user = await User.findOne({ _id: decoded._id, 'tokens.token': socket.handshake.query.token });

            if (!user) {
                return next(new Error('Wrong auth token!'));
            }
            const password = socket.handshake.query.password;

            const game = await games.getGame(socket.handshake.query.roomName);

            if (!user._id.equals(game.host) && game.access === 'Private' && password !== game.password) {
                return next(new Error('Wrong password!'));
            }

            socket.user = user._id;
            socket.roomName = socket.handshake.query.roomName;

            next();
        } else {
            next(new Error('Access error!'));
        }

    } catch (e) {
        console.log(e);
        next(e);
    }

}).on('connection', (socket) => {
    socket.on('join', async () => {
        try {
            const game = await games.getGame(socket.roomName);

            if (!game) {
                return socket.emit('nullRoom');
            }

            if (!game.players.some(player => player.equals(game.host)) && !socket.user.equals(game.host)) {
                socket.emit('hostMissing');
            } else {
                if (game.players.length >= game.maxPlayers) {
                    socket.emit('roomFull');
                } else {
                    if (!game.players.some(player => player.equals(socket.user))) {
                        game.players.push(socket.user);

                        const username = (await User.findOne({ _id: socket.user })).username;
                
                        if (!game.tablescore.some(user => user.user === username)) {
                            game.tablescore.push({ user: username, scores: 0 });
                        }
                        socket.join(socket.roomName);

                        if (socket.user.equals(game.host)) {
                            socket.emit('hostMode');
                        }

                        io.to(socket.roomName).emit('playersNumber', {
                            players: game.players.length,
                            maxPlayers: game.maxPlayers
                        });
                    }
                    else {
                        socket.doubleSession = true;
                        socket.emit('doubleSession');
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on('startGame', async () => {
        try {
            const game = await games.getGame(socket.roomName);

            const quiz = await Quiz.findOne({ _id: game.quizId });

            game.remainingQuestions = quiz.questions;
            game.gameStarted = true;

            io.to(socket.roomName).emit('questionOver');
        } catch (e) {
            console.log(e);
        }
    });

    socket.on('emptyAnswer', async () => {

        try {
            const game = await games.getGame(socket.roomName);

            game.playersAnswered.push(socket.user);

            const username = (await User.findOne({ _id: socket.user })).username;
            let tableIndex = game.tablescore.findIndex(user => user.user === username);
            //!   game.tablescore[tableIndex].lastQuestionCost = questionCost;

            if (game.playersAnswered.length >= game.players.length) {
                game.playersAnswered = [];
                game.remainingQuestions.splice(0, 1);
                io.to(socket.roomName).emit('getResult', { tablescore: game.tablescore });

                setTimeout(function () {
                    io.to(socket.roomName).emit('questionOver');
                }, 10000);
            }
        } catch (e) {
            console.log(e);
        }

    });

    socket.on('sendAnswer', async (answerNumber) => {

        const answerSend = Date.now();
        try {
            const game = await games.getGame(socket.roomName);

            let questionCost;

            if (game.question.answers[answerNumber.answer - 1].correct) {

                const answerTime = (answerSend - game.questionSend) / 1000;
                if (answerTime < 15) {
                    questionCost = game.question.cost;
                } else {
                    if (answerTime < 30) {
                        questionCost = Math.floor(game.question.cost * 0.75);
                    } else {
                        if (answerTime < 45) {
                            questionCost = Math.floor(game.question.cost * 0.5);
                        } else {
                            if (answerTime < 60) {
                                questionCost = Math.floor(game.question.cost * 0.25);
                            } else {
                                questionCost = 0;
                            }
                        }
                    }
                }

                const username = (await User.findOne({ _id: socket.user })).username;
                let tableIndex = game.tablescore.findIndex(user => user.user === username);
                game.tablescore[tableIndex].scores += questionCost;

                //socket.emit('getResult', { correct: true, answerScores: questionCost });
            } else {
                //socket.emit('getResult', { correct: false, answerScores: 0 });
            }

            game.playersAnswered.push(socket.user);

            if (game.playersAnswered.length >= game.players.length) {
                game.playersAnswered = [];
                game.remainingQuestions.splice(0, 1);
                io.to(socket.roomName).emit('getResult', { tablescore: game.tablescore });

                setTimeout(function () {
                    io.to(socket.roomName).emit('questionOver');
                }, 10000);
            }

        } catch (e) {
            console.log(e);
        }
    });

    socket.on('nextQuestion', async () => {

        try {
            const game = await games.getGame(socket.roomName);

            if (game.remainingQuestions.length > 0) {

                game.playersRequested.push(socket.user);

                if (game.playersRequested.length >= game.players.length) {
                    const question = game.remainingQuestions[0];
                    game.question = question;
                    game.questionSend = Date.now();

                    game.tablescore = game.tablescore.sort((a, b) => (a.scores > b.scores) ? -1 : ((b.scores > a.scores) ? 1 : 0));

                    const answers = question.answers.map(({ answer }) => (answer));

                    io.to(socket.roomName).emit('getQuestion', { description: question.description, answers }, { tablescore: game.tablescore });
                }
            } else {
                game.tablescore = game.tablescore.sort((a, b) => (a.scores > b.scores) ? -1 : ((b.scores > a.scores) ? 1 : 0));
                socket.emit('gameOver', { tablescore: game.tablescore });
            }

        } catch (e) {
            console.log(e);
        }
    });

    socket.on('disconnect', async () => {
        try {
            if (!socket.doubleSession) {
                const game = await games.getGame(socket.roomName);

                if (!game) {
                    return;
                }

                const index = game.players.findIndex(player => player.equals(socket.user));

                if (index !== -1) {
                    game.players.splice(index, 1);
                }

                setTimeout(function () {
                    const index = game.players.findIndex(player => player.equals(socket.user));

                    if (index === -1) {
                        if (socket.user.equals(game.host)) {
                            socket.broadcast.to(socket.roomName).emit('hostDisconnect');
                            games.deleteGame(socket.roomName);
                        } else {

                            if (game.gameStarted && game.playersAnswered.length >= game.players.length) {
                                game.playersAnswered = [];
                                game.remainingQuestions.splice(0, 1);
                                io.to(socket.roomName).emit('getResult', { tablescore: game.tablescore });

                                setTimeout(function () {
                                    io.to(socket.roomName).emit('questionOver');
                                }, 10000);
                            }

                            io.to(socket.roomName).emit('playersNumber', {
                                players: game.players.length,
                                maxPlayers: game.maxPlayers
                            });
                        }
                    }
                }, 1000);
            }
        } catch (e) {
            console.log(e);
        }
    });
});


server.listen(port, () => {
    console.log('Server is up!');
});