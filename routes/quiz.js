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
const { getDownloadURL } = require('firebase/storage');
const {isAuthorized} = require('../config/authCheck');

router.get('/uploadResume', isAuthorized, async (req, res) => {
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
                    console.log("OnBoarded");
                    res.json({
                        success: true,
                    });
                });
            })
        });
})

router.get('/newInterview', isAuthorized, async (req, res) => {
    const numberOfQuestions = req.query.q;

    Users.findOne({email: req.session.user.email})
        .then(async (user) => {
            user.numberOfQuestions = numberOfQuestions;
            let resumeText = user.resumeText;
            let context = user.context;

            // const cohere = require('cohere-ai');
            // cohere.init(process.env.COHERE_KEY); // This is your trial API key
            // (async () => {
            // const response = await cohere.generate({
            //     model: 'command',
            //     prompt: `Generate a list of ${numberOfQuestions} interview questions based on this resume and the context and provide the output in the following JSON format:\n{\n    \"questions\":[\n            {\n                 \"question\": "<question-goes here>"\n            }\n      ]\n}\n\nHere is some context: ${context}\nHere is my resume:\n${resumeText}`,
            //     max_tokens: 740,
            //     temperature: 1.2,
            //     k: 0,
            //     stop_sequences: [],
            //     return_likelihoods: 'NONE'
            // });

            Users.findOne({email: req.session.user.email})
            .then(async (user) => {
                // console.log(user);
                user.questions = {
                    "questions": [
                        {
                            "question": "What are your technical strengths and how did you apply them in your projects?"
                        },
                        {
                            "question": "Can you describe the QR code app you made for nwPlus?"
                        },
                        {
                            "question": "How do you keep yourself up-to-date with the latest technologies and what are your favorite resources for this?"
                        }
                    ]
                }
                user.save()
                .then(() => {
                    console.log("Questions saved!");

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
                    const audioPaths = [];

                    // async function quickStart(text, index) {
                    //     // Construct the request
                    //     const request = {
                    //       input: {text: text},
                    //       // Select the language and SSML voice gender (optional)
                    //       voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
                    //       // select the type of audio encoding
                    //       audioConfig: {audioEncoding: 'MP3'},
                    //     };
                      
                    //     // Performs the text-to-speech request
                    //     const [response] = await ttsclient.synthesizeSpeech(request);
                    //     // Write the binary audio content to a local file
                    //     const writeFile = util.promisify(fs.writeFile);
                    //     await writeFile(`audios/output-${index}.mp3`, response.audioContent, 'binary');

                    //     uploadFile(index)
                    //     .catch(console.error);
                    // }

                   async function getDownloadURL() {
                        const filePath = audioPaths[0]; // Replace with the actual file path
                        const fileName = `${new Date}-${audioPaths[0]}`;
    
                        await bucket.upload(filePath, {
                            destination: fileName,
                            metadata: {
                                contentType: 'file/mp3' // Adjust content type as needed
                            }
                        }); 
    
                        // Generate a download URL for the uploaded file
                        bucket.file(fileName).getSignedUrl({
                            action: 'read',
                            expires: '03-09-2030' // Set an expiration date for the URL
                        }).then(async (downloadUrl) => {
                            console.log('Download URL:', downloadUrl[0]);
                            audios.push(downloadUrl[0]);
                            const filePath = audioPaths[1]; // Replace with the actual file path
                            const fileName = `${new Date}-${audioPaths[1]}`;
        
                            await bucket.upload(filePath, {
                                destination: fileName,
                                metadata: {
                                    contentType: 'file/mp3' // Adjust content type as needed
                                }
                            }); 
        
                            // Generate a download URL for the uploaded file
                            bucket.file(fileName).getSignedUrl({
                                action: 'read',
                                expires: '03-09-2030' // Set an expiration date for the URL
                            }).then(async (downloadUrl) => {
                                console.log('Download URL:', downloadUrl[0]);
                                audios.push(downloadUrl[0]);
                                const filePath = audioPaths[2]; // Replace with the actual file path
                                const fileName = `${new Date}-${audioPaths[2]}`;
            
                                await bucket.upload(filePath, {
                                    destination: fileName,
                                    metadata: {
                                        contentType: 'file/mp3' // Adjust content type as needed
                                    }
                                }); 
            
                                // Generate a download URL for the uploaded file
                                bucket.file(fileName).getSignedUrl({
                                    action: 'read',
                                    expires: '03-09-2030' // Set an expiration date for the URL
                                }).then(async (downloadUrl) => {
                                    console.log('Download URL:', downloadUrl[0]);
                                    audios.push(downloadUrl[0]);
                                    user.audios = audios;
                                    user.save()
                                    .then(() => {
                                        res.json({
                                            success: true,
                                        });
                                    })
                                    .catch(err => console.log(err));
                                })
                            })
                        })
                    }
    
                        

                    user.questions.questions.forEach(async (question, index) => {
                    // Construct the request
                    const request = {
                        input: {text: question.question},
                        // Select the language and SSML voice gender (optional)
                        voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
                        // select the type of audio encoding
                        audioConfig: {audioEncoding: 'MP3'},
                        };
                    
                        // Performs the text-to-speech request
                        const [response] = await ttsclient.synthesizeSpeech(request);
                        // Write the binary audio content to a local file
                        const writeFile = util.promisify(fs.writeFile);
                        await writeFile(`audios/output-${index}.mp3`, response.audioContent, 'binary');
                        audioPaths.push(`audios/output-${index}.mp3`);
                        if (audioPaths.length == user.questions.questions.length) {
                            audioPaths.sort();
                            getDownloadURL();
                        }
                    });
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
            });
});


router.get('/detectFace',  isAuthorized, async (req, res) => {
    const fileUrl = req.query.f;
    const [result] = await client.faceDetection(`${fileUrl}`);
    const faces = result.faceAnnotations;
    console.log('Faces:');
        console.log(faces[0])
        if (faces[0].joyLikelihood === 'VERY_LIKELY' || faces[0].joyLikelihood === 'LIKELY' || faces[0].joyLikelihood === 'POSSIBLE') {
            res.json({
                success: true,
                emotion: "Joy"
            });
        } else if (faces[0].angerLikelihood === 'VERY_LIKELY' || faces[0].angerLikelihood === 'LIKELY' || faces[0].angerLikelihood === 'POSSIBLE') {
            res.json({
                success: true,
                emotion: "Anger"
            });
        } else if (faces[0].sorrowLikelihood === 'VERY_LIKELY' || faces[0].sorrowLikelihood === 'LIKELY' || faces[0].sorrowLikelihood === 'POSSIBLE') {
            res.json({
                success: true,
                emotion: "Sorrow"
            });
        } else if (faces[0].surpriseLikelihood === 'VERY_LIKELY' || faces[0].surpriseLikelihood === 'LIKELY' || faces[0].surpriseLikelihood === 'POSSIBLE') {
            res.json({
                success: true,
                emotion: "Surprise"
            });
        } else {
            res.json({
                success: true,
                emotion: "Joy"
            });
        };
})

module.exports = router;