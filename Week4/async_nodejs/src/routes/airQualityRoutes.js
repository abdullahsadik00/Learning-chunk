const airQuality = require('express').Router();
const bodyParser = require('body-parser');
const URLSearchParams = require('url-search-params');
const { airQualityCallback, airQualityPromise } = require('../controller/airQualityController');

airQuality.use(bodyParser.json());
airQuality.use(bodyParser.urlencoded({ extended: false }));

let baseUrl = 'https://api.openaq.org/v2/latest?';

airQuality.get('/:city/callback', (req, res) => {
    // let params = new URLSearchParams(req.params.city).toString();
    const city = req.params.city;
    const options = {
        method: 'GET',
        url: 'https://air-quality-by-api-ninjas.p.rapidapi.com/v1/airquality',
        params: { city: city },
        headers: {
            'x-rapidapi-key': "55f2ec597amsh3e0401b263efb44p15127cjsna2d3eb05b615",
            'x-rapidapi-host': 'air-quality-by-api-ninjas.p.rapidapi.com'
        }
    };

    airQualityCallback(options, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching air quality data' });
        } else {
            return res.json(result);
        }
    });
});

airQuality.get('/:city/promise', (req, res) => {
    // let params = new URLSearchParams(req.query).toString();
    // let url = baseUrl + params;
    const city = req.params.city;
    const options = {
        method: 'GET',
        url: 'https://air-quality-by-api-ninjas.p.rapidapi.com/v1/airquality',
        params: { city: city },
        headers: {
            'x-rapidapi-key': "55f2ec597amsh3e0401b263efb44p15127cjsna2d3eb05b615",
            'x-rapidapi-host': 'air-quality-by-api-ninjas.p.rapidapi.com'
        }
    };
    airQualityPromise(options)
        .then(result => {
            return res.json(result);
        })
        .catch(error => {
            return res.status(500).json({ error: 'Error fetching air quality data' });
        });
});

module.exports = airQuality;