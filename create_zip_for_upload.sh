#!/usr/bin/env bash

mkdir build_output
rm build_output/output.zip

cd extension
zip -r ../build_output/output.zip *
cd ..