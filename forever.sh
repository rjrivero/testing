#!/bin/bash

. ./setenv.sh

while true; do
  git pull
  npm -d install
  if ! node app.js; then
    sleep 60
  fi
done

