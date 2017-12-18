const express = require('express');
const app = express();
const path = require('path');
const NodeWebcam = require( "node-webcam" );
const request = require('request');
const fs = require('fs');

const config = require('./config.js');

// Set app (express)
app.use(express.static('public_html'));

app.get('/sensor', (req, res) => {
    // Return sensor value
    console.log("Get sensor");
    netpie_getMessage("sensor", resp => {
        let parsedResp = JSON.parse(resp);
        res.send(parsedResp[0].payload);
    })
});

app.get('/sensor_post', (req, res) => {
    let sensorValue = req.query.sensorValue;
    console.log("Put sensor "+sensorValue);
    netpie_putMessage("sensor", sensorValue,resp => {
        console.log(resp,resp.message);
        res.send(resp.message);
    });
});

app.get('/webcam', (req, res) => {
    //captureWebcam();
    webcam.capture("test_picture", function( err, data ) {
        console.log("Webcam captured !");
        res.send('<html><body><img src="'+data+'"></body></html>');
    });
});

app.listen(8080, () => console.log('Example app listening on port 8080!'));

// Webcam
var webcam_opts = {
    width: 1280,
    height: 720,
    delay: 0,
    callbackReturn: "base64",
    output: "jpeg"
};
var webcam = NodeWebcam.create( webcam_opts );
function captureWebcam() {
    /*webcam.capture("test_picture", function( err, data ) {
        console.log("Webcam captured !");
        res.send('<html><body><img src="'+data+'"></body></html>');
    });*/
}

// Database function
var database = []; // {imgName:"xx.jpg", date:"12/12/2017 20:20", alert:"true"}
function database_load() {
    if (fs.existsSync('gallery_db.txt')) {
        // Load from file
        fs.readFile('gallery_db.csv', (err, data) => {
            if (err) throw err;
            database = JSON.parse(data);
        });
    }
}
function database_save() {
    fs.readFile('gallery_db.txt', JSON.stringify(database), (err) => {
        if (err) throw err;
    });
}

// NETPIE function
function request_send(options,callback) {
    request(options, function (err, res, body) {
        if (err) {
            console.dir(err);
            return;
        }
        console.dir('headers', res.headers);
        console.dir('status code', res.statusCode);
        console.dir(body);
        
        callback(body);
    });
}
function netpie_putMessage(topic,data,callback) {
    var options = {
        url: 'https://api.netpie.io/topic/SafetyRoom/'+topic+"?retain",
        json: data,
        method:"PUT",
        auth: {
            user: config.key,
            password: config.secret
        }
    }
    request_send(options,callback);
}

function netpie_getMessage(topic,callback) {
    var options = {
        url: 'https://api.netpie.io/topic/SafetyRoom/'+topic,
        method : "GET",
        auth: {
            user: config.key,
            password: config.secret
        }
    }
    request_send(options,callback);
}