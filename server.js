const express = require('express');
const app = express();
const path = require('path');
const NodeWebcam = require( "node-webcam" );
const request = require('request');
const fs = require('fs');
const MicroGear = require('microgear');

const config = require('./config.js');

// Set app (express)
app.use(express.static(config.public_html_dir));

var sensorValue = 0;
app.get('/sensor', (req, res) => {
    // Return sensor value
    res.send(""+sensorValue);
});

var peopleValue = 0;
app.get('/people', (req, res) => {
    // Return sensor value
    res.send(""+peopleValue);
});

app.get('/post', (req, res) => {
    let sensor = req.query.sensor;
    let people = req.query.people;
    console.log("Put sensor SENSOR:"+sensor+", PEOPLE:"+people);
    microgear.chat('server', ""+sensor+" "+people);
    res.send("OK");
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
    let filenameRelative = config.gallery_dir + "/" + timeNow + ".jpg";
    let filename = config.public_html_dir + "/" + filenameRelative;
    webcam.capture(filename, function( err, data ) {
        callback(filenameRelative);
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
    fs.readdir(config.public_html_dir + "/" + config.gallery_dir, (err, files) => {
        if(err) throw err;
        
        for(const file of files) {
            fs.unlink(path.join(config.public_html_dir + "/" + config.gallery_dir, file), err => {
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



const APPID  = config.appID;
const KEY    = config.key;
const SECRET = config.secret;

var microgear = MicroGear.create({
    key : KEY,
    secret : SECRET
});

microgear.on('connected', function() {
    console.log('NETPIE Connected ...');
    microgear.setAlias("server");
});

microgear.on('message', function(topic,body) {
    
    let data = ""+body;
    
    console.log('NETPIE => Received : '+topic+' : '+data);
    
    // parse value !
    try {
        console.log(data);
        let sensor = parseInt(data.split(" ")[0]);
        let people = parseInt(data.split(" ")[1]);
        
        sensorValue = sensor;
        peopleValue = people;
        
        console.log("Parsed message => SENSOR:"+sensor+" PEOPLE:"+people)
    }
    catch(e) {
        console.log("Message parsing error",e);
    }
});

microgear.on('closed', function() {
    console.log('NETPIE Closed ...');
});

microgear.connect(APPID);