#!/usr/bin/env bash

mkdir lib
mkdir fonts

cp bower_components/jquery/dist/jquery.min.js lib/jquery.min.js

cp bower_components/angular/angular.js lib/angular.js
cp bower_components/angular-route/angular-route.js lib/angular-route.js
cp bower_components/angular-sanitize/angular-sanitize.js lib/angular-sanitize.js

cp bower_components/font-awesome/css/font-awesome.min.css lib/font-awesome.min.css
cp bower_components/font-awesome/fonts/* fonts

cp bower_components/jsmediatags/dist/jsmediatags.min.js lib/jsmediatags.min.js

cp bower_components/ngInfiniteScroll/build/ng-infinite-scroll.min.js lib/ng-infinite-scroll.min.js
