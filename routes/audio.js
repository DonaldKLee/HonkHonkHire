const router = require('express').Router();
const multer = require('multer');
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();
const { Storage } = require('@google-cloud/storage');

// GOOGLE CLOUD STORAGE
const projectId = 'htn23-399207';
const bucketName = 'bucket-htn';

const storage = new Storage({
  projectId: projectId,
});

// MULTER SETUP
const multerStorage = multer.memoryStorage();
const upload = multer({ multerStorage });

router.post('/upload-audio', upload.single('audio'), async (req, res) => {
  const file = req.file.buffer;
  const fileName = encodeURI(`${new Date}-audio.wav`);

  const bucket = storage.bucket(bucketName);

  // Create a writable stream to upload the file content
  const bucketFile = bucket.file(fileName);
  const writableStream = bucketFile.createWriteStream();

  // Define your file content as a buffer
  const fileContentBuffer = Buffer.from(file, 'utf-8');

  // Handle events on the writable stream
  writableStream
    .on('error', (err) => {
      console.error('Error uploading file to GCS:', err);
    })
    .on('finish', () => {
      console.log(`File ${fileName} uploaded to GCS.`);
    });

  // Write the buffer to the GCS file
  writableStream.end(fileContentBuffer);

  async function quickstart() {
    // The path to the remote LINEAR16 file
    const gcsUri = `gs://${bucketName}/${fileName}`;

    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
      uri: gcsUri,
    };
    const config = {
      encoding: 'ENCODING_UNSPECIFIED',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      model: 'latest_long',
      enableWordConfidence: true,
      enableAutomaticPunctuation: true,
    };
    const request = {
      audio: audio,
      config: config,
    };
  
    const [response] = await client.recognize(request);
    const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
    const confidence = response.results[0].alternatives[0].confidence
    
    console.log(`Transcription: ${transcription} \n Confidence: ${confidence}`);
    
     // PLACE HOLDER - PRETEND WE HAVE THE DATA FOR NOW
     const cohere = require('cohere-ai');
     cohere.init(process.env.COHERE_KEY); // This is your trial API key
     (async () => {
     const response = await cohere.generate({
         model: 'command',
         prompt: `${transcription}\nSuggest improvements by adding/removing words in the transcribed text above. Do not change the sentence.`,
         max_tokens: 740,
         temperature: 1,
         k: 0,
         stop_sequences: [],
         return_likelihoods: 'NONE'
     });
        console.log(`Response: ${response.body.generations[0].text}`);

        function findExtraWords(string1, string2) {
            // Tokenize the strings into arrays of words
            const words1 = string1.trim().toLowerCase().split(/\s+/);
            const words2 = string2.trim().toLowerCase().split(/\s+/);
          
            // Create sets to store unique words from each string
            const wordSet1 = new Set(words1);
            const wordSet2 = new Set(words2);
          
            // Find extra words in string1 that are not in string2
            const extraWords1 = [...wordSet1].filter((word) => !wordSet2.has(word));
          
            // Find extra words in string2 that are not in string1
            const extraWords2 = [...wordSet2].filter((word) => !wordSet1.has(word));
          
            return {
              extraWordsInString1: extraWords1,
              extraWordsInString2: extraWords2,
            };
        }
        
        const result = findExtraWords(transcription, response.body.generations[0].text);
        console.log("Words to be removed:", result.extraWordsInString1);
        console.log("Words to be added:", result.extraWordsInString2);

        res.json({
            success : true,
            transcription : transcription,
            confidence : confidence,
            response : response.body.generations[0].text,
            extraWordsInString1 : result.extraWordsInString1,
            extraWordsInString2 : result.extraWordsInString2
        });
     })();
  }

  setTimeout(quickstart, 3000);
});

module.exports = router;