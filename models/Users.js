const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
    },
    email : {
        type: String,
        required: true,
    },
    pfp: {
        type: String,
        required: true,
    },
    questions: {
        type: Object,
    },
    audios: {
        type: Array,
    },
    date: {
        type: Date,
        default: new Date,
    },
    onboarding: {
        type: Boolean,
        default: false,
    },
    prompt: {
        type: String,
        default: "",
    },
    numberOfQuestions: {
        type: Number,
        default: 3,
    },
    resumeText: {
        type: String,
        default: "",
    },
    context: {
        type: String,
        default: "",
    }
})

const Users = mongoose.model('Users', userSchema);

module.exports = Users