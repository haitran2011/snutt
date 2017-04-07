# snutt
SNU Timetable

## Requirements
* mongodb >= 2.6
* node >= 4.2
* ruby >= 2.1.0

## Deploying

See to it that following variables are set for pm2. I recommend you to create a `.snuttrc` file and source it from your `.*shrc` file. **PLEASE SET PERMISSION OF YOUR `.snuttrc` OR ANY METHOD OF VARIABLE STORAGE AS 600**.
```
export SNUTT_HOST=localhost
export SNUTT_PROTOCOL=http
export SNUTT_PORT=12000
export SNUTT_EMAIL=snutt@wafflestudio.com
export SNUTT_SECRET=PleaseChangeThisSecret
export SNUTT_FCM_API_KEY=PleaseChangeThisKey
export SNUTT_FCM_PROJECT_ID=PleaseChangeThisID
```

You can use nginx proxy in front of pm2. In this way you can easily set up https using nginx configurations. Also you can prevent unknown buffer overflow vulnerability of nodejs.

Install dependencies and fetch 2017-1 course book, start pm2 watchdog.
```sh
$ sudo apt-get install mongodb nodejs nodejs-legacy libkrb5-dev ruby ruby-dev gem
$ sudo gem install roo roo-xls
$ git clone https://github.com/wafflestudio/snutt.git && cd snutt
$ git checkout express
$ npm install
$ npm test
$ cd data
$ mkdir xls
$ ruby fetch.rb 2017 1
$ node import_txt 2017 1
$ cd ..
$ sudo npm install pm2 -g
$ pm2 start app.js --name snuttapi
```

## API Keys
Make sure you have entered your secret.
```sh
$ node config/apiKey list
```

## cron job (daily recommended)
```sh
$ node ~/snutt/data/update_recent
```
