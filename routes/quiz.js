const router = require('express').Router();

router.get('/uploadResume', (req, res) => {
    const resumePath = encodeURI(req.query.r);
    console.log(resumePath);
})

module.exports = router;