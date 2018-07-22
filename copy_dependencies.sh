#!/usr/bin/env bash

LIB_PATH=extension/lib
FONTS_PATH=extension/fonts

mkdir $LIB_PATH
mkdir $FONTS_PATH

cp bower_components/jquery/dist/jquery.min.js $LIB_PATH/jquery.min.js

cp bower_components/angular/angular.js $LIB_PATH/angular.js
cp bower_components/angular-route/angular-route.js $LIB_PATH/angular-route.js
cp bower_components/angular-sanitize/angular-sanitize.js $LIB_PATH/angular-sanitize.js
cp bower_components/angular-drag-and-drop-lists/angular-drag-and-drop-lists.min.js $LIB_PATH/angular-drag-and-drop-lists.min.js
cp bower_components/podStationNGReuse/dist/podStationNGReuse.min.js $LIB_PATH/podStationNGReuse.min.js

cp bower_components/font-awesome/css/font-awesome.min.css $LIB_PATH/font-awesome.min.css
cp bower_components/font-awesome/fonts/* $FONTS_PATH

cp bower_components/jsmediatags/dist/jsmediatags.js $LIB_PATH/jsmediatags.js

cp bower_components/ngInfiniteScroll/build/ng-infinite-scroll.min.js $LIB_PATH/ng-infinite-scroll.min.js
