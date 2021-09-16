import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "./ddb-client";

exports.handler = async (event) => {
  const params = {
    TableName: "Analytics",
    Item: {
      Date: "2012-09-16",
      SessionId: "b09d065d",
      Event: {
        v: 5,
        s: "st",
      },
    },
  };

  const run = async () => {
    try {
      const data = await ddbClient.send(new PutItemCommand(params));
      console.log(data);
      return data;
    } catch (err) {
      console.error(err);
    }
  };
  run();

  const response = {
    statusCode: 204,
  };
  return response;
};
