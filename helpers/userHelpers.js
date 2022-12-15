var db = require('../config/connection')
var collection = require('../config/collection')
var { ObjectID, ObjectId } = require('mongodb')
const bcrypt = require('bcrypt');
const { get } = require('../app');


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
            let BookDetails = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(details._id) })
            if (BookDetails) {
                resolve()
            } else {
                await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).insertOne(details).then(() => {
                    resolve()
                })
            }
        })
    },
    ConfirmBookingDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).updateOne({ "_id": ObjectId(id) }, { $set: { Confirm: "Confirmed" } }).then(() => {
                console.log("Confirmed")

            })
            let ConfirmedBooking = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(id) });
            console.log(ConfirmedBooking);
            let ifConfirmedBooking = await db.get().collection(collection.USER_CONFIRMED_BOOKING).findOne({ _id: ObjectId(id) }).then((bookingData)=>{
                if (bookingData) {
                    let result ={
                        status : "Already confirmed, retry your hotel search if you would like to make another reservation."
                    } 
                    console.log("Already Booked")
                    resolve(result)
                } else {
                     db.get().collection(collection.USER_CONFIRMED_BOOKING).insertOne(ConfirmedBooking).then(() => {
                        let result = {}
                        resolve(result)
                    })
                }
            })
            
        })
    },
    getEditBookingDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(id) })
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
            let bookingDetails = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).find({ "email": email }).toArray()
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
            let Search = await db.get().collection(collection.USER_ROOM_SEARCH_COLLECTION).find({ "email": email }).sort({ SearchDate: -1 }).toArray();
            console.log("laest search", Search) /// not in desanding order
            let latestSearch = Search[0]
            console.log("laest[0] search", Search)
            resolve(latestSearch)
        })
    },
    SaveUserClick: (data) => {
        return new Promise(async (resolve, reject) => {
            let userClick = await db.get().collection(collection.USER_ROOM_CLICK).findOne({ _id: ObjectId(data._id) })
            if (userClick) {
                resolve()
            } else {
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
    }
}