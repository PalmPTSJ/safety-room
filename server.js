const express = require('express');
const app = express();
const path = require('path');
const NodeWebcam = require( "node-webcam" );
const request = require('request');
const fs = require('fs');

const config = require('./config.js');

// Set app (express)
app.use(express.static(config.public_html_dir));

app.get('/sensor', (req, res) => {
    // Return sensor value
    console.log("Get sensor");
    netpie_getMessage("sensor", resp => {
        let parsedResp = JSON.parse(resp);
        res.send(parsedResp[0].payload);
    });
});

app.get('/sensor_post', (req, res) => {
    let sensorValue = req.query.sensorValue;
    console.log("Put sensor "+sensorValue);
    netpie_putMessage("sensor", sensorValue,resp => {
        console.log(resp,resp.message);
        res.send(resp.message);
    });
});

app.get('/gallery', (req, res) => { // Get gallery json
    res.send(galleryDB);
});
app.get('/gallery_reset', (req, res) => { // Reset gallery
    galleryDB_reset();
    res.send("Success");
});

app.get('/webcam', (req, res) => {
    console.log("Gallery now",galleryDB);
    captureWebcam((filename) => {
        console.log("Webcam capture Done !");
        let d = new Date();
        galleryDB.push({
            filename : filename,
            date : d.toLocaleString(),
            alert : false,
            msg : "Test picture"
        });
        galleryDB_save();
        
        res.send("Success");
    })
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
function captureWebcam(callback) {
    let d = new Date();
    let timeNow = d.getTime();
    console.log("captureWebcam - will capture with time",timeNow);
    let filename = config.gallery_dir+"/"+timeNow+".jpg";
    webcam.capture(filename, function( err, data ) {
        callback(filename);
    });
}

// Gallery Database function
var galleryDB = []; // {imgName:"xx.jpg", date:"12/12/2017 20:20", alert:true, msg:"GG"}
function galleryDB_load() {
    if (fs.existsSync(config.gallery_db_file)) {
        // Load from file
        fs.readFile(config.gallery_db_file, (err, data) => {
            if (err) throw err;
            galleryDB = JSON.parse(data);
        });
    }
    else {
        galleryDB = [];
    }
}
function galleryDB_save() {
    fs.writeFile(config.gallery_db_file, JSON.stringify(galleryDB), (err) => {
        if (err) throw err;
    });
}
function galleryDB_reset() {
    galleryDB = [];
    // reset file
    galleryDB_save();
    
    // delete old gallery
    fs.readdir(config.gallery_dir, (err, files) => {
        if(err) throw err;
        
        for(const file of files) {
            fs.unlink(path.join(config.gallery_dir, file), err => {
                if(err) throw err;
            });
        }
    });
}
galleryDB_load();


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
        url: config.netpie_url+topic+"?retain",
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
        url: config.netpie_url+topic,
        method : "GET",
        auth: {
            user: config.key,
            password: config.secret
        }
    }
    request_send(options,callback);
}