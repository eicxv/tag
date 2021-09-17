import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

var geoip = require("geoip-country");

const REGION = "eu-central-1";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const success = (body) => {
  return buildResponse(200, body);
};

const failure = (body) => {
  return buildResponse(500, body);
};

const buildResponse = (statusCode, body) => ({
  statusCode: statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const params = {
    TableName: "Analytics",
    Item: {
      Date: "2012-09-18",
      SessionId: "b09d065d",
      Events: [{ Type: "Pageview" }],
    },
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return success(params.Item);
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
};
