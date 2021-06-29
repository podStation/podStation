#!/usr/bin/env bash

rm build_output/output.zip

7z a -tzip build_output/output.zip ./dist/* 

rm output.zip.*