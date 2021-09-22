#!/usr/bin/env bash

last_version_tag=$(git describe --tags --abbrev=0)
current_version=v$(cat ./package.json | jq -r ".version")

if [ $last_version_tag != $current_version ]
then
    echo "Version changed to" $current_version ", previous was" $last_version_tag
    export NEW_VERSION=$current_version
    echo "Creating new git tag"
    git tag $NEW_VERSION
    echo "Creating zip file for release"
    ./create_zip_for_upload.sh
else
	echo "Current version is the same as previous version:" $current_version 
fi