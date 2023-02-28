var db = require('../config/connection')
var collection = require('../config/collection')
var { ObjectID, ObjectId } = require('mongodb')
const bcrypt = require('bcrypt');
const { get, response } = require('../app');


module.exports = {
    getRooms: (data) => {
        let destination = data.destination
        let roomCount = data.roomCount
        return new Promise(async (resolve, reject) => {
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find({ $and: [{ "Place": destination }, { "roomCount": { $gt: roomCount } }] }).toArray()
            resolve(rooms)
        })
    },
    getRoomData: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id)
            let room = await db.get().collection(collection.ROOM_COLLECTION).findOne({ "_id": ObjectId(id) });
            resolve(room)
        })
    },
    DoSignup: (data) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            let User = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ "email": data.email });
            if (user) {
                //user already exists
                User.err = "User email already exists"
                resolve(User)
            } else {
                user = await db.get().collection(collection.USER_COLLECTION).insertOne(data);
                User.id = user.InsertedId
                User.user = data
                resolve(User)
            }
        })
    },
    DoLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ "email": data.email });
            if (user) {
                bcrypt.compare(data.password, user.password).then((status) => {
                    if (status) {
                        //password correct
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        //incorrect password
                        response.status = false;
                        response.incorrectPass = true
                        resolve(response)
                    }
                })
            } else {
                // if no user
                let status = false;
                resolve(status)
            }
        })
    },
    checkUser: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: data.email });
            if (user) {
                response.status = true
                response.user = user
                resolve(response)
            } else {
                response.status = false
                resolve(response)
            }
        })
    },
    saveOTP: (data) => {
        console.log(data)
        return new Promise(async (resolve, reject) => {
            // check if we already have otp to a email
            let haveOtp = await db.get().collection(collection.USER_OTP_REQUEST).findOne({ email: data.email })
            if (haveOtp) {
                await db.get().collection(collection.USER_OTP_REQUEST).updateOne({ email: data.email }, { $set: { "OTP": data.OTP, "Time": data.startTime, "ExpireTime": data.ExpireTime } })
            } else {
                await db.get().collection(collection.USER_OTP_REQUEST).insertOne(data)
            }

        })
    },
    verifyOTP: (data) => {
        let TimeNow = Date.now()
        return new Promise(async (resolve, reject) => {
            let response = {}
            let getData = await db.get().collection(collection.USER_OTP_REQUEST).findOne({ email: data.email })
            if (TimeNow < getData.ExpireTime) {
                if (data.otp == getData.OTP) {
                    // await db.get().collection(collection.USER_OTP_REQUEST).deleteOne({ email: data.email })
                    response.status = true
                    resolve(response)
                } else {
                    response.status = false
                    response.OTPerr = true
                    resolve(response)
                }
            } else {
                response.status = false
                response.timeOut = true
                resolve(response)
            }

        })
    },
    resetPassword: (data) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            await db.get().collection(collection.USER_COLLECTION).updateOne({ email: data.email }, { $set: { "password": data.password } }).then((response) => {
                resolve(response)
            })
        })
    },
    storeBookingSearch: (booking) => {
        return new Promise(async (resolve, reject) => {
            let userRoomSearch = await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION).insertOne(booking)
            resolve()
        })
    },
    RoomSearch: (userData) => {
        return new Promise(async (resolve, reject) => {
            let email = userData.email;
            let UserSearch = await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION).find({ "email": email }).sort({ "SearchDate": -1 }).toArray()
            SearchedData = UserSearch[0]
            console.log("Data Searched ", SearchedData)
            resolve(SearchedData)
        })
    },
    GetBookingRoom: (id) => {
        return new Promise(async (resolve, reject) => {
            let room = await db.get().collection(collection.ROOM_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(room)
        })
    },
    saveBookingDeatails: (details) => {
        return new Promise(async (resolve, reject) => {
            const ID = details._id;
            let BookDetails = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ID })
            console.log("tetetereeteteter")
            console.log(BookDetails)
            if (BookDetails) {
                resolve()
            } else {
                console.log("Details:insert to userBooking to Confirm: ", details)
                await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).insertOne(details).then((response) => {
                    // console.log("tretgregtrgbu", details)
                    console.log(response)
                    // console.log(collection.USER_BOOKING_TO_CONFIRM)
                })
                //var samplTest = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(details._id) })
                //console.log("Sample Test: ",samplTest)

                resolve()

            }
        })
    },
    ConfirmBookingDetails: (id, user) => {
        return new Promise(async (resolve, reject) => {
            console.log("Id : ", id)
            console.log("user", user)
            let ConfirmedBooking2 = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": id });
            console.log("Before Update :", ConfirmedBooking2);

            if (ConfirmedBooking2 == null) {
                await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).updateOne({ "_id": ObjectId(id) }, { $set: { Confirm: "Confirmed" } }).then((response) => {
                    console.log("Confirmed")
                    console.log(response);
    
                })
                let ConfirmedBooking = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id":ObjectId(id) });
                console.log("After Update: ",ConfirmedBooking);
                let ifConfirmedBooking = await db.get().collection(collection.USER_CONFIRMED_BOOKING).findOne({ "_id": ObjectId(id) }).then((bookingData) => {
                    console.log("Booking Details If already:",bookingData);
                    if (bookingData) {
                        let result = {
                            status: "Already confirmed, retry your hotel search if you would like to make another reservation."
                        }
                        console.log("Already Booked")
                        resolve(result)
                    } else {
                        console.log(ConfirmedBooking)
                        db.get().collection(collection.USER_CONFIRMED_BOOKING).insertOne(ConfirmedBooking).then((response) => {
                            console.log("fds",response)
                            let result = {}
                            resolve(result)
                        })
                    }
                })
            } else {
                await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).updateOne({ "_id": id }, { $set: { Confirm: "Confirmed" } }).then((response) => {
                    console.log("Confirmed")
                    console.log(response);

                })
                let ConfirmedBooking = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": id });
                console.log("After Update: ", ConfirmedBooking);
                let ifConfirmedBooking = await db.get().collection(collection.USER_CONFIRMED_BOOKING).findOne({ "_id": id }).then((bookingData) => {
                    console.log("Booking Details If already:", bookingData);
                    if (bookingData) {
                        let result = {
                            status: "Already confirmed, retry your hotel search if you would like to make another reservation."
                        }
                        console.log("Already Booked")
                        resolve(result)
                    } else {
                        console.log(ConfirmedBooking)
                        db.get().collection(collection.USER_CONFIRMED_BOOKING).insertOne(ConfirmedBooking).then((response) => {
                            console.log("fds", response)
                            let result = {}
                            resolve(result)
                        })
                    }
                })
            }


        })
    },
    sessionGetEditBookingDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": id })
            console.log(details)
            resolve(details)
        })
    },
    getEditBookingDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(id) })
            console.log(details)
            resolve(details)
        })
    },
    SaveEditedBookingRoom: (data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).updateOne({ "_id": ObjectId(data._id) }, {
                $set: {
                    "checkin": data.checkin,
                    "checkout": data.checkout,
                    "rooms": data.roomCount,
                    "roomCount": data.roomCount,
                    "guests": data.guests,
                    "dayCount": data.dayCount,
                    "totalQTY": data.totalQTY,
                    "TotalPrice": data.TotalPrice
                }
            }).then((response) => {
                // console.log(response)
                resolve()
            })
        })
    },
    getRoomBookingDetails: (email) => {
        return new Promise(async (resolve, reject) => {
            let bookingDetails = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).find({ "email": email }).sort({SearchDate: -1}).toArray()
            //console.log(bookingDetails);
            resolve(bookingDetails)
        })
    },
    getRoomClickedDetailsReverse: (email) => {
        return new Promise(async (resolve, reject) => {
            let bookingDetails = await db.get().collection(collection.USER_ROOM_CLICK).find({ "email": email }).sort({ SearchDate: -1 }).toArray()
            resolve(bookingDetails)
        })
    },
    getlatestSearch: (email) => {
        return new Promise(async (resolve, reject) => {
            let roomSearch = await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION).find({ "email": email }).sort({ SearchDate: -1 }).toArray();
            // console.log(roomSearch)
            console.log("laest search", roomSearch[0])
            var LatestRoomSearch = roomSearch[0];
            resolve(LatestRoomSearch)
        })
    },
    SaveUserClick: (data) => {
        return new Promise(async (resolve, reject) => {
            let userClick = await db.get().collection(collection.USER_ROOM_CLICK).findOne({ _id: ObjectId(data._id) })
            //console.log(userClick)
            if (userClick) {
                resolve()
            } else {
                console.log("No problems Here")
                console.log(data)
                await db.get().collection(collection.USER_ROOM_CLICK).insertOne(data)
                resolve()
            }
        })
    },
    getClickedSearchData: (ClickedId) => {
        return new Promise(async (resolve, reject) => {
            let ClickedSearchData = await db.get().collection(collection.USER_ROOM_CLICK).findOne({ "_id": ObjectId(ClickedId) })
            resolve(ClickedSearchData)
        })
    },
    GetLocation: () => {
        return new Promise(async (resolve, reject) => {
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find().toArray();
            resolve(rooms)
        })
    },
    GetNotLoggedUserSearchData: (UserId) => {
        return new Promise(async (resolve, reject) => {
            let roomSearch = await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION)
                .find({ "userId": UserId }).sort({ SearchDate: -1 }).toArray();
            roomSearch = roomSearch[0]
            console.log(roomSearch)
            resolve(roomSearch)
        })
    },
    UpdateSearchData: (data, id) => {
        return new Promise(async (resolve, reject) => {
            // if (data.email){

            await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION)
                .updateOne({ "_id": ObjectId(id) },
                    { $set: { "checkin": data.checkin, "checkout": data.checkout, "rooms": data.rooms, "roomCount": data.rooms, "dayCount": data.DayCount, "guests": data.guests } }).then((response) => {
                        if (response.acknowledged) {
                            console.log("Update succesful")
                        } else {
                            console.log("Update failed")
                        }
                        resolve()
                    })
            // }
        })
    },
    FindLatestSearchByUser: (SessionData) => {
        return new Promise(async (resolve, reject) => {
            // console.log("SessionData user in UserHeplers: ", SessionData.user);
            // console.log("SessionData RoomClick in UserHeplers: ", SessionData.RoomClick);

            var user = SessionData.user;

            var TimeAtRegisteredUserSearch;
            var TimeAtNotRegisteredUserSearch;

            var UserLoggedStatus;

            if (user.email) {
                // console.log("Email" , user.email);


                await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION).find({ "email": user.email }).sort({ "SearchDate": -1 }).toArray().then((response) => {
                    //console.log("Response",response[0])
                    BookingDetails = response[0]
                    // console.log("Data Searched in userHelpers ", BookingDetails.SearchDate)
                    TimeAtRegisteredUserSearch = BookingDetails.SearchDate;

                    if (SessionData.RoomClick) {
                        TimeAtNotRegisteredUserSearch = SessionData.RoomClick.SearchDate;
                        if (TimeAtRegisteredUserSearch > TimeAtNotRegisteredUserSearch) {
                            // console.log("Logged User data will Procced");
                            UserLoggedStatus = true;
                        } else {
                            // console.log("Sesion Data will Procced");
                            UserLoggedStatus = false;
                        }
                    } else {
                        // console.log("Logged User data will Procced no session");
                        UserLoggedStatus = true;
                    }
                    // console.log(TimeAtRegisteredUserSearch , " User SErch   Session SEarch ",TimeAtNotRegisteredUserSearch )

                })



            }
            resolve(UserLoggedStatus);
        })
    },
    getLatestDetailsForModidfy: (id) => {
        console.log("Id", id)
        return new Promise(async (resolve, reject) => {
            var LatestSearch = await db.get().collection(collection.USER_ROOM_CLICK).findOne({ "_id": ObjectId(id) });
            console.log("Latest search in userhears", LatestSearch)
            resolve(LatestSearch)
        })
    }
}