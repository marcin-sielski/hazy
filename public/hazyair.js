var gTypes;
var gType;
var gPeriod = 'day';

function uppercase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

/*global fetch*/
function fetchRetry(url, n, timeout) {
    return fetch(url).catch(function(error) {
        if (n === 1) throw error;
        return new Promise(function(resolve) {
            setTimeout(resolve, timeout);
        }).then(function() {
            return fetchRetry(url, n - 1, timeout);  
        });
    });
}

/*global c3*/
/*global d3*/

function hazyair(type, period) {
    
    if (type === null) {
        type = gType;
    } else {
        gType = type;
    }
    if (period === null) {
        period = gPeriod;
    } else {
        gPeriod = period;
    }
    
    gTypes.forEach(function(type) {
        document.getElementById(type.parameter).classList.remove('active');
    });
    document.getElementById(type).className += ' active'; 
    
    document.getElementById('day').classList.remove('active');
    document.getElementById('week').classList.remove('active');
    document.getElementById('month').classList.remove('active');
    document.getElementById('year').classList.remove('active');
    document.getElementById(period).className += ' active';
    
    if (type === 'dust') {
    
        var pm100limit = 40;
        var pm25limit = 25;
        if (period === 'year') {
            pm100limit = 20;
            pm25limit = 10;
        }

        fetchRetry('hazyair/dust/last?'+period, 60, 1000).then(function(response) {
            
            return response.json();
            
        }).then(function(data) {
            
            if (data.length > 0) {
                var columns = [];
                var map = {};
                var x = ['x'];
                var mean = {};
                var lines = [];
                if (data[0].hasOwnProperty('concentration_pm1.0_normal')) {
                    columns.push(['PM 1.0']);
                    map['PM 1.0'] = 'concentration_pm1.0_normal';
                    mean['PM 1.0'] = 0;
                }
                if (data[0].hasOwnProperty('concentration_pm2.5_normal')) {
                    columns.push(['PM 2.5']);
                    map['PM 2.5'] = 'concentration_pm2.5_normal';
                    mean['PM 2.5'] = 0;
                }
                if (data[0].hasOwnProperty('concentration_pm10_normal')) {
                    columns.push(['PM 10']);
                    map['PM 10'] = 'concentration_pm10_normal';
                    mean['PM 10'] = 0;
                }
                data.forEach(function(record) {
                    x.push(record.timestamp);
                    columns.forEach(function(column) {
                        var value = record[map[column[0]]].value;
                        column.push(value);
                        mean[column[0]] += value;
                    });
                });
                columns.unshift(x);
                lines.push({ value: pm25limit, text: 'PM 2.5 Limit ('+pm25limit+')', position: 'start' });
                lines.push({ value: pm100limit, text: 'PM 10 Limit ('+pm100limit+')', position: 'start' });
                Object.keys(mean).forEach(function(item) {
                    var value = round(mean[item]/data.length,0);
                    lines.push({ value: value, text: item+' Mean ('+value+')', position: 'middle' });
                });

                document.getElementById('chart').className = 'c3-title';
                    
                c3.generate({
                    bindto: '#chart',
                        data: {
                        x: 'x',
                        columns: columns,
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                format: '%H:%M %d-%m-%Y',
                                rotate: 15
                            },
                            label: 'time'
                        },
                        y: {
                            label: 'µg/m^3'
                        }
                    },
                    subchart: {
                        show: true
                    },
                    size: {
                        height: 480
                    },
                    grid: {
                        y: {
                            lines: lines
                        }
                    }
                });
            } else {

                document.getElementById('chart').className = 'c3-title hazyair-color';
                document.getElementById('chart').innerHTML = 'No data to display';

            }
        }).catch(function(error) {
            
            document.getElementById('chart').className = 'c3-title hazyair-color';
            document.getElementById('chart').innerHTML = error;

        });
            
    } else {
        
        fetchRetry('hazyair/'+type+'/last?'+period, 60, 1000).then(function(response) {
            
            return response.json();
            
        }).then(function(data) {
            var x = ['x'];
            var serie = [uppercase(type)];
            var mean = 0;
            var precision = 0;
            if (type == 'temperature') {
                precision = 1;
            }
            if (data.length > 0) {
                data.forEach(function(record) {
                    x.push(record.timestamp);
                    serie.push(record[type].value);
                    mean += record[type].value;
                });
                mean = round(mean/data.length, precision);
                 
                document.getElementById('chart').className = 'c3-title';

                c3.generate({
                    bindto: '#chart',
                    data: {
                        x: 'x',
                        columns: [
                            x,
                            serie,
                        ],
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                format: '%H:%M %d-%m-%Y',
                                rotate: 15
                            },
                            label: 'time'
                        },
                        y: {
                            tick: {
                                format: d3.format('.' + precision + 'f'),  
                            },
                            label: data[0][type].unit
                        }
                    },
                    subchart: {
                        show: true
                    },
                    size: {
                        height: 480
                    },
                    grid: {
                        y: {
                            lines: [
                                { value: mean, text: uppercase(type) + ' Mean ('+mean+')', position: 'middle' }
                            ]
                        }
                    }
                });
            } else {

                document.getElementById('chart').className = 'c3-title hazyair-color';
                document.getElementById('chart').innerHTML = 'No data to display';
                
            }
        }).catch(function(error) {

            document.getElementById('chart').className = 'c3-title hazyair-color';
            document.getElementById('chart').innerHTML = error;

        });
    }
}

/*global EventSource*/
try {

    fetchRetry('hazyair/info', 60, 1000).then(function(response) {
        
        return response.json();
        
    }).then(function(data) {
        
        gTypes = data;
        gTypes.forEach(function(type) {
            document.getElementById("type").innerHTML += '<a id="'+type.parameter+
                '" class="nav-item nav-link" href="#" onclick="hazyair(this.id, null)">'+type.parameter+'</a>';
        });
        gType = gTypes[0].parameter;
        hazyair(gType, gPeriod);
        var source = new EventSource('hazyair/update');
        source.onmessage = function(message) {
            if (message.data === gType) {
                hazyair(gType, gPeriod);
            }
        };
        
    }).catch(function (error) {

        document.getElementById('chart').className = 'c3-title hazyair-color';
        document.getElementById('chart').innerHTML = error;

    });

} catch (error) {

    document.getElementById('chart').className = 'c3-title hazyair-color';
    document.getElementById('chart').innerHTML = error;

}
