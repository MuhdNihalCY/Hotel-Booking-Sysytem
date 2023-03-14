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
            let LiveBooking = false;

            let result = {}
            let ConfirmedBooking2 = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": id });
            console.log("Before Update :", ConfirmedBooking2);

            // create a new Date object
            let currentDate = new Date();

            // get the date in the format dd-mm-yyyy
            let day = currentDate.getDate();
            let month = currentDate.getMonth() + 1; // getMonth() returns 0-11 for the months, so add 1 to get the correct month
            let year = currentDate.getFullYear();

            let dateFormatted = `${day}-${month}-${year}`;

            // get the time in the format hh:mm pm/am
            let hours = currentDate.getHours();
            let minutes = currentDate.getMinutes();
            let amOrPm = hours >= 12 ? 'pm' : 'am';

            // convert hours from 24-hour format to 12-hour format
            if (hours > 12) {
                hours -= 12;
            }

            let timeFormatted = `${hours}:${minutes} ${amOrPm}`;

            // concatenate the date and time strings
            let dateTimeFormatted = `${dateFormatted} Time: ${timeFormatted}`;

            // console.log(dateTimeFormatted); // output example: "14-03-2023 Time: 10:23 am"


            if (ConfirmedBooking2 == null) {
                await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).updateOne({ "_id": ObjectId(id) }, { $set: { Confirm: "Confirmed", ConfirmedTime: Date.now(), "ConfirmedTimeFormatted": dateTimeFormatted } }).then((response) => {
                    console.log("Confirmed")
                    console.log(response);

                })
                let ConfirmedBooking = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).findOne({ "_id": ObjectId(id) });
                console.log("After Update: ", ConfirmedBooking);
                let ifConfirmedBooking = await db.get().collection(collection.USER_CONFIRMED_BOOKING).findOne({ "_id": ObjectId(id) }).then((bookingData) => {
                    console.log("Booking Details If already:", bookingData);
                    if (bookingData) {
                        result.status = "Already confirmed, retry your hotel search if you would like to make another reservation.";

                        console.log("Already Booked")

                    } else {
                        console.log(ConfirmedBooking)

                        ConfirmedBooking.ConfirmedTime = Date.now();
                        db.get().collection(collection.USER_CONFIRMED_BOOKING).insertOne(ConfirmedBooking).then((response) => {
                            console.log("fds", response)
                        })
                        LiveBooking = true;
                    }

                })
                console.log(LiveBooking);


                // create a data to insert to database to booked Room data.
                // this data is for new entry

                var checkIn = ConfirmedBooking.checkin;
                var checkOut = ConfirmedBooking.checkout;
                var RoomCount = parseInt(ConfirmedBooking.roomCount);
                const dayCount = ConfirmedBooking.dayCount;
                var RoomId = ConfirmedBooking.roomId;
                var BookedId = ConfirmedBooking._id;
                BookedId = BookedId.toString();

                var BookedData = []


                for (i = 0; i <= dayCount; i++) {
                    var BookDate = new Date(checkIn);
                    BookDate.setDate(BookDate.getDate() + i);
                    BookDate = BookDate.toISOString().substring(0, 10);


                    var Booking = {
                        date: BookDate,
                        RoomsBooked: [],
                        BookedIDs: []

                    }

                    for (j = 1; j <= RoomCount; j++) {
                        console.log("legnht: ", j.toString().length)
                        if (j.toString().length == 1) {
                            var RId = RoomId + '0' + j;
                        } else {
                            var RId = RoomId + j;
                        }
                        Booking.RoomsBooked.push(RId);
                    }

                    Booking.BookedIDs.push(BookedId);

                    BookedData.push(Booking);



                }
                console.log("Data Booked RO each room");
                console.log(BookedData);

                var BookedInformation = {
                    Room: ConfirmedBooking.roomId,
                    Booked: BookedData
                }




                if (LiveBooking) {
                    // add room to booked status Collection for count checking and takin report;
                    var RoomBookedData = await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).findOne({ "Room": ConfirmedBooking.roomId })
                    if (RoomBookedData) {
                        //update with adding the new entry
                        console.log("Update Required");
                        console.log("Old Data: ", RoomBookedData);
                        console.log("new Data: ", BookedInformation);


                        console.log("Old Data OGJ: ", RoomBookedData.Booked);
                        console.log("new Data OGL: ", BookedInformation.Booked);

                        var arr1 = RoomBookedData.Booked;
                        var arr2 = BookedInformation.Booked;


                        // BookedInformation =  RoomBookedData.Booked + BookedInformation.Booked

                        // Combine the two arrays
                        const combinedArr = [];

                        arr1.forEach(obj1 => {
                            const obj2 = arr2.find(obj2 => obj2.date === obj1.date);
                            if (obj2) {
                                combinedArr.push({
                                    date: obj1.date,
                                    RoomsBooked: [...obj1.RoomsBooked, ...obj2.RoomsBooked],
                                    BookedIDs: [...obj1.BookedIDs, ...obj2.BookedIDs]
                                });
                            } else {
                                combinedArr.push(obj1);
                            }
                        });

                        arr2.forEach(obj2 => {
                            const obj1 = arr1.find(obj1 => obj1.date === obj2.date);
                            if (!obj1) {
                                combinedArr.push(obj2);
                            }
                        });

                        console.log(combinedArr);



                        var finalBookedInfo = combinedArr
                        console.log("this is added data to update", finalBookedInfo)

                        await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).updateOne({ "Room": ConfirmedBooking.roomId }, { $set: { "Booked": finalBookedInfo } })

                    } else {
                        // insert a new Entry
                        await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).insertOne(BookedInformation).then((response) => {
                            console.log(response);
                        })
                    }
                }
                resolve(result)

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
            let bookingDetails = await db.get().collection(collection.USER_CONFIRMED_BOOKING).find({ "email": email }).sort({ SearchDate: -1 }).toArray()
            //console.log(bookingDetails);
            let CaneledBooking = await db.get().collection(collection.USER_Canceled_ROOMS).find({ "email": email }).sort({ SearchDate: -1 }).toArray()

            bookingDetails = bookingDetails.concat(CaneledBooking)

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
    },
    AddOTPStatusVerifyBooking: (OTP, Email) => {
        return new Promise(async (resolve, reject) => {
            var BookingDetails = await db.get().collection(collection.USER_BOOKING_TO_CONFIRM).find({ "email": Email }).sort({ "SearchDate": -1 }).toArray();
            BookingDetails = BookingDetails[0];
            var ID = BookingDetails._id;
            const now = Date.now(); // current timestamp in milliseconds
            const fiveMinutesLater = new Date(now + 5 * 60 * 1000); // timestamp 5 minutes later
            //console.log(fiveMinutesLater);
            var OTPsetDetails = {
                _id: ID,
                OTP: OTP,
                email: Email,
                ValidTill: fiveMinutesLater
            }

            console.log("New OTP", OTPsetDetails.OTP)

            var OLDOTP = await db.get().collection(collection.USER_OTP_REQUEST).findOne({ "_id": ID })

            if (OLDOTP) {
                await db.get().collection(collection.USER_OTP_REQUEST).updateOne({ "_id": ID }, {
                    $set: {
                        "OTP": OTPsetDetails.OTP,
                        "email": OTPsetDetails.email,
                        "ValidTill": OTPsetDetails.ValidTill
                    }
                }).then(() => {
                    resolve();
                })
            } else {
                await db.get().collection(collection.USER_OTP_REQUEST).insertOne(OTPsetDetails).then((response) => {
                    resolve()
                })
            }

        })
    },
    AddOTPStatus: (email, data) => {
        return new Promise(async (resolve, reject) => {
            var OTPStatus = {}


            var SavedOTP = await db.get().collection(collection.USER_OTP_REQUEST).find({ "email": email }).sort({ "ValidTill": -1 }).toArray();
            SavedOTP = SavedOTP[0];

            var timeToday = Date.now();

            console.log("savedOTP ", SavedOTP);
            console.log('Time Today ', timeToday)

            var savedTime = SavedOTP.ValidTill
            savedTime = savedTime.getTime();
            console.log(savedTime, "Saved Time")

            console.log("Saved OTP: ", SavedOTP.OTP, "Now OTP: ", parseInt(data.OTP));



            if (savedTime > timeToday) {
                if (SavedOTP.OTP == parseInt(data.OTP)) {
                    //procced
                    OTPStatus.status = true

                    resolve(OTPStatus)
                } else {
                    //wrong OTP
                    OTPStatus.error = "Wrong OTP"
                    resolve(OTPStatus)
                }
            } else {
                //TimeOut
                OTPStatus.error = "OTP Timeout"
                resolve(OTPStatus)
            }
        })
    },
    CheckIfRoomsAvailable: (Rooms, SearchData) => {
        return new Promise(async (resolve, reject) => {
            var RoomsNotAvailableRooms;
            var Rooms_ids = [];
            console.log(Rooms);
            console.log("Rooms_id : ", Rooms_ids);

            for (i = 1; i <= Rooms.length; i++) {
                var Rooms1 = Rooms[i - 1];
                Rooms_ids.push(Rooms1._id.toString());
            }

            console.log("Rooms_id : ", Rooms_ids);

            var ThisRoomBookedData = await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).find({ "Room": { $in: Rooms_ids } }).toArray();

            console.log("This Room Booked data", ThisRoomBookedData[0], "ends Here");
            console.log(SearchData);

            var availableRoom = [];

            for (j = 0; j < ThisRoomBookedData.length; j++) {
                var ThisRoom = ThisRoomBookedData[j]
                var RoomCount
                var RoomId
                //var selectedRoom

                // to find room count
                for (k = 0; k < Rooms_ids.length; k++) {
                    console.log(Rooms[k]._id.toString(), " = ", Rooms_ids[k]);
                    if (Rooms[k]._id.toString() == ThisRoom.Room) {
                        // selectedRoom = Rooms[i]
                        RoomCount = parseInt(Rooms[k].roomCount)
                        RoomId = Rooms[k]._id
                    }
                }

                var RoomBooked = ThisRoom.Booked;
                console.log(RoomBooked);

                // Define the check-in and check-out dates
                const checkIn = new Date(SearchData.checkin);
                const checkOut = new Date(SearchData.checkout);

                // Loop through each day between the check-in and check-out dates
                for (let day = new Date(checkIn); day <= checkOut; day.setDate(day.getDate() + 1)) {
                    console.log("each day: ", day.toISOString().slice(0, 10)); // Output the current date in yyyy-mm-dd format
                    var dayOne = day.toISOString().slice(0, 10)
                    for (l = 0; l < RoomBooked.length; l++) {
                        var OneBooked = RoomBooked[l];
                        if (OneBooked.date == dayOne) {
                            console.log(RoomCount, " - ", OneBooked.RoomsBooked.length, " < ", SearchData.roomCount)
                            if (RoomCount - OneBooked.RoomsBooked.length < SearchData.roomCount) {
                                //console.log(Rooms[k]);
                                RoomsNotAvailableRooms = Rooms.filter(item => item._id == RoomId)
                                Rooms = Rooms.filter(item => item._id !== RoomId)
                                console.log("This is the process of removing filled Rooms");
                            }
                        }
                    }
                }
            }
            console.log("No ROmm: ", RoomsNotAvailableRooms)

            var response = {
                Rooms: Rooms,
                RoomsNotAvailableRooms: RoomsNotAvailableRooms
            }

            resolve(response);
        })
    },
    CancelBooking: (id) => {
        return new Promise(async (resolve, reject) => {
            var BookedData
            await db.get().collection(collection.USER_CONFIRMED_BOOKING).findOne({ "_id": ObjectId(id) }).then((Data) => {
                BookedData = Data;
            })

            // create a new Date object
            let currentDate = new Date();

            // get the date in the format dd-mm-yyyy
            let day = currentDate.getDate();
            let month = currentDate.getMonth() + 1; // getMonth() returns 0-11 for the months, so add 1 to get the correct month
            let year = currentDate.getFullYear();

            let dateFormatted = `${day}-${month}-${year}`;

            // get the time in the format hh:mm pm/am
            let hours = currentDate.getHours();
            let minutes = currentDate.getMinutes();
            let amOrPm = hours >= 12 ? 'pm' : 'am';

            // convert hours from 24-hour format to 12-hour format
            if (hours > 12) {
                hours -= 12;
            }

            let timeFormatted = `${hours}:${minutes} ${amOrPm}`;

            // concatenate the date and time strings
            let dateTimeFormatted = `${dateFormatted} Time: ${timeFormatted}`;

            console.log(BookedData);
            BookedData.Confirm = false;
            BookedData.Canceled = true;
            BookedData.CanceledTime = Date.now();
            BookedData.CanceledTimeFormatted = dateTimeFormatted;

            await db.get().collection(collection.USER_CONFIRMED_BOOKING).deleteOne({ "_id": ObjectId(id) })

            await db.get().collection(collection.USER_Canceled_ROOMS).insertOne(BookedData).then(() => {
            })

            const roomId = BookedData.roomId; // the room ID
            const bookingId = BookedData._id.toString(); // the booking ID provided by user
            const checkin = BookedData.checkin; // the check-in date provided by user
            const checkout = BookedData.checkout; // the check-out date provided by user

            // find the room by ID
            const room = await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).findOne({ "Room": roomId });

            // loop through the bookings
            for (let i = 0; i < room.Booked.length; i++) {
                const booking = room.Booked[i];

                // check if the booking ID matches
                if (booking.BookedIDs.includes(bookingId)) {
                    // remove the booking ID
                    const index = booking.BookedIDs.indexOf(bookingId);
                    booking.BookedIDs.splice(index, 1);

                    // remove the rooms booked for the given date range
                    const bookingDate = new Date(booking.date);
                    const checkinDate = new Date(checkin);
                    const checkoutDate = new Date(checkout);
                    if (bookingDate >= checkinDate && bookingDate <= checkoutDate) {
                        const roomIds = booking.RoomsBooked;
                        const roomsToRemove = roomIds.filter(roomId => roomIds.indexOf(roomId) === 0);
                        roomsToRemove.forEach(roomId => {
                            const roomIndex = booking.RoomsBooked.indexOf(roomId);
                            booking.RoomsBooked.splice(roomIndex, 1);
                        });
                    }
                }
            }


            // save the updated room
            await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).updateOne({ "Room": roomId }, {
                $set: {
                    "Booked": room.Booked
                }
            })         //room.save();

            resolve()
        })
    }
}