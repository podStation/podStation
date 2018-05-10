#!/usr/bin/env bash

rm build_output/output.zip

7z a -tzip build_output/output.zip * \
-x!README.md \
-x!docs \
-x!bower* \
-x!.gitignore \
-x!.git \
-x!node_modules \
-x!build_output \
-x!*.sh \
-x!output.zip.* \
-x!package.json \
-x!karma.conf.js \
-x!spec \
-x!*.log

rm output.zip.*