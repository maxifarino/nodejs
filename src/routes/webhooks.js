var express = require('express');
var router = express.Router();

const emailsController = require('../api/emails');

router.post('/emails/webhooks', function(req, res) {
  emailsController.trackEmail(req, res);
});

module.exports = router;