/********************************************************************
 * Name : test.js                                                   *
 * Description : Pryv Software engineer codding exercise 3          *
 * Creation date : 18.04.2020                                       *
 * Author : Alexia Vernier, contact@alexiavernier.com               *
 *                                                                  *
 *******************************************************************/

const request = require('supertest');
const express = require('express');
const chai = require('chai');
 
const app = express();

var expect = chai.expect;

app.get('/user', function(req, res) {
  res.status(200).json({ name: 'john' });
});

describe('GET server /', function() {
  it('responds with "Hello World!"', function(done) {
    request('http://localhost:1234')
      .get('/')
      .expect(200, done);
  });
});

