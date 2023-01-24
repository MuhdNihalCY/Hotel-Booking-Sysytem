var express = require('express');
const { response } = require('../app');
var router = express.Router();
var userHelpers = require('../helpers/userHelpers')
var mailer = require('../helpers/mailer');
const e = require('express');

// function for verify login
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}



/* GET users listing. */
router.get('/', function (req, res, next) {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();
  let dd2 = dd + 1
  // console.log(dd)
  // console.log(dd2)

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  // const formattedToday = dd + '/' + mm + '/' + yyyy;
  const formatedToday = yyyy + '-' + mm + '-' + dd;
  const formatedTomorow = yyyy + '-' + mm + '-' + dd2;
  // console.log(formatedTomorow)


  var user = req.session.user
  var locations = []
  var Place = []
  userHelpers.GetLocation().then((rooms) => {
    // console.log(rooms)
    // console.log(rooms.length)
    for (var i = 0; i < rooms.length; i++) {

      if (!Place.includes(rooms[i].Place)) {
        Place.push(rooms[i].Place)
        var loca = {
          Place: rooms[i].Place
        }
        locations.push(loca)
      }


      //  console.log(rooms[i].Place)

    }

    //console.log(locations)
    
    var noHeader = true;

    if (user) {
      userHelpers.getRoomClickedDetailsReverse(user.email).then((bookingDetails) => {
        res.render('users/home1', { user, formatedToday, formatedTomorow, bookingDetails, locations,noHeader })
      })
    } else {
      res.render('users/home1', { formatedToday, formatedTomorow, locations,noHeader })
    }
  })


});




router.post('/checkAvailability', verifyLogin, (req, res) => {
  var user = req.session.user
  if (user) {
    const checkinDt = new Date(req.body.checkin)
    var date = checkinDt;
    const checkoutDt = new Date(req.body.checkout)
    var DayCount = parseInt((checkoutDt - checkinDt) / (24 * 3600 * 1000))

    console.log("day count ", DayCount)
    console.log(req.body)



    let booking = {}

    let Dates = []

    for (i = 0;i<DayCount ; i++){
      
    }



    booking = req.body;
    booking.roomCount = req.body.rooms
    booking.dayCount = DayCount
    booking.email = user.email
    booking.number = user.number
    booking.name = user.name
    booking.SearchDate = Date.now()
    userHelpers.storeBookingSearch(booking).then(() => {
      userHelpers.getRooms(booking).then((rooms) => {
        res.render('users/rooms', { rooms, user })
      })
    })
  } else {
    res.redirect('/login')
  }

})
router.get('/login', (req, res) => {
  res.render('users/userLogin')
})
router.post('/login', (req, res) => {
  userHelpers.DoLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      res.redirect('/')
    } else if (response.incorrectPass) {
      var errorMsg = "Invalid password"
      res.render('users/userLogin', { errorMsg })
    } else {
      var errorMsg = "Invalid Email"
      res.render('users/userLogin', { errorMsg })
    }
  })
})
router.get('/signup', (req, res) => {
  res.render('users/userSignup')
})
router.post('/signup', (req, res) => {
  userHelpers.DoSignup(req.body).then((response) => {
    if (response.err) {
      var errorMsg = response.err
      res.render('users/userSignup', { errorMsg })
    } else {
      req.session.user = response.user
      res.render('users/home')
    }
  })
})
router.get('/forgottenPassword', (req, res) => {
  res.render('users/forgottenPassword')
})
router.post('/forgottenPassword', (req, res) => {
  userHelpers.checkUser(req.body).then((response) => {
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
      userHelpers.saveOTP(requestOtp)
      res.render('users/Enterotp', { email })
    } else {
      let state = "Email doesn't exist"
      res.render('users/forgottenPassword', { state })
    }
  })
})
router.post('/verifyotp', (req, res) => {
  userHelpers.verifyOTP(req.body).then((response) => {
    if (response.status) {
      let email = req.body.email
      res.render('users/resetPassword', { email })
    } else if (response.OTPerr) {
      let email = req.body.email
      let state = "Wrong OTP Entered"
      res.render('users/Enterotp', { email, state })
    } else if (response.timeOut) {
      let state = "OTP Expired"
      res.render('users/forgottenPassword', { state })
    }
  })
})
router.post('/resetPassword', (req, res) => {
  userHelpers.resetPassword(req.body).then((response) => {
    console.log("reset password")
    res.redirect('/login')
  })
})

router.get('/viewRoomDetails/:id', verifyLogin, (req, res) => {
  var user = req.session.user
  let id = req.params.id;
  console.log(req.body)
  userHelpers.getlatestSearch(user.email).then((latestSearch) => {
    console.log("latestSearch: ", latestSearch)
    userHelpers.getRoomData(id).then((room) => {
      latestSearch.roomId = room._id;
      latestSearch.roomName = room.name;
      latestSearch.roomPlace = room.Place;
      latestSearch.roomImg = room.img1;
      userHelpers.SaveUserClick(latestSearch).then(() => {
        res.render('users/RoomView', { room, user })
      })
    })
  })
})

router.get('/viewClickedRoomDetails/:id', verifyLogin, (req, res) => {
  var user = req.session.user;
  var ClickedId = req.params.id;
  userHelpers.getClickedSearchData(ClickedId).then((ClickedRoom) => {
    var roomId = ClickedRoom.roomId;
    userHelpers.getRoomData(roomId).then((room) => {
      res.render('users/RoomView', { room, user, ClickedId })
    })
  })
})
router.get('/bookNow/:id', verifyLogin, (req, res) => {
  let id = req.params.id;
  var user = req.session.user;
  let room
  userHelpers.GetBookingRoom(id).then((response) => {
    room = response
    //console.log("room:", room)
    userHelpers.RoomSearch(user).then((bookingDetails) => {
      let TotalQTY = bookingDetails.roomCount * bookingDetails.dayCount;
      let TotalPrice = TotalQTY * room.OfferPrice;
      bookingDetails.roomId = id;
      bookingDetails.roomName = room.name;
      bookingDetails.roomType = room.TyprOfRoom;
      bookingDetails.roomPlace = room.Place;
      bookingDetails.roomImg = room.img1;
      bookingDetails.roomContact = room.contact;
      bookingDetails.roomPrice = room.OfferPrice;
      bookingDetails.totalQTY = TotalQTY;
      bookingDetails.TotalPrice = TotalPrice;
      bookingDetails.Confirm = false;
      bookingDetails.payment = false;
      // console.log(bookingDetails)
      userHelpers.saveBookingDeatails(bookingDetails).then(() => {
        var Id = bookingDetails._id;
        userHelpers.getEditBookingDetails(Id).then((details) => {
          bookingDetails = details;
          res.render('users/ConfirmBooking', { user, bookingDetails, room })
        })
      })
    })
  })
})
router.get('/bookNowClicked/:id/:clickedId', verifyLogin, (req, res) => {
  let id = req.params.id;
  var user = req.session.user;
  let ClickedId = req.params.clickedId;

  //console.log(id, "+++++", ClickedId)
  userHelpers.GetBookingRoom(id).then((response) => {
    let room = response
    userHelpers.getClickedSearchData(ClickedId).then((bookingDetails) => {
      let TotalQTY = bookingDetails.roomCount * bookingDetails.dayCount;
      let TotalPrice = TotalQTY * room.OfferPrice;
      bookingDetails.roomId = id;
      bookingDetails.roomName = room.name;
      bookingDetails.roomType = room.TyprOfRoom;
      bookingDetails.roomPlace = room.Place;
      bookingDetails.roomImg = room.img1;
      bookingDetails.roomContact = room.contact;
      bookingDetails.roomPrice = room.OfferPrice;
      bookingDetails.totalQTY = TotalQTY;
      bookingDetails.TotalPrice = TotalPrice;
      bookingDetails.Confirm = false;
      bookingDetails.payment = false;

      userHelpers.saveBookingDeatails(bookingDetails).then(() => {
        var Id = bookingDetails._id;
        userHelpers.getEditBookingDetails(Id).then((details) => {
          bookingDetails = details;
          res.render('users/ConfirmBooking', { user, bookingDetails, room })
        })
      })
    })
  })
  // want to find room details and clicked details and to complete the remaining
})
router.get('/confirmOrder/:id', verifyLogin, (req, res) => {
  var user = req.session.user;
  let id = req.params.id;
  console.log(id)
  userHelpers.ConfirmBookingDetails(id).then((result) => {
    console.log("Confirmation DOne")
    if(result.status){
      let results = result.status;
      res.render("users/bookingConfirmed", { user,results })
    }else{
      res.render("users/bookingConfirmed", { user })
    }
  })
})
router.get('/editBooking/:id', verifyLogin, (req, res) => {
  var user = req.session.user;
  let id = req.params.id;
  userHelpers.getEditBookingDetails(id).then((bookingDetails) => {
    let roomId = bookingDetails.roomId;
    userHelpers.GetBookingRoom(roomId).then((room) => {
      res.render('users/editRoomDetails', { user, bookingDetails, room });
    })
  })
})
router.post('/saveEditedBookingDetails', (req, res) => {
  //console.log('save Edited')
  console.log(req.body)
  const checkinDt = new Date(req.body.checkin)
  const checkoutDt = new Date(req.body.checkout)
  var DayCount = parseInt((checkoutDt - checkinDt) / (24 * 3600 * 1000))
  req.body.dayCount = DayCount
  req.body.totalQTY = req.body.roomCount * DayCount
  req.body.TotalPrice = req.body.totalQTY * req.body.price

  userHelpers.SaveEditedBookingRoom(req.body).then(() => {
    //console.log('edited')
    roomId = req.body.roomId;
    res.redirect('/bookNow/' + roomId)
  })
})
router.get('/myBookings', verifyLogin, (req, res) => {
  var user = req.session.user;
  userHelpers.getRoomBookingDetails(user.email).then((bookingDetails) => {
    res.render('users/MyBookings', { user, bookingDetails })
  })
})

router.get('/sample', (req, res) => {
  var user = req.session.user; //sample checking purpose
  res.render("users/editRoomDetails", { user })
})



module.exports = router;
