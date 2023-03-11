var db = require('../config/connection')
var collection = require('../config/collection')
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { response } = require('express');

module.exports = {
    addroom: (roomDetails) => {
        return new Promise(async (resolve, reject) => {
            let addRoom = await db.get().collection(collection.ROOM_COLLECTION).insertOne(roomDetails)
            let img1 = addRoom.insertedId + 1
            let img2 = addRoom.insertedId + 2
            let img3 = addRoom.insertedId + 3
            await db.get().collection(collection.ROOM_COLLECTION).updateOne({ "_id": ObjectId(addRoom.insertedId) },
                { $set: { "img1": img1, "img2": img2, "img3": img3 } })
            resolve(addRoom.insertedId)
        })
    },
    getRooms: (data) => {
        return new Promise(async (resolve, reject) => {
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find({ "email": data.email }).toArray();
            resolve(rooms)
        })
    },
    doSignup: (data) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            let user = await db.get().collection(collection.VENDOR_USER_COLLECTION).findOne({ email: data.email })
            if (user) {
                console.log("user Already exists")
                let status = false
                resolve(status)
            } else {
                data.verification = false
                await db.get().collection(collection.VENDOR_USER_COLLECTION).insertOne(data).then((response) => {
                    console.log('data Inserted successfully')
                    resolve(data)
                })
            }
        })
    },
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.VENDOR_USER_COLLECTION).findOne({ email: data.email })
            if (user) {
                bcrypt.compare(data.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true
                        resolve(response)
                    } else {
                        //password incorrect
                        response.status = false
                        resolve(response)
                    }
                })
            } else {
                // if No user
                let status = false
                resolve(status)
            }
        })
    },
    checkUser: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.VENDOR_USER_COLLECTION).findOne({ email: data.email });
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
            let haveOtp = await db.get().collection(collection.VENDOR_OTP_REQUEST).findOne({ email: data.email })
            if (haveOtp) {
                await db.get().collection(collection.VENDOR_OTP_REQUEST).updateOne({ email: data.email }, { $set: { "OTP": data.OTP, "Time": data.startTime, "ExpireTime": data.ExpireTime } })
            } else {
                await db.get().collection(collection.VENDOR_OTP_REQUEST).insertOne(data)
            }

        })
    },
    verifyOTP: (data) => {
        let TimeNow = Date.now()
        return new Promise(async (resolve, reject) => {
            let response = {}
            let getData = await db.get().collection(collection.VENDOR_OTP_REQUEST).findOne({ email: data.email })
            if (TimeNow < getData.ExpireTime) {
                if (data.otp == getData.OTP) {
                    // await db.get().collection(collection.VENDOR_OTP_REQUEST).deleteOne({ email: data.email })
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
            await db.get().collection(collection.VENDOR_USER_COLLECTION).updateOne({ email: data.email }, { $set: { "password": data.password } }).then((response) => {
                resolve(response)
            })
        })
    },
    GetAllActionsRoom: (id) => {
        id = id.toString();
        return new Promise(async (resolve, reject) => {
            var BookedRooms = await db.get().collection(collection.USER_CONFIRMED_BOOKING).find({ "roomId": id }).toArray();
            //console.log(BookedRooms);

            //get all action, but currently only having booked details.
            resolve(BookedRooms)
        })
    },
    GetRoomsLeftforToday: (vendor) => {
        return new Promise(async (resolve, reject) => {
            var VendorRooms = await db.get().collection(collection.ROOM_COLLECTION).find({ "email": vendor.email }).toArray();


            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            // Add leading zeros to month and day if necessary
            const formattedMonth = month.toString().padStart(2, "0");
            const formattedDay = day.toString().padStart(2, "0");

            const formattedTodayDate = `${year}-${formattedMonth}-${formattedDay}`;



            //console.log(VendorRooms)
            var RoomIDs = [];
            var LiveCustomers = 0;
            var TotalRooms = 0;
            var futureRoomsBooked = 0;

            //to get Room IDs
            for (i = 0; i < VendorRooms.length; i++) {
               // console.log(VendorRooms.length)
                var OneRoom = VendorRooms[i]
                RoomIDs.push(OneRoom._id.toString());
            }
            //to get Rooms Counts
            for(i=0; i<VendorRooms.length; i++) {
                var  oneRoom =  VendorRooms[i];
                TotalRooms = parseInt(TotalRooms) + parseInt(OneRoom.roomCount)
            }



            console.log(RoomIDs);
            var ThisRoomBookedData = await db.get().collection(collection.LIVE_ROOM_BOOKED_COLLECTION).find({ "Room": { $in: RoomIDs } }).toArray(); //
            //console.log(ThisRoomBookedData.length);
            for (i = 0; i < ThisRoomBookedData.length; i++) {
                //console.log(ThisRoomBookedData[i])
                var OneRoomBooking = ThisRoomBookedData[i].Booked;
              // console.log(OneRoomBooking)
                for (j = 0; j < OneRoomBooking.length; j++) {
                   // console.log("______")
                    //console.log(OneRoomBooking[j])
                   // console.log("______")
                    var OneDateBooking = OneRoomBooking[j];
                    if (OneDateBooking.date == formattedTodayDate){
                        //console.log("FFDFDFD")
                        //console.log(OneDateBooking)
                        var RoomsBookedforToday = OneDateBooking.RoomsBooked.length;
                        //console.log(RoomsBookedforToday);
                        LiveCustomers = LiveCustomers+ RoomsBookedforToday;
                        //console.log("FFDFDFD")
                    }else if(OneDateBooking.date > formattedTodayDate) {
                        //console.log(OneDateBooking.date ,">", formattedTodayDate)
                        // console.log("")
                        futureRoomsBooked = parseInt(futureRoomsBooked) +  parseInt(OneDateBooking.RoomsBooked.length);
                        
                    }
                }
            }
            // console.log("Live Customers : ",LiveCustomers);
            // console.log("TOtal Rooms: ",TotalRooms);
            var RoomsAvailableToday = TotalRooms - LiveCustomers;
            // console.log("Rooms Available Today: ",RoomsAvailableToday);
            // console.log("Future Rooms Booked: ",futureRoomsBooked);
            var  RoomsMainInfo = {
                "LiveCustomers": LiveCustomers,
                "TotalRooms" : TotalRooms,
                "RoomAvailableForToday": RoomsAvailableToday,
                "RoomsFutureBooked":futureRoomsBooked
            }
            resolve(RoomsMainInfo)
        })
    },
    DeleteRoomVendor:(id)=>{
        return new Promise(async(resolve,reject)=>{
            var room = await db.get().collection(collection.ROOM_COLLECTION).findOne({"_id" : ObjectId(id)})
            console.log(room);
            await db.get().collection(collection.ROOM_COLLECTION).deleteOne({"_id" : ObjectId(id)})
            await db.get().collection(collection.VENDOR_DELETED_ROOMS).insertOne(room).then(()=>{
                resolve()
            })
        })
    },
    getOneRoom:(id)=>{
        return new Promise(async(resolve,reject)=>{
            var Room = await db.get().collection(collection.ROOM_COLLECTION).findOne({"_id":ObjectId(id)})
            resolve(Room)
        })
    },
    SaveEditedRoom:(data, id)=>{
        return new Promise(async(resolve, reject)=>{
            await db.get().collection(collection.ROOM_COLLECTION).updateOne({"_id":ObjectId(id)},{$set:
            {
                "name":data.name,
                "contact": data.contact,
                "State":data.State,
                "District": data.District,
                "Address":data.Address,
                "Place":data.Place,
                "City": data.City,
                "ZipCode":data.ZipCode,
                "Landmark":data.Landmark,
                "description":data.description,
                "Verification":data.Verification,
                "RealPrice":data.RealPrice,
                "OfferPrice":data.OfferPrice,
                "roomCount":data.roomCount,
                "TyprOfRoom": data.TyprOfRoom,
                "Wifi":data.Wifi,
                "ServiceTime":data.ServiceTime,
                "FoodService":data.FoodService,
                "Pool":data.Pool,
                "AC":data.AC,
                "TV":data.TV,
                "HotelPolices":data.HotelPolices
            }
            }).then((response)=>{
                console.log(response)
                resolve()
            })

        })
    }
}