import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import parser from "ua-parser-js";
import geoip from "geoip-country";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const getCountry = (ip) => {
  const geo = geoip.lookup(ip);
  return geo?.country || null;
};

const getAnonymousId = (ip, ua, domain, salt) => {
  const s = ip + ua + domain + salt;
  return crypto.createHash("sha256").update(s).digest("base64");
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const getDate = (timestamp) => {
  return timestamp.substr(0, 10);
};

const getUserAgentData = (uaString) => {
  const ua = parser(uaString);
  const b = ua.browser;
  const o = ua.os;
  return {
    browser: { Name: b.name || null, Version: b.version || null },
    os: { Name: o.name || null, Version: o.version || null },
  };
};

const getDeviceType = (width) => {
  if (!width) {
    return null;
  }
  const breakpoints = [576, 992, 1440, Infinity];
  const deviceNames = ["Mobile", "Tablet", "Laptop", "Desktop"];
  const i = breakpoints.findIndex((bp) => width < bp);
  return deviceNames[i];
};

const buildItem = (event) => {
  const domain = new URL(event.headers.origin).hostname;
  const ip = event.headers["x-forwarded-for"];
  const ua = event.headers["user-agent"];
  const body = JSON.parse(event.body);
  const timestamp = getTimestamp();
  body.event.Time = timestamp;
  const item = {
    date: getDate(timestamp),
    userId: getAnonymousId(ip, ua, domain, process.env.SALT),
    uaData: getUserAgentData(ua),
    country: getCountry(ip),
    device: getDeviceType(body.width),
    domain: domain,
    Event: body.event,
  };
  return item;
};

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
  if (event.requestContext.http.method === "OPTIONS") {
    return success({ status: true });
  }
  const item = buildItem(event);
  const params = {
    TableName: item.domain,
    Key: { UserId: item.userId, Date: item.date },
    UpdateExpression: `SET #e = list_append(if_not_exists(#e, :empty_list), :e),
           Browser = :b,
           Os = :o,
           Country = :c,
           Device = :d`,
    ExpressionAttributeValues: {
      ":e": [item.Event],
      ":empty_list": [],
      ":b": item.uaData.browser,
      ":o": item.uaData.os,
      ":c": item.country,
      ":d": item.device,
    },
    ExpressionAttributeNames: {
      "#e": "Events",
    },
    ReturnValues: "NONE",
  };
  try {
    await ddbDocClient.send(new UpdateCommand(params));
    return success({ status: true });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
};
