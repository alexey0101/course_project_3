const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const games = require('../utils/games');
const router = new express.Router();

router.get('', auth, (req, res) => {
    res.render('index');
});

router.get('/signin', (req, res) => {
    res.render('signin');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/quiz/create', auth, (req, res) => {
    res.render('quizEditor');
});

router.get('/quiz/all', auth, (req, res) => {
    res.render('quizzes');
});

router.get('/quiz/my', auth, (req, res) => {
    res.render('myQuizzes');
});

router.get('/games/:roomName', auth, async (req, res) => {
    try {
        res.render('lobby');
    } catch(e) {
        res.status(400).send({ error: e.message });
    }
});

module.exports = router;