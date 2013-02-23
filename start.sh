#! /bin/bash
export NODE_ENV=production
node_modules/.bin/forever start -o logs/out.log -e logs/err.log node_modules/.bin/nodemon --exitcrash app.js
