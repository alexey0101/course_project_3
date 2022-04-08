const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            const usernameRegex = /^(?=.{5,15}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;

            return usernameRegex.test(value);
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 5,
        trim: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    },
    quizzes: [{
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Quiz'
        }
    }]
}, {
    timestamps: true
});


userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    delete userObject.quizzes;

    return userObject;
};

userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ username });

    if (!user) {
        throw new Error('Unable to log in!');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to log in!');
    }

    return user;

};

userSchema.methods.generateAuthToken = async function (params) {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, 'thisissecret', { expiresIn: '7 days' });

    user.tokens.push({ token });
    await user.save();

    return token;
};

userSchema.pre('save', async function (next) {
    const user = this;
    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;