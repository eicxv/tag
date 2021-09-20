import crypto from "crypto";
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

const client = new LambdaClient({ region: process.env.REGION });

const generateSalt = () => {
  return crypto.randomBytes(32).toString("base64");
};

export const handler = async () => {
  const params = {
    FunctionName: "log-analytics-event",
    Environment: { Variables: { SALT: generateSalt() } },
  };
  const command = new UpdateFunctionConfigurationCommand(params);
  try {
    await client.send(command);
  } catch (error) {
    console.log(error);
  }
};
