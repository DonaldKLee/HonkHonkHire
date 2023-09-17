const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const authRoute = require("./routes/auth");
const audioRoute = require("./routes/audio");
const quizRoute = require("./routes/quiz");
const Users = require("./models/Users");
const { isAuthorized } = require("./config/authCheck");
require("dotenv").config();

//MIDDLEWARES
app.use(express.static(__dirname + "/public"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
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
mongoose.set("strictQuery", true);
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.log(err));

//ROUTES
app.use("/auth", authRoute);
app.use("/audio", audioRoute);
app.use("/quiz", quizRoute);

// ROOT
app.get("/", (req, res) => {
	res.render("landingPage");
});

app.get("/onboarding",  isAuthorized, (req, res) => {
	Users.findOne({ email: req.session.user.email })
		.then((user) => {
			res.render("onboardingPage", { user: user });
		})
		.catch((err) => console.log(err));
});

app.get("/newInterview",  isAuthorized, (req, res) => {
	Users.findOne({ email: req.session.user.email })
		.then((user) => {
			res.render("newIntervewPage", { user: user });
		})
		.catch((err) => console.log(err));
});

app.get("/interview",  isAuthorized, (req, res) => {
	Users.findOne({ email: req.session.user.email })
	.then(user => {
		res.render("interview", {user});
		user.lastCompletedQuestion += 1;
		user.save();
	})
	.catch(err => console.log(err));
});

app.get("/finished", isAuthorized, (req, res) => {
	res.render("finishedPage");
})

app.get("/dashboard",  isAuthorized, (req, res) => {
	Users.findOne({ email: req.session.user.email })
	.then((user) => {
		// console.log(user["name"]);
		res.render("dashboardPage", { name: user["name"] });
	})
	.catch((err) => console.log(err));
});

app.get("/finished",  isAuthorized,(req, res) => {
	res.render("finishedPage.ejs");
});

app.get("/interviewSummary",  isAuthorized,(req, res) => {
	res.render("interviewSummary.ejs");
});

app.get("/audio",  isAuthorized, (req, res) => {
	const audioUrl = req.query.a;
	console.log(audioUrl);
	res.json({
		success: true,
	});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server successfully running on port ${PORT}`);
});
