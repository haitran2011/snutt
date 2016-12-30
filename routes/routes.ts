import express = require('express');
var router = express.Router();

import apiRouter = require('./api/api');
import initRouter = require('./init'); //FOR DEBUG ONLY, REMOVE THIS LINE BEFORE DEPLOY

router.use('/api', apiRouter);
router.use('/init', initRouter); //FOR DEBUG ONLY, REMOVE THIS LINE BEFORE DEPLOY

export = router;