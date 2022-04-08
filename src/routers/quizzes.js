const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const Quiz = require('../models/quiz');
const auth = require('../middleware/auth');
const games = require('../utils/games');
const router = new express.Router();

router.post('/api/quiz/create', auth, async (req, res) => {
    try {
        const user = req.user;

        req.body.creator = user;

        const quiz = new Quiz(req.body);

        await quiz.save();

        user.quizzes.push({ quiz: quiz._id });

        await user.save();

        res.send({ response: 'Quiz was created!' });
    } catch (e) {
        console.log(e);
        res.status(400).send({ error: e.message });
    }
});

router.post('/api/quiz/add', auth, async (req, res) => {
    try {
        const user = req.user;

        if (req.body.quiz) {
            if (!user.quizzes.some(quiz => quiz.quiz.equals(req.body.quiz))) {
                user.quizzes.push({quiz : req.body.quiz });
                await user.save();
            } else {
                throw new Error('Quiz was already added!');
            }
        } else {
            throw new Error('There is no quiz id in request!');
        }

        res.send();

    } catch (e) {
        res.status(500).send('Server error!');
    }
});

router.delete('/api/quiz/delete', auth, async (req, res) => {
    try {
        const user = req.user;

        if (!req.body.quiz) {
            throw new Error('There is no quiz id in body!');
        }

        const quiz = await Quiz.findById(req.body.quiz);
        if (quiz.creator.equals(user._id)) {
            user.quizzes.splice(user.quizzes.findIndex(quiz => quiz.equals(req.body.quiz)), 1);
            await Quiz.deleteOne({ quiz: quiz._id });
        } else {
            user.quizzes.splice(user.quizzes.findIndex(quiz => quiz.equals(req.body.quiz)), 1);
        }

        await user.save();

        res.send();

    } catch (e) {
        console.log(e);
        res.status(400).send();
    }
});

router.get('/api/quiz/getAll', auth, async (req, res) => {
    try {
        let name = req.query.name;

        if (!name) {
            name = '';
        }

        const quizzes = await Quiz.find({ name: { $regex: name }, access: 'Public' });
        const arr = quizzes.map(({ _id, name, creator, access, questions }) => ({
            _id,
            name,
            themes: questions.map(question => question.theme)
        }));

        res.send(arr);

    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;