package:
    vsce package
    mv *.vsix ./vsix/

build:
    vsce package
    mv *.vsix ./vsix/

publish:
    vsce publish

npm-doctor:
    npm doctor # check dependencies
    npm prune # remove unused dependencies
    npx depcheck # check dependencies
    npm-check # check dependencies


npm-outdated:
    npm outdated
    npx npm-check-updates
    # "@aws-sdk/client-dynamodb": "^3.750.0",

npm-update:
    npm update

npm-install:
    rm -rf node_modules package-lock.json
    npm install
    npx tsc --noEmit

list-dynamodb:
    aws --endpoint-url=http://localhost:4566 \
    dynamodb list-tables

# describe-table
# create-table
# delete-table
# delete-item
# describe-table
# get-item
# put-item
# query
# scan
# update-item

add-dynamodb:
    aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --attribute-definitions '[{"AttributeName":"pk", "AttributeType":"S"}, {"AttributeName":"sk", "AttributeType":"S"}]' \
    --table-name my-table \
    --key-schema '[{"AttributeName":"pk", "KeyType":"HASH"}, {"AttributeName":"sk", "KeyType":"RANGE"}]' \
    --provisioned-throughput '{"ReadCapacityUnits": 10, "WriteCapacityUnits": 10}'

    # "TableArn": "arn:aws:dynamodb:us-east-1:000000000000:table/my-table",
    # "TableId": "a97442f2-3b29-434d-9df6-46264862909d",

describe-dynamodb:
    aws --endpoint-url=http://localhost:4566 \
    dynamodb describe-table \
    --table-name my-table