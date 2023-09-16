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
    };
    const request = {
      audio: audio,
      config: config,
    };
  
    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log(`Transcription: ${transcription}`);
  }

  setTimeout(quickstart, 3000);
  res.json({success : true});
});

module.exports = router;