# hazyair - Dust concentration monitoring tool. 

```hazyair``` is a handy tool that enables to store measurments of the dust conectration in the air (PM1.0, PM2.5, PM10) to the simple database. It also visualizes the results on the charts tha are accessible from the web browsers.

## Configuration

```hazyair``` was orginally developed on Raspberry Pi Zero W but it should work on any version of Raspberry Pi. Supported dust sensors are avaialble under following [link](https://github.com/perfectworks/node-plantower).

## Installation

Make sure recent version of ```node``` is installed on the board. Raspberry Pi Zero W requires ARMv6 version of the binaries which must be downloaded from [nodejs.org](https://nodejs.org/en/download/) and installed in ```/usr/local/bin``` folder.

Install ```hazyair``` module.

```npm install hazyair```

Run board configuration script.

```npm run configure```

Deploy ```hazyair``` service.

```npm run deploy```

Run browser and open ```http://<ip_address>:8081```.
