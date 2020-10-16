const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload')

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.4ft4b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()

// app.use(bodyParser.json());
app.use(cors());
app.use(express.static('images'))
app.use(fileUpload())

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const port = 5000;

app.get('/', (req, res) => {
  res.send("Server is working successfully")
})

client.connect(err => {
  const ordersCollection = client.db(process.env.DB_NAME).collection("orders");
  const servicesCollection = client.db(process.env.DB_NAME).collection("services");
  const reviewsCollection = client.db(process.env.DB_NAME).collection("reviews");
  const adminCollection = client.db(process.env.DB_NAME).collection("admin");

  // Home AllServices
  app.get('/getAllServices', (req, res) => {
    servicesCollection.find({})
      .toArray((err, document) => {
        res.send(document)
      })
  })
  // Customer All Orders
  app.post('/showclientorders', (req, res) => {
    const email = req.body.email
    console.log(email);
    ordersCollection.find({email: email})
      .toArray((err, document) => { 
        console.log(document);
        res.send(document)
      })
  })

    // Admin Show All Orders
    app.get('/showAllOrders', (req, res) => {
      ordersCollection.find({})
        .toArray((err, document) => {
          res.send(document)
        })
    })

  //Home
  app.get('/getAllReviews', (req, res) => {
    reviewsCollection.find({})
      .toArray((err, document) => {
        res.send(document)
      })
  })

  // Check Admin
  app.post('/checkAdmin', (req, res) => {
    const email = req.body.email
    adminCollection.find({ email: email })
      .toArray((err, admin) => {
        res.send(admin.length > 0)
      })
  })

  // Add a Admin
  app.post('/addAdmin', (req, res) => {
    const email = req.body.email
    adminCollection.insertOne({ email: email })
      .then((result) => {
        res.send(result.insertedCount > 0)
      })
  })

  // Insert fakedatas
  app.post('/addManyItem', (req, res) => {
    const data = req.body
    ordersCollection.insertMany(data)
      .then(result => {
        console.log(result.insertedCount);
        res.send(result.insertedCount > 0)
      })
  })

  //create customer review
  app.post('/addReview', (req, res) => {
    const data = req.body
    console.log(data);
    reviewsCollection.insertOne(data)
      .then(result => {
        console.log(result.insertedCount);
        res.send(result.insertedCount > 0)
      })
  })

  //save a image from client to server
  app.post('/addOrder', (req, res) => {
    console.log("Hitted");
    const file = req.files.file;
    const { name, email, userName, description } = req.body

    const filePath = `${__dirname}/images/${file.name}`
    file.mv(filePath, err => {
      if (err) {
        console.log(err);
        res.status(500).send({ msg: "Failed to upload image" })
      }
      const newImg = fs.readFileSync(filePath)
      const encImg = newImg.toString('base64')

      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
      };
      const newOrder = { name, email, userName, description, image }
      console.log(newOrder);
      ordersCollection.insertOne(newOrder)
        .then(result => {
          fs.remove(filePath, error => {
            if (error) {
              console.log(error);
            }
            res.send(result.insertedCount > 0)
          })

        })
      // return res.send({name:file.name, path:`/${file.name}`})
    })

  })

  //Add A Service admin part
  app.post('/addAService', (req, res) => {
    console.log("Hitted");
    const file = req.files.file;
    const { name, description } = req.body

    const filePath = `${__dirname}/images/${file.name}`
    file.mv(filePath, err => {
      if (err) {
        console.log(err);
        res.status(500).send({ msg: "Failed to upload image" })
      }
      const newImg = fs.readFileSync(filePath)
      const encImg = newImg.toString('base64')

      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
      };
      const newOrder = { name, description, image }
      console.log(newOrder);
      servicesCollection.insertOne(newOrder)
        .then(result => {
          fs.remove(filePath, error => {
            if (error) {
              console.log(error);
            }
            res.send(result.insertedCount > 0)
          })

        })
      // return res.send({name:file.name, path:`/${file.name}`})
    })

  })

  console.log("Database Connection established");
});

app.listen(process.env.PORT || port, () => {
  console.log("Server is working successfully");
})