#!/bin/bash

NVM_DIR="/home/snutt/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
SNUTT_DATA_PATH="/home/snutt/snutt/data/snutt"

ruby $SNUTT_DATA_PATH/fetch.rb 2016 2
node $SNUTT_DATA_PATH/import_txt.js 2016 2
pm2 restart /home/snutt/snutt/run_snutt.js
