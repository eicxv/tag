import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const REGION = "eu-central-1";
const ddbClient = new DynamoDBClient({ region: REGION });

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
      Date: { S: "2012-09-17" },
      SessionId: "b09d065d",
    },
  };

  try {
    await ddbClient.send(new PutItemCommand(params));
    return success(params.Item);
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
};
