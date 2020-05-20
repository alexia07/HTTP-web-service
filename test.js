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

//=======TESTS=======

//---Hello World---
describe('GET server /', function() {
  it('Responds with "Hello World!"', function(done) {
    request('http://localhost:1234')
      .get('/')
      .expect(200,"Hello World!\n", done)
  });
});


//---Users---
describe('POST server /users', function() {
    it('responds with new user created', function (done) {
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
describe('POST server /auth/login', function() {
    it('Responds with token', function (done) {
        request('http://localhost:1234')
        .post('/auth/login')
        .send({"username" : username, "password" : username})
        .expect(200, done)
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





