const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    access: {
        type: String,
        enum: ['Public', 'Private']
    },
    questions: [{
        cost: {
            type: Number,
            required: true
        },
        theme: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        answers: [{
            answer: {
                type: String,
                required: true
            },
            correct: {
                type: Boolean,
                required: false
            }
        }],
        image: {
            type: Buffer
        },
        music: {
            type: Buffer
        },
        /*validate(value) {
            let flag = value.cost && value.theme && value.description && value.answers;
            flag = flag && typeof(cost) === Number;
            console.log(flag);
            return flag && value.answers.length === 4 && value.answers.filter(answer => !answer.correct).length === 3;
        }*/
    }]
});

quizSchema.pre('save', async function (next) {
    const quiz = this;


    if (!quiz.questions) {
        return next(new Error('There is no questions for quiz!'));
    }

    quiz.questions.forEach(question => {
        if (question.answers.length !== 4 || question.answers.filter(answer => !answer.correct).length !== 3) {
            return next(new Error('There must be 4 answers with 1 correct option!'));
        }
    });

    next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;