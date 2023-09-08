const { MongoClient } = require('mongodb');

const state = {
  db: null
};
// CJCi1AFaa38CGudW
module.exports.connect = async function () {
  const uri = 'mongodb+srv://nihalStayOn:CJCi1AFaa38CGudW@cluster0.fyoyqnm.mongodb.net/?retryWrites=true&w=majority';
  const dbName = 'StayOnn';

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // return client.connect()
  //   .then(() => {
  //     state.db = client.db(dbName);
  //     console.log('MongoDB connected!');
  //   })
  //   .catch((err) => {
  //     console.error('MongoDB connection error:', err);
  //     throw err;
  //   });

  try {
    await client.connect();
    state.db = client.db(dbName);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

module.exports.get = function () {
  return state.db;
};


/*
const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}




module.exports.connect = function(done){
    const url='mongodb://0.0.0.0:27017'
    const dbname='Hotel'

    
    MongoClient.connect(url, function(err,data){
        if(err){
            return done(err);
        }
        state.db=data.db(dbname)

        done();
    })

    
    
}
module.exports.get=function(){
    return state.db
}



*/