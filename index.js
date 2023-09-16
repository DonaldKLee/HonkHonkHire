const express = require("express");
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const authRoute = require('./routes/auth');
const audioRoute = require('./routes/audio');
const quizRoute = require('./routes/quiz');
require('dotenv').config();
  
//MIDDLEWARES
app.use(express.static(__dirname + '/public'));
app.set('views', (__dirname + '/views'))
app.set('view engine', 'ejs');
app.use(cors());
app.use(
	session({
		secret: "yoyohoneysingh",
		cookie: {
			maxAge: 60000 * 60 * 24,
		},
		saveUninitialized: true,
		resave: false,
	})
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MONGODB CONNECTION
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI,{ 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err))

//ROUTES
app.use('/auth', authRoute);
app.use('/audio', audioRoute);
app.use('/quiz', quizRoute);

// ROOT
app.get("/", (req, res) => {
	res.render("index.ejs");
});

app.get("/landing", (req, res) => {
	res.render("landingPage.ejs");
});

app.get("/onboarding", (req, res) => {
	res.render("onboardingPage.ejs");
});

app.get("/interview", (req, res) => {
	res.render("interviewPage.ejs");
});

app.get('/audio', (req, res) => {
    const audioUrl = req.query.a;
    console.log(audioUrl);
    res.json({
        success: true
    })
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server successfully running on port ${PORT}`);
});
