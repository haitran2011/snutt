import express = require('express');
var router = express.Router();

import apiRouter = require('./api/api');

//router.use('/api', apiRouter);

export = apiRouter;