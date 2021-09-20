import crypto from "crypto";
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

const client = new LambdaClient({ region: process.env.REGION });

export const handler = async () => {
  let newSalt = crypto.randomBytes(32).toString("base64");

  const params = {
    FunctionName: "log-analytics-event",
    Environment: { Variables: { SALT: newSalt } },
  };
  const command = new UpdateFunctionConfigurationCommand(params);

  try {
    await client.send(command);
  } catch (error) {
    console.log(error);
  }
};
