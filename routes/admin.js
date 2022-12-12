var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let admin = true
  res.render('admin/home',{admin});
}); 

module.exports = router;
