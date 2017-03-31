# snutt
SNU Timetable

## Requirements
* mongodb >= 2.6
* node >= 4.2

## Deploying

See to it that following variables are set
```
export SNUTT_HOST=localhost
export SNUTT_PROTOCOL=http
export SNUTT_PORT=12000
export SNUTT_EMAIL=snutt@wafflestudio.com
export SNUTT_SECRET=PleaseChangeThisSecret
```

```sh
$ sudo apt-get install mongodb nodejs nodejs-legacy libkrb5-dev
$ git clone https://github.com/wafflestudio/snutt.git && cd snutt
$ git checkout express
$ npm install
$ sudo npm install pm2 -g
$ pm2 start app.js --name snuttapi
```
