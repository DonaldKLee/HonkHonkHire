const router = require('express').Router();
const axios = require('axios');
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
const textToSpeech = require('@google-cloud/text-to-speech');
const ttsclient = new textToSpeech.TextToSpeechClient();
const fs = require('fs');
const util = require('util');
const firebase = require('firebase/app');
require('firebase/storage');
const Users = require('../models/Users');

router.get('/uploadResume', async (req, res) => {
    console.log("resume uploaded!");
    const resumePath = encodeURI(req.query.r);
    const ans0 = req.query.ans0;
    const ans1 = req.query.ans1;
    const ans2 = req.query.ans2;
    const ans3 = req.query.ans3;
    
    console.log(ans0, ans1, ans2, ans3, resumePath);

    axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env.OCR_API_KEY}&url=${resumePath}`)
        .then(async resp => {
            let resumeText = "";
            resp.data.ParsedResults.forEach(result => {
                resumeText += result.ParsedText;
            });

            let context = `I am working for the ${ans0} industry, am applying for a ${ans2} ${ans1} role. I am most interested in improving on: ${ans3}. No questions asked.`
            // console.log(context);

            // code works, put this for interview
            // const cohere = require('cohere-ai');
            // cohere.init(process.env.COHERE_KEY); // This is your trial API key
            // (async () => {
            // const response = await cohere.generate({
            //     model: 'command',
            //     prompt: `${resumeText}\n${context}\nGenerate a list of 5 interview questions based on this resume and the context and provide the output in the following JSON format:\n{\n    \"questions\":[\n            {\n                 \"question\": \""What are your technical strengths and how did you apply them in your projects?"\n            }\n      ]\n}`,
            //     max_tokens: 740,
            //     temperature: 0,
            //     k: 0,
            //     stop_sequences: [],
            //     return_likelihoods: 'NONE'
            // });
            // console.log(`Prediction: ${response.body.generations[0].text}`);

            Users.findOne({email: req.session.user.email})
            .then(async (user) => {
                // console.log(user);
                // user.questions = await JSON.parse(response.body.generations[0].text);
                user.onboarding = true;
                user.resumeText = resumeText;
                user.context = context;
                
                // user.prompt = `${resumeText}\n${context}\nGenerate a list of 5 interview questions based on this resume and the context and provide the output in the following JSON format:\n{\n    \"questions\":[\n            {\n                 \"question\": \""What are your technical strengths and how did you apply them in your projects?"\n            }\n      ]\n}`;

                user.save()
                .then((resp) => {
                    console.log("Questions saved!");
                    res.json({
                        success: true,
                    });

                    var admin = require("firebase-admin");

                    var serviceAccount = require("../firebase_creds.json");

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        storageBucket: 'gs://hackthenorth-ed2fa.appspot.com'
                    });


                    const firebaseConfig = {
                        apiKey: "AIzaSyBXA0ZXlNgdgZfKK4yjnmjuQpc78lBAiog",
                        authDomain: "hackthenorth-ed2fa.firebaseapp.com",
                        projectId: "hackthenorth-ed2fa",
                        storageBucket: "hackthenorth-ed2fa.appspot.com",
                        messagingSenderId: "95447128297",
                        appId: "1:95447128297:web:52a1e7256c70e82b9c7878",
                        measurementId: "G-K1TGR981FM"
                      };

                    firebase.initializeApp(firebaseConfig);

                    const storage = admin.storage();
                    const bucket = storage.bucket();

                    const audios = [];

                    async function uploadFile() {
                        const filePath = 'output.mp3'; // Replace with the actual file path
                        const fileName = `${new Date}-output.mp3`;
    
                        await bucket.upload(filePath, {
                            destination: fileName,
                            metadata: {
                                contentType: 'file/mp3' // Adjust content type as needed
                            }
                        }); 
    
                        // Generate a download URL for the uploaded file
                        const downloadUrl = await bucket.file(fileName).getSignedUrl({
                            action: 'read',
                            expires: '03-09-2030' // Set an expiration date for the URL
                        });
    
                        console.log('Download URL:', downloadUrl[0]);
                        audios.push(downloadUrl[0]);
                        if(audios.length == user.questions.questions.length) {
                            user.audios = audios;
                            user.save()
                            .then((resp) => {
                                console.log("Audios saved!");
                            })
                            .catch(err => console.log(err));
                        }
                    }
    

                    async function quickStart(text) {
                        // Construct the request
                        const request = {
                          input: {text: text},
                          // Select the language and SSML voice gender (optional)
                          voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
                          // select the type of audio encoding
                          audioConfig: {audioEncoding: 'MP3'},
                        };
                      
                        // Performs the text-to-speech request
                        const [response] = await ttsclient.synthesizeSpeech(request);
                        // Write the binary audio content to a local file
                        const writeFile = util.promisify(fs.writeFile);
                        await writeFile('output.mp3', response.audioContent, 'binary');

                        uploadFile()
                        .catch(console.error);
                    }

                    for(let i = 0; i < user.questions.questions.length; i++) {
                        quickStart(user.questions.questions[i].question);
                    }
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
            });
        });

router.get('/newInterview', async (req, res) => {
    const numberOfQuestions = req.query.q;
    console.log(numberOfQuestions);
    Users.findOne({email: req.session.user.email})
        .then(async (user) => {
            user.numberOfQuestions = numberOfQuestions;
            
            // get user resume and context

            // get cohere to ask questions

            user.save()
            .then((resp) => {
                console.log("Questions saved!");
                res.json({
                    success: true,
                });
            })
        })
})

router.get('/detectFace',async (req, res) => {
    const fileUrl = req.query.f;
    const [result] = await client.faceDetection(`${fileUrl}`);
    const faces = result.faceAnnotations;
    console.log('Faces:');
    faces.forEach((face, i) => {
        console.log(`  Face #${i + 1}:`);
        console.log(`    Joy: ${face.joyLikelihood}`);
        console.log(`    Anger: ${face.angerLikelihood}`);
        console.log(`    Sorrow: ${face.sorrowLikelihood}`);
        console.log(`    Surprise: ${face.surpriseLikelihood}`);
    });
})

module.exports = router;