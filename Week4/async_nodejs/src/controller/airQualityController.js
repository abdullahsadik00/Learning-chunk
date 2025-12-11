const { default: axios } = require('axios');

function airQualityCallback(url, callback) {
    axios.request(url)
        .then(response => {
            callback(null, response.data);
        })
        .catch(error => {
            callback(null, error);
        });
}

function airQualityPromise(url) {
    return new Promise((resolve, reject) => {
        axios.request(url)
            .then(response => {
                return resolve(response.data);
            })
            .catch(error => {
                return reject(error);
            });
    })
}

module.exports = {
    airQualityCallback,
    airQualityPromise
};