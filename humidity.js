'use strict';

const BME280 = require('./bme280');
const Database = require('./database');
const Cache = require('./cache');
const round = require('./round');

class Humidity {

    constructor(model, options = null) {

        this.model = model;
        if(this.model === 'BME280') {
            this.bme280 = new BME280(options);
        }
        this.database = new Database('humidity', 24 * 366);
        this.cache = new Cache(['last', 'mean']);
    
    }

    store() {
    
        return new Promise((resolve, reject) => {
            if(this.model === 'BME280') {
                this.bme280.humidity().then((data) => {
                    this.cache.clean();
                    this.database.store(data).then(() => {
                        return resolve(data);
                    }).catch((error) => {
                        return reject(error);
                    });
                }).catch((error) => {
                    return reject(error);
                });
            }
        });
    
    }

    info(request, response) {
    
        this.database.records().then((records) => {
            response.json({ 'records': records });
        });

    }

    current(request, response) {

        if(this.model === 'BME280') {
            this.bme280.humidity().then((data) => {
                response.json(data);
            }).catch((err) => {
                console.log(err);
                response.json('');
            });
        }

    }

    last(request, response) {
 
        let result = this.cache.read('last', request.query);
        if (result !== null) {
            response.json(result);   
        } else {
            result = [];
            this.database.find(Cache.timestamp(request.query), (record) => {
                result.unshift(record);
            }).then(() => {
                if (result.length) {
                    this.cache.write('last', request.query, result);
                }
                response.json(result);   
            }).catch((error) => {
                console.error(error);
                response.json('');   
            });
        }

    }

    mean(request, response) {

        let result = this.cache.read('mean', request.query);
        if (result !== null) {
            response.json(result);    
        } else {
            let divider = 0;
            this.database.find(Cache.timestamp(request.query), (record) => {
                if (result === null) {
                    result = record;
                } else {
                    result.humidity.value += record.humidity.value;
                }
                divider++;
            }).then(() => {
                if (result !== undefined && result !== null && divider) {
                    result.humidity.value = round(result.humidity.value/divider);
                    this.cache.write('mean', request.query, result);
                }
                response.json(result);    
            }).catch((error) => {
                console.error(error);
                response.json('');    
            });
        }

    }

    close() {
    
        return this.database.close();

    }
}

module.exports = Humidity;
