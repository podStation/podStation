#!/usr/bin/env bash

rm build_output/output.zip

cd extension
zip -r ../build_output/output.zip *
cd ..