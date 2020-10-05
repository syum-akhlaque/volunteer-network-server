const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');


const app = express()

app.use(bodyParser.json());
app.use(cors());

var serviceAccount = require("./configs/volunteer-network-22-firebase-adminsdk-fq1en-59cb37c561.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-network-22.firebaseio.com"
});

const port = 5000;
require('dotenv').config();
const dbName =  process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const uri = `mongodb+srv://${username}:${password}@cluster0.plwup.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const orgCollection = client.db(dbName).collection("organizations");
  const eventCollection = client.db(dbName).collection("events");


    app.post('/allOrgList', (req, res)=>{  // to send fake data in mongo db
        const org = req.body;
        orgCollection.insertMany(org)
        .then(result =>{
          res.send(result.insertedCount)
        })
    })

    app.post('/addNewOrgEvent', (req, res)=>{  //to add new organization by admin
      const org = req.body;
      orgCollection.insertOne(org)
      .then(result =>{
        res.send(result.insertedCount)
      })
  })

    app.post('/addEvents', (req, res)=>{ //add events for a user who wants to reigster
        const org = req.body;
        eventCollection.insertOne(org)
        .then(result =>{
            res.send(result.insertedCount)
        })
    })

    app.get('/orgList', (req, res)=>{  // show all org in home page
        orgCollection.find({})
        .toArray( (err, documents) => {
          res.send(documents)
        } )
      })

      app.get('/eventList', (req,res)=>{ // retrive all event list for loggedin user filter by email
        const bearer = req.headers.authorization; 
  
        if (bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          // idToken comes from the client app
          admin.auth().verifyIdToken(idToken)
          .then(function(decodedToken) {
            let uid = decodedToken.uid;
            let tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            if ( tokenEmail == queryEmail ){
              eventCollection.find({email: queryEmail})
              .toArray((err,documents)=>{
                  res.send(documents);
              })
            }
            else {
              res.status(401).send('404 error , Unauthorised Requeset')
              };      
            // ...
          }).catch(function(error) {
            // Handle error
            res.status(401).send('404 error , Unauthorised Requeset')
          });
        }
        else {
          res.status(401).send('404 error , Unauthorised Requeset')
          }
      })

      app.get('/allEventList', (req, res)=>{  // retrive All event list for admin 
          eventCollection.find({})
          .toArray( (err, documents) => {
            res.send(documents)
          } )
        })

     app.delete('/delete/:id', (req,res)=>{ // delete data from mongodb
        eventCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
        res.send(result.deletedCount> 0)
        })
     })

});

app.listen(port)
