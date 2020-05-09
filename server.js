/********************************************************************
 * Name : app.js                                                    *
 * Description : Pryv Software engineer codding exercise 2          *
 * Creation date : 30.04.2020                                       *
 * Author : Alexia Vernier, contact@alexiavernier.com               *
 *                                                                  *
 *******************************************************************/

//===============REQUIRES=================
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var url = require('url');
var request = require('request');
const superagent = require('superagent');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var jwt = require('jsonwebtoken');

//==============GLOBAL VARIABLES==============
var app = express();
const port = 1234 ; //Define listening port
const SECRET_KEY = "JWT_SECRET";

//=============USES============
app.use(express.json());


//=============FUNCTIONS===============

/****************************************
 * Brief :  expect input with field     *
 *          username and password       *
 *          create user in the db       *
 *          if user is not created yet  *
 ***************************************/

//Test curl : curl -i -X POST -H 'Content-Type: application/json' -d '{"username":"a", "password":"a"}' "http://localhost:1234/users" 

function create_user(req, res) {
    
    var userjson = req.body;
    
    if (!("username" in userjson) || !("password" in userjson)) {
        res.status(400);
        res.send('Expect fields "username" and "password"\n');
        return;
    }
    
    var v_username = userjson.username;
    var v_password = userjson.password;
    
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'userdb';
    const client = new MongoClient(urldb);

    client.connect(async function(err) {
        assert.equal(null, err);
        //console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('users');
        
        var cursor = await db.collection('users').find({username: v_username}).toArray();

        if (cursor.length < 1)
        {
            db.collection('users').insertOne({
                username: v_username,
                password: v_password
            })
            client.close();
        
            res.status(201);
            res.send(`User "${v_username}" created.\n`);
        }
        else 
        {   
            client.close();
            res.status(208);
            res.send(`The user "${v_username}" already exists.\n`);
        }
    });
    
}//End function create_user



/****************************************
 * Brief :  expect input with field     *
 *          username and password       *
 *          send token valid for 48h    *
 ***************************************/

//Test curl : curl -i -X POST -H 'Content-Type: application/json' -d '{"username":"a", "password":"a"}' "http://localhost:1234/auth/login" 

function login(req,res){
    var userjson = req.body;
    
    if (!("username" in userjson) || !("password" in userjson)) {
        res.status(400);
        res.send('Expect fields "username" and "password"\n');
        return;
    }
    
    var v_username = userjson.username;
    var v_password = userjson.password;
    
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'userdb';
    const client = new MongoClient(urldb);

    client.connect(async function(err) {
        assert.equal(null, err);
        //console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('users');
        
        var cursor = await db.collection('users').find({username: v_username}).toArray();

        if (cursor.length < 1)
        {
            res.status(403);
            res.send(`User "${v_username}" does not exist.\n`);
            return
        }
        
        cursor = await db.collection('users').find({username: v_username, password: v_password}).toArray();
        
        if (cursor.length < 1)
        {
            client.close();
            res.status(403);
            res.send('Authentification failed, wrong password\n');
            return
        }
        
        client.close();
        res.status(200);
        token = jwt.sign(userjson, SECRET_KEY);
        res.send(`Token generated\n${token}\n`);
    });
}//End function login



/****************************************
 * Brief :  check if token is OK        *
 *          check for its validity      *
 ***************************************/

//Token example : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODg2MDg4MDF9.olYZxe7SXto-cKNno38lzXrqXOR9Jtalkd3U7mv2xIc
//  To test after 6.05 18h40
//Test curl : curl -i -X POST -H 'Content-Type: application/json' -d '{"token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODg2MDg4MDF9.olYZxe7SXto-cKNno38lzXrqXOR9Jtalkd3U7mv2xIc"}' "http://localhost:1234/ressources"
//Result : "Token outdated, please generate a new one at /users"

function check_token(req, res){
    
    jwtToken = req.body.token;
    
    try{
      tokenjson = jwt.verify(jwtToken, SECRET_KEY);
    }catch(e){
        res.status(403);
        res.send('Invalid authentification token\n');
        return false;
    }
    
    var d = new Date();
    
    if ((d.getTime()/1000)-tokenjson.iat>(172800))
    {
        res.status(403);
        res.send('Token outdated, please generate a new one at /users\n');
        return false;
    }
    
    return true;
    //res.status(200)
    //res.send('Good job\n');
    
}//End function check_token


/********************************************
 * Brief :  check if authorization header   *
 *          check for its validity          *
 ********************************************/

//curl -i -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODg2MDg4MDF9.olYZxe7SXto-cKNno38lzXrqXOR9Jtalkd3U7mv2xIc' "http://localhost:1234/ressources"

function check_authorization(req,res){
    
    if (!req.headers.authorization || req.headers.authorization.indexOf('Bearer ') === -1) {
        res.status(401);
        res.send('Missing token authorization header\n');
        return;
    }
    
    var token_recieved = req.headers.authorization.split(' ')[1];
    
    
}


//===============SERVER=============

//Hello Word at /
app.get('/', (req, res) => res.send('Hello World!'));

//Retrieve creditentials and send event at /data
app.post('/users', (req, res) => create_user(req, res));

app.post('/auth/login', (req,res) => login(req, res));

app.post('/ressources', (req,res) => check_authorization(req, res));

//Console output to confirm app is listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

//================TOKEN for Tests=========
//Until 11.05.2020 19:20
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODkwNDUwMTN9.CTqw6GE3ji4Yxg11jzMRrzk6ewg5XQ51Zisy-hiN6rI


