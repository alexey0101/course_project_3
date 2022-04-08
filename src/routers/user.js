const express = require('express');
const User = require('../models/user');
const Quiz = require('../models/quiz');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/api/users', async (req, res) => {

    try {
        const user = new User(req.body);
        await user.save();
        //res.status(201).send({ user, token });
        res.status(201).send({ user });
    } catch (e) {
        if (e.code === 11000) {
            res.status(409).send({error: 'Пользователь с таким именем уже существует!'});
        } else {
            res.status(400).send({error: e._message });
        }
    }
});


router.post('/api/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password);
        const token = await user.generateAuthToken();

        res.cookie('Authorization', token, { expires: new Date(Date.now() + 604800000), httpOnly: true });

        res.send({ user, token });
    } catch (error) {
        res.status(400).send();
    }
});

router.post('/api/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/api/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/api/users/quizzes', auth, async (req, res) => {
    try {
        const user = req.user;
        
        const quizzes = await Quiz.find().where('_id').in(user.quizzes.map(obj => obj.quiz)).exec();

        res.send(quizzes.map(({name, _id, questions}) => ({name, _id, themes: questions.map(question => question.theme)})));
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.get('/api/users/getAuthToken', auth, async (req, res) => {
    res.send({ username: req.user.username, token: req.token });
});

module.exports = router;