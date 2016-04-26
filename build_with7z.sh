#!/usr/bin/env bash

rm build_output/output.zip

7z a -tzip build_output/output.zip * \
-x!README.md \
-x!.gitignore \
-x!.git \
-x!build_output \
-x!build_with7z.sh \
-x!output.zip.*

rm output.zip.*