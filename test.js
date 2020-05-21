/********************************************************************
 * Name : test.js                                                   *
 * Description : Pryv Software engineer codding exercise 3          *
 *                  Test file using supertest, mocha and chai       *
 * Creation date : 18.04.2020                                       *
 * Author : Alexia Vernier, contact@alexiavernier.com               *
 *                                                                  *
 *******************************************************************/

//=======REQUIRES======
const request = require('supertest');
const express = require('express');
const chai = require('chai');
var cuid = require('cuid');
 
//=======GLOBAL VARIABLES=======
const app = express();
var expect = chai.expect;
var username = cuid();
var tocken;
var ressource_json;

//=======TESTS=======

//---Hello World---
describe('GET server /', function() {
  it('Sends status 200 and responds with "Hello World!"', function(done) {
    request('http://localhost:1234')
      .get('/')
      .expect(200,"Hello World!\n", done)
  });
});


//---Users---
describe('POST server /users', function() {
    it('Sends status 201 and responds with new user created', function (done) {
        request('http://localhost:1234')
        .post('/users')
        .send({"username" : username, "password" : username})
        .expect(201,`User "${username}" created.\n`, done)
    });
});

describe('POST server /users with same username than previously', function() {
    it('Sends status 208 and responds with user already exists', function (done) {
        request('http://localhost:1234')
        .post('/users')
        .send({"username" : username, "password" : username})
        .expect(208,`The user "${username}" already exists.\n`, done)
    });
});

describe('POST server /users without any JSON', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/users')
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});

describe('POST server /users lacking username', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/users')
        .send({"password" : username})
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});

describe('POST server /users lacking passwrod', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/users')
        .send({"username" : username})
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});


//---Login---
describe('POST server /auth/login', function(res) {
    it('Sends status 200 and responds with token', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"username" : username, "password" : username})
        .end(function(err, res){
            token = res.body;
            expect(200,`Token generated\n${token}\n` );
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /auth/login without any JSON', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});

describe('POST server /auth/login lacking username', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"password" : username})
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});

describe('POST server /auth/login lacking password', function() {
    it('Sends an error 400 asking for the required fields', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"username" : username})
        .expect(400,'Expect fields "username" and "password"\n', done)
    });
});

describe('POST server /auth/login with unknown username', function() {
    it('Sends an error 403 claiming the user is unknown', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"username" : "xyz", "password" : username})
        .expect(403,`User "xyz" does not exist.\n`, done)
    });
});

describe('POST server /auth/login with wrong password', function() {
    it('Sends an error 403 claiming the password is wrong', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"username" : username, "password" : "xyz"})
        .expect(403,'Authentification failed, wrong password\n', done)
    });
});


//---Authorization header error handling---
describe('POST server /ressource with incorrect authorization', function() {
    it('Raise an error 403 claiming the token is invalid', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer 1234`)
        .send(ressource_json)
        .end((err) => {
            expect(403,`Invalid authentification token: 1234`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource without authorization', function() {
    it('Raise an error 401 claiming a Bearer authorization is required', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer 1234`)
        .send(ressource_json)
        .end((err) => {
            expect(401,'Missing token Bearer authorization header\n');
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


//---Post Ressource---
describe('POST server /ressource with correct authorization and correct ressource', function() {
    it('Sends status 201 and create a ressource in the database', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : username, "data":{}})
        .end((err) => {
            ressource_json = {"id" : username, "data":{}};
            expect(201,`Data "${ressource_json.id}" created.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource with correct authorization and ressource with same id than previously', function() {
    it('Raise an error 403 claiming a ressource with the same id already exists', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send(ressource_json)
        .end((err) => {
            expect(403,`A ressource with the id "${ressource_json.id}" already exists. No new ressource has been created.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource with correct authorization and ressource without id', function() {
    it('Sends status 201, generate id and create a ressource in the database', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"data":{}})
        .end((err) => {
            expect(201);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource without data field', function() {
    it('Raise an error 415 claiming that a ressource requires a data field', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"not_data" : {}})
        .end((err) => {
            expect(415,'The request should contain an object "data"\n');
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource with more than 10 fields in data ', function() {
    it('Raise an error 413 claiming that data requires 10 fields at most', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"data" : {"1" : "a", "2" : "a", "3" : "a", "4" : "a", "5" : "a", "6" : "a", "7" : "a", "8" : "a", "9" : "a", "10" : "a", "11" : "a"}})
        .end((err) => {
            expect(413,'Data object must contain at most 10 fields\n');
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('POST server /ressource with float in data', function() {
    it('Raise an error 413 claiming that values in data must be string or integers', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"data" : {"1" : 2.5}})
        .end((err) => {
            expect(413,`The values must be string or integers, the value associated to the key "1" is not appropriate.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


describe('POST server /ressource with a really long string in data', function() {
    it('Raise an error 413 claiming that the maximum length is 512 for values in data', function (done) {
        request('http://localhost:1234')
        .post('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"data" : {"1" : "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"}})
        .end((err) => {
            expect(413,`The values associated to the key "1" is too long. The maximum length is 512.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


//---Get Ressource---
describe('GET server /ressource with correct authorization', function() {
    it('Sends status 200 and display the ressources found', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : ressource_json.id})
        .end((err) => {
            expect(200);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});

describe('GET server /ressource with correct authorization requiring an unknown id', function() {
    it('Raise an error 404 claiming no ressource corresponding to the id has been found', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : "zzz"})
        .end((err) => {
            expect(404, `No ressource with the id "zzz" has been found.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


//---Put ressource---
describe('PUT server /ressource with correct authorization', function() {
    it('Sends status 200 and display the modifications', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : ressource_json.id, "data" : {"msg" : "Hello there"}})
        .end((err) => {
            expect(200);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


describe('PUT server /ressource with correct authorization, update non existing ressource', function() {
    it('Raise an error 404 caliming no ressources has the corresponding id', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : "zzz", "data" : {"msg" : "Hello there"}})
        .end((err) => {
            expect(404, `No existing ressource with the corresponding id "zzz" found in the database.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


//---Delete ressource---
describe('DELETE server /ressource with correct authorization', function() {
    it('Sends status 200 and display a delete message', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : ressource_json.id})
        .end((err) => {
            expect(200, `The ressource with id "${ressource_json.id}" has been deleted\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});


describe('DELETE server /ressource with correct authorization, ressource id not in data base', function() {
    it('Raise an error 404 claiming the ressource has not been found', function (done) {
        request('http://localhost:1234')
        .get('/ressources')
        .set('Authorization', `Bearer ${token}`)
        .send({"id" : "zzz"})
        .end((err) => {
            expect(404, `No existing ressource with the corresponding id "zzz" found in the database.\n`);
            if (err) {
            return done(err);
            }
            done();
        })
    });
});
