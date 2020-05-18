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
  it('responds with "Hello World!"', function(done) {
    request('http://localhost:1234')
      .get('/')
      .expect(200, done)
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




