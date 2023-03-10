var express = require('express');
var router = express.Router();
var fileUpload = require('express-fileupload');
const mailer = require('../helpers/mailer');
var vendorHelper = require('../helpers/VendorHelpers')



// verify login
const verifyLogin = (req, res, next) => {
  if (req.session.vendorUserData) {
    next();
  } else {
    res.redirect('/vendor/login');
  }
}




// declaring variables
let vendor

/* GET home page. */
router.get('/', verifyLogin, function (req, res, next) {
  let user = req.session.vendorUserData
  vendor = true
  var BookedRooms = [];

  console.log(user)
  vendorHelper.getRooms(user).then((AllRooms) => {
    //console.log(AllRooms.length);

    const BookedRoomspromises = [];

    for (i = 0; i < AllRooms.length; i++) {
      var OneRoom = AllRooms[i];
      //console.log(OneRoom._id);

      BookedRoomspromises.push(vendorHelper.GetAllActionsRoom(OneRoom._id));
    }

    Promise.all(BookedRoomspromises).then((results) => {
      results.forEach((bookedRooms) => {
        //console.log("Rooms: ", bookedRooms);
        BookedRooms.push(...bookedRooms);

      })
      //console.log(BookedRooms);
      BookedRooms.sort((b,a)=> a.SearchDate - b.SearchDate);
      //console.log("Booked Rooms sorted : ",BookedRooms);
      
      vendorHelper.GetRoomsLeftforToday(user).then((RoomsInfo)=>{
        res.render('room/home', { vendor, user, AllRooms,BookedRooms, RoomsInfo });
      })

    })
  })

});

router.get('/addroom', verifyLogin, (req, res) => {
  let user = req.session.vendorUserData
  vendor = true
  res.render('room/addroom', { vendor, user })
})
router.post('/addroom', (req, res) => {
  let img1 = req.files.img1;
  let img2 = req.files.img2;
  let img3 = req.files.img3;
  console.log(req.files);
  console.log("))))))")
  console.log(req.files.img1);

  vendorHelper.addroom(req.body).then((id) => {
    img1.mv('./public/room-images/' + id + 1 + ".jpg", (err) => {
      if (!err) {
      } else {
        console.log("Error at img1 " + err)
      }
    })
    img2.mv('./public/room-images/' + id + 2 + ".jpg", (err) => {
      if (!err) {
      } else {
        console.log("Error at img2 " + err)
      }
    })
    img3.mv('./public/room-images/' + id + 3 + ".jpg", (err) => {
      if (!err) {
      } else {
        console.log("Error at img3 " + err)
      }
    })
  })
  res.redirect('/vendor/addroom')
})  //       viewrooms
router.get('/viewrooms', verifyLogin, (req, res) => {
  vendor = true
  // console.log("Calling View Rooms")
  let user = req.session.vendorUserData
  vendorHelper.getRooms(user).then((rooms) => {
    //console.log(rooms)
    let countofRooms = rooms.length;
    // console.log(countofRooms)

    // admin verification on rooms 
    for (let i = 0; i <= countofRooms; i++) {
      let verify = rooms.Verification
      if (verify === "false") {
        rooms.VerificationStatus = false;
      } else {
        rooms.VerificationStatus = true;
      }
    }

    res.render('room/viewrooms', { vendor, rooms, user })
    //  console.log("called View Rooms")
  })
});
router.get('/viewbookings', verifyLogin, (req, res) => {
  vendor = true
  let user = req.session.vendorUserData
  res.render('room/viewbookings', { vendor, user })
})
router.get('/DeleteRoom/:id',verifyLogin,(req,res)=>{
  vendorHelper.DeleteRoomVendor(req.params.id).then(()=>{
    res.redirect('/vendor/viewrooms');
  })
})




//auth
router.get('/login', (req, res) => {
  vendor = true
  let login = true
  res.render('room/VendorLogin', { vendor, login })
})
router.post('/login', (req, res) => {
  vendorHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.vendorLoggedIn = true
      req.session.vendorUserData = response.user
      res.redirect('/vendor')
    } else if (response === false) {
      //no user 
      vendor = true
      let login = true
      let status = "Email doesn't exist"
      res.render('room/VendorLogin', { vendor, login, status })
      console.log("No user Found")
    } else {
      //pasword incorrect
      vendor = true
      let login = true
      let status = "Password Incorrect"
      res.render('room/VendorLogin', { vendor, login, status })
      console.log("password Didn't match")
    }
  })
})
router.get('/signup', (req, res) => {
  vendor = true
  let login = true
  res.render('room/VendorSignup', { vendor, login })
})
router.post('/signup', (req, res) => {
  vendorHelper.doSignup(req.body).then((response) => {
    if (response) {
      //user logged in successfully
      req.session.vendorLoggedIn = true
      req.session.vendorUserData = response
      res.redirect('/vendor')
    } else {
      vendor = true
      let login = true
      let status = "Email already registered"
      res.render('room/VendorSignup', { vendor, login, status })
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/vendor')
})
router.get('/forgottenPassword', (req, res) => {
  vendor = true
  let login = true
  res.render('room/forgottenPassword', { vendor, login })
})
router.post('/forgottenPassword', (req, res) => {
  vendorHelper.checkUser(req.body).then((response) => {
    if (response.status) {
      var otp = Math.floor(100000 + Math.random() * 900000);
      console.log(otp)
      let email = req.body.email
      let requestOtp = {
        "email": req.body.email,
        "OTP": otp,
        "startTime": Date.now(),
        "ExpireTime": Date.now() + 900000
      }
      mailer.sendEmail(requestOtp)
      vendorHelper.saveOTP(requestOtp)
      vendor = true
      let login = true
      res.render('room/Enterotp', { email, vendor, login })
    } else {
      vendor = true
      let login = true
      let state = "Email doesn't exist"
      res.render('room/forgottenPassword', { vendor, login, state })
    }
  })
})
router.post('/verifyotp', (req, res) => {
  vendorHelper.verifyOTP(req.body).then((response) => {
    if (response.status) {
      let email = req.body.email
      vendor = true
      let login = true
      res.render('room/resetPassword', { email, vendor, login })
    } else if (response.OTPerr) {
      vendor = true
      let login = true
      let email = req.body.email
      let state = "Wrong OTP Entered"
      res.render('room/Enterotp', { email, vendor, login, state })
    } else if (response.timeOut) {
      vendor = true
      let login = true
      let state = "OTP Expired"
      res.render('room/forgottenPassword', { vendor, login, state })
    }
  })
})
router.post('/resetPassword', (req, res) => {
  vendorHelper.resetPassword(req.body).then((response) => {
    console.log("reset password")
    res.redirect("/vendor/login")
  })
})



module.exports = router;