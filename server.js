/********************************************************************
 * Name : server.js                                                 *
 * Description : Pryv Software engineer codding exercise 3          *
 * Creation date : 30.04.2020                                       *
 * Author : Alexia Vernier, contact@alexiavernier.com               *
 *                                                                  *
 *******************************************************************/

//===============REQUIRES=================
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var url = require('url');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var jwt = require('jsonwebtoken');
var cuid = require('cuid');
const bcrypt = require('bcrypt')


//==============GLOBAL VARIABLES==============
var app = express();
const port = 1234 ;
const SECRET_KEY = "JWT_SECRET";
var salt =10 //any random value for password encrypting


//=============USES============
app.use(express.json());


//=============FUNCTIONS===============

/****************************************
 * @brief : creates user in the db      *
 *          if user is not created yet  *
 *                                      *
 * @param :                             *
 *      - req : request, body should be *
 *              JSON type, composed of  *
 *              "username"and "password"*
 *              fields                  *
 *      - res : response, send status   *
 *              and messages            *
 ***************************************/

//Test with curl
//curl -i -X POST -H 'Content-Type: application/json' -d '{"username":"a", "password":"a"}' "http://localhost:1234/users" 

function create_user(req, res) {
    
    var userjson = req.body;
    
    if (!("username" in userjson) || !("password" in userjson)) {
        res.status(400);
        res.send('Expect fields "username" and "password"\n');
        return;
    }
    
    var v_username = userjson.username;
    
    bcrypt.hash(req.body.password, salt, (err, encrypted) => {
        userjson.password = encrypted
    });
    var v_password = userjson.password;
    
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'userdb';
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
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
            return;
        }
        else 
        {   
            client.close();
            res.status(208);
            res.send(`The user "${v_username}" already exists.\n`);
            return;
        }
    });
    
}//End function create_user



/****************************************
 * @brief : sends token valid for 48h   *
 *                                      *
 * @param :                             *
 *      - req : request, body should be *
 *              JSON type, composed of  *
 *              "username" and          *
 *              "password" fields       *
 *      - res : response, send status   *
 *              and token               *
 ***************************************/

//Test with curl
//curl -i -X POST -H 'Content-Type: application/json' -d '{"username":"a", "password":"a"}' "http://localhost:1234/auth/login" 

async function login(req,res){
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
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('users');
        
        var cursor = await db.collection('users').find({username: v_username}).toArray();

        if (cursor.length < 1)
        {
            client.close();
            res.status(403);
            res.send(`User "${v_username}" does not exist.\n`);
            return
        }
        
        var is_password_OK;
        
        await bcrypt.compare(userjson.password, cursor[0].password, function (err, result) {
            if (result == true) {
                is_password_OK = true;
            } else {
                is_password_OK = false;
            }
        });
        
        if (!is_password_OK)
        {
            client.close();
            res.status(403);
            res.send('Authentification failed, wrong password\n');
            return;
        }
        
        client.close();
        res.status(200);
        token = jwt.sign(userjson, SECRET_KEY);
        res.send(`Token generated\n${token}\n`);
        return;
    });
}//End function login



/****************************************
 * @brief : checks token validity       *
 *                                      *
 * @param :                             *
 *      - jwtToken : token to check     *
 *      - res : response, sends status  *
 *              and messages            *
 *                                      *
 * @return : bool - false if invalid    *
 *                - true if valid       *
 ***************************************/

//Test curl
//curl -i -X POST -H 'Content-Type: application/json' -d '{"token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODg2MDg4MDF9.olYZxe7SXto-cKNno38lzXrqXOR9Jtalkd3U7mv2xIc"}' "http://localhost:1234/ressources"

function check_token(jwtToken, res){
    
    try{
      tokenjson = jwt.verify(jwtToken, SECRET_KEY);
    }catch(e){
        res.status(403);
        res.send(`Invalid authentification token: ${jwtToken}\n`);
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
    
}//End function check_token


/********************************************
 * @brief : checks for validity of          *
 *          authorization header            *
 *                                          *
 * @param :                                 *
 *      - req : request, header should      *
 *              contain a Bearer            *
 *              authorization with a valid  *
 *              token                       *
 *      - res : response, sends status and  *
 *              messages                    *
 *                                          *
 * @return : bool - false if invalid        *
 *                - true if valid           *
 *******************************************/

//Test with curl
//curl -i -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODkwNDUwMTN9.CTqw6GE3ji4Yxg11jzMRrzk6ewg5XQ51Zisy-hiN6rI' "http://localhost:1234/ressources"

function check_authorization(req,res){
    
    if (!req.headers.authorization || req.headers.authorization.indexOf('Bearer ') === -1) {
        res.status(401);
        res.send('Missing token Bearer authorization header\n');
        return false;
    }
    
    var token_recieved = req.headers.authorization.split(' ')[1];
    
    if(check_token(token_recieved, res) == false)
    {
        return false;
    }
    
    return true;
}//End function check_authorization

/********************************************
 * @brief : Runs necessary checks, create   *
 *          the ressource with the required *
 *          properties and store it in the  * 
 *          data base                       *
 *                                          *
 * @param :                                 *
 *      - req : request, body should be a   *
 *              JSON containing a "data"    *
 *              field with inside not more  *
 *              than 10 fields with sting   *
 *              or int value of max length  *
 *              512                         *
 *      - res : response, sends status and  *
 *              messages                    *
 *******************************************/

//Tests with curl
//curl -i -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODkwNDUwMTN9.CTqw6GE3ji4Yxg11jzMRrzk6ewg5XQ51Zisy-hiN6rI' -H 'Content-Type: application/json' -d '{"msg" : "Good job", "author" : "me"}' "http://localhost:1234/ressources"

//curl -i -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODk0NzUwNDJ9.vuV3Z5jcGf4tI3Q1qIGo9F9u2Krwtgb8FDvoX-IvPDU' -H 'Content-Type: application/json' -d '{"id" : 0, "data" : {"msg" : "Good job", "author" : "me"}}' "http://localhost:1234/ressources"

function post_ressource(req,res){
    
    if (check_authorization(req,res) == false){
        return;
    }
    
    var ressource_json = req.body;
    
    if(!ressource_json.hasOwnProperty('data'))
    {
        res.status(415);
        res.send('The request should contain an object "data"\n');
        return;
    }
    
    var datajson = ressource_json.data;
    var datajson_keys = Object.keys(datajson);
    
    
    if (datajson_keys.length > 10)
    {
        res.status(413);
        res.send('Data object must contain at most 10 fields\n');
        return;
    }
    
    var error_happened = false;
    datajson_keys.forEach((item, index) => {
        if((typeof datajson[item] != "string") && !(Number.isInteger(datajson[item]))){
            error_happened = true;
            res.status(415);
            res.send(`The values must be string or integers, the value associated to the key "${item}" is not appropriate.\n`);
            return;
        }
        
        if (datajson[item].length > 512){
            error_happened = true;
            res.status(413);
            res.send(`The values associated to the key "${item}" is too long. The maximum length is 512.\n`);
            return;
        }
    });
    
    if (error_happened) {
        return;
    }
    
    if(!ressource_json.hasOwnProperty('id'))
    {
        ressource_json.id = cuid();
    }
    
    var d = new Date();
    
    ressource_json.created = d.getTime()/1000;
    ressource_json.modified = ressource_json.created;
    
    
    //Write in database
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'ressourcedb';
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('ressource');
        
        var cursor = await db.collection('ressource').find({"id": ressource_json.id}).toArray();
        
        //If a ressource has the same id, stop procedure
        if (cursor.length > 0)
        {
            client.close();
            res.status(403);
            res.send(`A ressource with the id "${ressource_json.id}" already exists. No new ressource has been created.\n`);
            return;
        }
        
        db.collection('ressource').insertOne(ressource_json);
        client.close();
    
        res.status(201);
        res.send(`Data "${ressource_json.id}" created.\n`);
        return;
    });
}//End function post_ressource


/********************************************
 * @brief :   Proceeds to search in the     *
 *            database and return the       *
 *            result ressource with the     *
 *            desired id                    *
 *                                          *
 * @param :                                 *
 *      - req : request, body should be a   *
 *              JSON containing the         *
 *              filteringcvalues for the    *
 *              search                      *
 *      - res : response, sends status and  *
 *              messages                    *
 *******************************************/

//Test with curl
//curl -i -X GET -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1OTAwNTMyNzB9.2-h7fMMVs6N6IoRC-Q33O6ApizA-JbU6_3jSocxkYbw' -H 'Content-Type: application/json' -d '{"id": 0}' "http://localhost:1234/ressources"

function get_ressource(req, res){
    
    if (check_authorization(req,res) == false){
        return;
    }
    
    require_json = req.body;
    
    //Search in database
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'ressourcedb';
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('ressource');
        
        var cursor = await db.collection('ressource').find(require_json).toArray();
        
        if (cursor.length < 1)
        {
            client.close();
            res.status(404);
            res.send(`No ressource with the following requirements "${JSON.stringify(require_json)}" has been found.\n`);
            return;
        }
        
        client.close();
    
        res.status(200);
        res.send(`Data found : ${JSON.stringify(cursor)}\n`);
        return;
    });
}//End function get_ressource


/********************************************
 * @brief :   Proceeds to search in the     *
 *            database and update the       *
 *            item found with the           *
 *            corresponding id using the    *
 *            values provided by the request*
 *                                          *
 * @param :                                 *
 *      - req : request, body should be a   *
 *              JSON containing an "id" and *
 *              a "data" field              *
 *      - res : response, sends status and  *
 *              messages                    *
 *******************************************/

//Test with curl
//curl -i -X PUT -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1ODk3MjI0Mjl9.aXTFOTnY2wHyvNftTExb65n07uk_pJ1o5CnB_C07rXA' -H 'Content-Type: application/json' -d '{"id": 0, "data" : {"msg" : "Hello World", "author" : "me"}}' "http://localhost:1234/ressources"

function put_ressource(req,res){
    
    if (check_authorization(req,res) == false){
        return;
    }
    
    update_json = req.body;
    
    if (!update_json.hasOwnProperty('data') || (!update_json.hasOwnProperty('id'))){
        res.status(403);
        res.send('In order to update a ressource, please send a JSON with an id field and a data field.\n');
        return;
    }
    
    //Search in database the ressource with the corresponding id
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'ressourcedb';
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('ressource');
        
        var cursor = await db.collection('ressource').find({"id" :update_json.id}).toArray();
        
        //Check if ressource to update exists
        if (cursor.length < 1)
        {
            client.close();
            res.status(404);
            res.send(`No existing ressource with the corresponding id "${update_json.id}" found in the database.\n`);
            return;
        }
        
        var old_ressource = cursor[0]; 
        
        var d = new Date();
        
        await db.collection('ressource').updateOne({id : update_json.id }, {$set: {modified : d.getTime()/1000}});
        
        await Object.entries(update_json.data).forEach(async ([key, value]) => {
            var obj = {data : old_ressource.data};
            obj.data[key]=value;
            await db.collection('ressource').updateOne({id : update_json.id }, {$set : obj});
        });
        
        var cursor2 = await db.collection('ressource').find({"id" :update_json.id}).toArray();
        client.close();
    
        res.status(200);
        res.send(`The ressource \n ${JSON.stringify(old_ressource)}\n has been updated to \n ${JSON.stringify(cursor2[0])} \n`);
        return;
    });
}//End function put_ressource

/********************************************
 * @brief :   Proceeds to search in the     *
 *            database and delete the       *
 *            item found with the           *
 *            corresponding id              *
 * @param :                                 *
 *      - req : request, body should be a   *
 *              JSON containing an "id"     *
 *              field                       *
 *      - res : response, sends status and  *
 *              messages                    *
 *******************************************/

//Test with curl
//curl -i -X DELETE -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImEiLCJwYXNzd29yZCI6ImEiLCJpYXQiOjE1OTAwNTMyNzB9.2-h7fMMVs6N6IoRC-Q33O6ApizA-JbU6_3jSocxkYbw' -H 'Content-Type: application/json' -d '{"id": 1}' "http://localhost:1234/ressources"

function delete_ressource(req,res){
    
    if (check_authorization(req,res) == false){
        return;
    }
    
    delete_json = req.body;
    
    if (!delete_json.hasOwnProperty('id')){
        res.status(403);
        res.send('In order to update a ressource, please send a JSON with an id field.\n');
        return;
    }
    
    //Search in database the ressource with the corresponding id
    const urldb = 'mongodb://localhost:27017';
    const dbName = 'ressourcedb';
    const client = new MongoClient(urldb, { useUnifiedTopology: true });

    client.connect(async function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('ressource');
        
        var cursor = await db.collection('ressource').find({"id" :delete_json.id}).toArray();
        
        //Check if ressource to update exists
        if (cursor.length < 1)
        {
            client.close();
            res.status(403);
            res.send(`No existing ressource with the corresponding id "${delete_json.id}" found in the database.\n`);
            return;
        }
        var d = new Date();
        
        await db.collection('ressource').updateOne({id : delete_json.id }, {$set: {deleted : d.getTime()/1000}});
        await db.collection('ressource').updateOne({id : delete_json.id }, { $unset: {data : "" }});
        
        client.close();
        res.status(200);
        res.send(`The ressource with id "${delete_json.id}" has been deleted\n`);
        
    });
    
}//End function delete_ressource

//===============SERVER=============

//Hello Word at /
app.get('/', (req, res) => res.send('Hello World!\n'));

app.post('/users', (req, res) => create_user(req, res));

app.post('/auth/login', (req,res) => login(req, res));

app.post('/ressources', (req,res) => post_ressource(req, res));
app.get('/ressources', (req,res) => get_ressource(req, res));
app.put('/ressources', (req, res) => put_ressource(req, res));
app.delete('/ressources' , (req, res) => delete_ressource(req, res));

//Console output to confirm app is listening
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
