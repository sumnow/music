var express = require('express');
var router = express.Router();
const path = require('path');
const media = path.join(__dirname, '../public/media')

/* GET home page. */
router.get('/', function(req, res, next) {
  const fs = require('fs');
   fs.readdir(media, (err, name) => {
     if(err) {
       console.log(err)
     }else {
       console.log(1)
       res.render('index', { title: 'Music player', music : name });
     }
   })
});

module.exports = router;
