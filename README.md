# snutt
SNU Timetable

## Requirements
* mongodb >= 2.6
* node >= 4.2
* ruby >= 2.1.0

## Deploying

`pm2`로 실행하기 전에 다음 환경 변수가 설정되어 있는지 확인하세요. 홈 폴더에 `.snuttrc` 파일을 만들어서 `.*shrc`와 같은 shell 설정 파일에서 `source` 하는 것을 추천합니다. **아래 변수가 저장된 파일의 권한을 반드시 600으로 설정하세요**.
```
export SNUTT_HOST=localhost
export SNUTT_PROTOCOL=http
export SNUTT_PORT=12000
export SNUTT_EMAIL=snutt@wafflestudio.com
export SNUTT_SECRET=PleaseChangeThisSecret
export SNUTT_FCM_API_KEY=PleaseChangeThisKey
export SNUTT_FCM_PROJECT_ID=PleaseChangeThisID
```

`pm2` 앞단에 `nginx`를 프록시로 붙여 연결하면, 손쉽게 https를 설정할 수 있습니다. 또 `nodejs`에서 발생할 수 있는 잠재적인 버퍼 오버플로우를 예방할 수 있습니다.

아래 스크립트를 통해 필요 패키지를 설치하고, 2017년 1학기 수강편람을 불러온 후 pm2 watchdog을 실행합니다.
```sh
$ sudo apt-get install mongodb nodejs nodejs-legacy libkrb5-dev ruby ruby-dev gem zip
$ sudo gem install roo roo-xls
$ sudo npm install pm2 -g
$ git clone https://github.com/wafflestudio/snutt.git && cd snutt
$ git checkout express
$ npm install
$ npm run build && npm test
$ cd data
$ ruby fetch.rb 2017 1
$ node import_txt 2017 1
$ cd ..
$ pm2 start app.js --name snuttapi
```

서버 배포판의 공식 repository에서 위 requirements에 해당하는 패키지 버전을 지원하지 않는다면, `rvm`, `nvm` 등을 이용하거나 다른 repository에서 설치해야 합니다. 

## API Keys
먼저 환경변수에 secret이 잘 입력되었는지 확인하세요.
```sh
$ node config/apiKey list
```

## cron job (매일 실행 추천)
```sh
$ node ~/snutt/data/update_recent
```
