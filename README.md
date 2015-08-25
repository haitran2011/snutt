SNUTT
========

Time table web application for SNU

#### Instructions

- npm 의존성 설치
```sh
npm install
sudo npm install -g
```
- DB 입력(eg: 2015년 2학기)
```sh
mongod
cd data/snutt
ruby fetch.rb 2015 2
node import_txt.js 2015 2
```

- 실행
```sh
pm2 start run_snutt.js
```

#### License

SNUTT is available under the MIT license. See the LICENSE file for more info.

