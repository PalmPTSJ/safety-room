const express = require('express');
const app = express();
const path = require('path');
const nodeWebcam = require( "node-webcam" );

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/sensor', (req, res) => {
    // Example : sensor?value=1.0
    let sensorValue = req.query.value;
    console.log("Sensor value : "+sensorValue);
    res.send('OK '+sensorValue);
});

var webcam_opts = {
    width: 1280,
    height: 720,
    delay: 0,
    callbackReturn: "base64",
};
app.get('/webcam', (req, res) => {
    console.log("Webcam !")
    nodeWebcam.capture("test_picture", webcam_opts, function( err, data ) {
        console.log("Webcam captured !");
        res.send('<html><body><img src="'+data+'"></body></html>');
    });
});

app.listen(8080, () => console.log('Example app listening on port 8080!'));