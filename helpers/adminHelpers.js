var db = require('../config/connection')
var collection = require('../config/collection')
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
// const { response } = require('express');

module.exports={
    getRooms:()=>{
        return new Promise(async(resolve,reject)=>{
            var Rooms 
            await db.get().collection(collection.ROOM_COLLECTION).find().sort({"TimeDAte": -1}).toArray().then((response)=>{
                Rooms = response
                // console.log(Rooms);
                resolve(Rooms)
            })
        })
    },
    AcceptRoom:(data)=>{
        return new Promise(async(resolve,reject)=>{
            var id = data.id;
            await db.get().collection(collection.ROOM_COLLECTION).updateOne({"_id": ObjectId(id)},{$set:{
                "Verification" : true
            }}).then((response)=>{
                resolve(response)
            })
        })
    },
    BlockRoom:(data)=>{
        return new Promise(async(resolve,reject)=>{
            var id = data.id;
            await db.get().collection(collection.ROOM_COLLECTION).updateOne({"_id": ObjectId(id)},{$set:{
                "Verification" : false
            }}).then((response)=>{
                resolve(response)
            })
        })
    }
}


