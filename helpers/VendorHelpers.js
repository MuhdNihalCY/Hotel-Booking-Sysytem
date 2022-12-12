var db = require('../config/connection')
var collection = require('../config/collection')
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

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
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find({"email":data.email}).toArray();
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
    resetPassword:(data)=>{
        return new Promise(async(resolve,reject)=>{
            data.password = await bcrypt.hash(data.password, 10)
            await db.get().collection(collection.VENDOR_USER_COLLECTION).updateOne({email:data.email},{$set:{"password":data.password}}).then((response)=>{
                resolve(response)
            })
        })
    }
}