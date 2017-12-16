const express = require('express');
const app = express();
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/sensor', (req, res) => {
    // Example : sensor?value=1.0
    console.log("Sensor value : "+req.query.value);
    let sensorValue = req.query.value;
    res.send('OK '+sensorValue);
});

app.listen(8080, () => console.log('Example app listening on port 8080!'));