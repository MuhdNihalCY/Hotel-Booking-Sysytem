const { json, response } = require('express');
var express = require('express');
var router = express.Router();
var adminHelpers = require('../helpers/adminHelpers');

const acc = ['mnihalcy@gmail.com', '111'];


const verifyLogin = (req, res, next) => {
  // console.log(req.session)
  var user = req.session.admin
  if (user) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}



/* GET home page. */
router.get('/',verifyLogin, function (req, res, next) {
  let admin = true
  adminHelpers.getRooms().then((Rooms) => { 
    // console.log(Rooms)
    // console.log(req.session.admin)
    res.render('admin/home', { admin, Rooms });
  })
});

router.post('/AcceptRoom', (req, res) => {
  // console.log(req.body);
  adminHelpers.AcceptRoom(req.body).then((response) => {
    res.json({ response })
  })
})

router.post('/BlockRoom', (req, res) => {
  adminHelpers.BlockRoom(req.body).then((response) => {
    res.json({ response })
  })
})

router.get('/login',(req,res)=>{
  res.render('admin/login');
})

router.post('/login',(req,res)=>{
  var email = req.body.email;
  var pass = req.body.pass;

  if(acc[0] === email && acc[1] === pass){
    req.session.admin = true
    res.redirect('/admin');
  }else{
    var Error  = "Invalid Inputs"
    res.render('admin/login',{Error})
  }
})

router.get('/logout',(req,res)=>{
  req.session.admin = false
  res.redirect('/admin')
})

module.exports = router;
