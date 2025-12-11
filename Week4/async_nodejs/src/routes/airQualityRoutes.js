const airQuality = require('express').Router();
const bodyParser = require('body-parser');
const { airQualityCallback, airQualityPromise } = require('../controller/airQualityController');

// Middleware
airQuality.use(bodyParser.json());
airQuality.use(bodyParser.urlencoded({ extended: false }));

// Helper function to create API options for a city
const createOptions = (city) => ({
    method: 'GET',
    url: 'https://air-quality-by-api-ninjas.p.rapidapi.com/v1/airquality',
    params: { city }, // Pass city as query param
    headers: {
        'x-rapidapi-key': "55f2ec597amsh3e0401b263efb44p15127cjsna2d3eb05b615",
        'x-rapidapi-host': 'air-quality-by-api-ninjas.p.rapidapi.com'
    }
});

/**
 * ---------------- Callback Hell Example ----------------
 * Demonstrates multiple nested callbacks
 */
airQuality.get('/:city/callback', (req, res) => {
    const city = req.params.city;
    const options = createOptions(city);

    airQualityCallback(options, (err, result1) => {
        if (err) return res.status(500).json({ error: 'Error fetching air quality data' });

        airQualityCallback(options, (err, result2) => {
            if (err) return res.status(500).json({ error: 'Error fetching air quality data' });

            airQualityCallback(options, (err, result3) => {
                if (err) return res.status(500).json({ error: 'Error fetching air quality data' });

                // Respond with results of all three calls
                return res.json({
                    firstCall: result1,
                    secondCall: result2,
                    thirdCall: result3
                });
            });
        });
    });
});

/**
 * ---------------- Promise Example ----------------
 * Demonstrates chaining promises without callback hell
 */
airQuality.get('/:city/promise', (req, res) => {
    const city = req.params.city;
    const options = createOptions(city);

    airQualityPromise(options)
        .then(result1 => airQualityPromise(options)
            .then(result2 => airQualityPromise(options)
                .then(result3 => res.json({
                    firstCall: result1,
                    secondCall: result2,
                    thirdCall: result3
                }))
            )
        )
        .catch(error => res.status(500).json({ error, errorMsg: 'Error fetching air quality data' }));
});

/**
 * ---------------- Async/Await Example ----------------
 * Cleaner approach than promise chaining
 */
airQuality.get('/:city/async-await', async (req, res) => {
    const city = req.params.city;
    const options = createOptions(city);

    try {
        const result1 = await airQualityPromise(options);
        const result2 = await airQualityPromise(options);
        const result3 = await airQualityPromise(options);

        return res.json({
            firstCall: result1,
            secondCall: result2,
            thirdCall: result3
        });
    } catch (error) {
        return res.status(500).json({ error, errorMsg: 'Error fetching air quality data' });
    }
});

/**
 * ---------------- Promise.all Example ----------------
 * Fetch air quality for multiple cities in parallel
 */
airQuality.get('/all', async (req, res) => {
    const cities = ['invaliod21', 'Los Angeles', 'New York', 'Chicago'];

    try {
        // Wait for all promises to complete
        const results = await Promise.all(cities.map(city => airQualityPromise(createOptions(city))));
        return res.json({ cities, data: results });
    } catch (error) {
        return res.status(500).json({ error, errorMsg: 'Error fetching air quality data' });
    }
});

/**
 * ---------------- Promise.any Example ----------------
 * Returns the first successful promise
 */
airQuality.get('/any', async (req, res) => {
    const cities = ['Invalid123', 'New York', 'Chicago'];

    try {
        // Returns first fulfilled promise, ignores rejected ones
        const result = await Promise.any(cities.map(city => airQualityPromise(createOptions(city))));
        return res.json({ cities, data: result });
    } catch (error) {
        return res.status(500).json({ error, errorMsg: 'Error fetching air quality data' });
    }
});

/**
 * ---------------- Promise.race Example ----------------
 * Returns the result of the first promise that settles (fulfilled or rejected)
 */
airQuality.get('/race', async (req, res) => {
    const cities = ['New York', 'Los Angeles', 'Chicago'];
    const promises = cities.map(city => airQualityPromise(createOptions(city)));

    try {
        const firstResult = await Promise.race(promises);
        return res.json({ firstResult });
    } catch (error) {
        return res.status(500).json({ error, errorMsg: 'Error fetching air quality data' });
    }
});

module.exports = airQuality;