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

app.get('/sensor', (req, res) => {
    // Return sensor value
    console.log("Get sensor");
    netpie_getMessage("sensor", resp => {
        let parsedResp = JSON.parse(resp);
        try {
            res.send(parsedResp[0].payload);
        }
        catch(e) {
            console.log("Error: Can't get sensor value");
            res.send('Error');
        }
    });
});

app.get('/sensor_post', (req, res) => {
    let value = req.query.value;
    console.log("Put sensor "+value);
    netpie_putMessage("sensor", value,resp => {
        console.log(resp,resp.message);
        res.send(resp.message);
    });
});

app.get('/peopleCount', (req, res) => {
    // Return sensor value
    console.log("Get peopleCount");
    netpie_getMessage("peopleCount", resp => {
        let parsedResp = JSON.parse(resp);
        try {
            res.send(parsedResp[0].payload);
        }
        catch(e) {
            console.log("Error: Can't get people count");
            res.send('Error');
        }
    });
});

app.get('/peopleCount_post', (req, res) => {
    let value = req.query.value;
    console.log("Put peopleCount "+value);
    netpie_putMessage("peopleCount", value,resp => {
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
    console.log('Microgear Connected...');
    microgear.setAlias("server");
    /*setInterval(function() {
        microgear.chat('server', 'Hello world.');
    },1000);*/
});

microgear.on('message', function(topic,body) {
    console.log('Microgear => incoming : '+topic+' : '+body);
});

microgear.on('closed', function() {
    console.log('Microgear Closed...');
});

microgear.connect(APPID);