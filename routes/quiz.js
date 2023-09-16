const fs = require('fs');
const pdf = require('pdf-parse');

const router = require('express').Router();

router.get('/uploadResume', async (req, res) => {
    const resumePath = encodeURI(req.query.r);
    const ans0 = req.query.ans0;
    const ans1 = req.query.ans1;
    const ans2 = req.query.ans2;
    const ans3 = req.query.ans3;
    
    console.log(ans0, ans1, ans2, ans3, resumePath);

    // try {
    //     // Read the PDF file using fs.readFileSync
    //     const dataBuffer = fs.readFileSync(resumePath);
    
    //     // Convert the data buffer to a Uint8Array
    //     const data = new Uint8Array(dataBuffer);
    
    //     // Parse the PDF content using pdf-parse
    //     const pdfData = await pdf(data);
    
    //     // Extracted text will be available in pdfData.text
    //     console.log(pdfData.text);
    //   } catch (error) {
    //     console.error('Error:', error);
    //   }


    // PLACE HOLDER - PRETEND WE HAVE THE DATA FOR NOW
    resumeText = "I AM A SOFTWARE ENGINEER, I WORKED AT FACEBOOK AND BUILT COOL THINGS USED BY MILLIONS OF PEOPLE.";
    const cohere = require('cohere-ai');
    cohere.init(process.env.COHERE_KEY); // This is your trial API key
    (async () => {
    const response = await cohere.generate({
        model: 'command',
        prompt: 'Generate me interview questions from my resume\n' + resumeText,
        max_tokens: 300,
        temperature: 0.9,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
    });
    console.log(`Prediction: ${response.body.generations[0].text}`);
    })();

    // console.log(__dirname);
    // res.sendFile(__dirname, "../views/interview.ejs");
})

module.exports = router;