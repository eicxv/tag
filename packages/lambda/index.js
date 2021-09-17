import crypto from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import parser from "ua-parser-js";
import geoip from "geoip-country";

const REGION = "eu-central-1";
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// const fn = (v) => v === undefined ? "" : v;
// Object.entries(obj).forEach(([key, val]) => (obj[key] = fn(val)));

const getCountry = (ip) => {
  return { country: geoip.lookup(ip).country };
};

const getAnonymousId = (ip, ua, domain, salt) => {
  const s = ip + ua + domain + salt;
  return { UserId: crypto.createHash("sha256").update(s).digest("base64") };
};

const getDate = () => {
  return { Date: new Date().toISOString().substr(0, 10) };
};

const getBrowserAndOs = (uaString) => {
  const ua = parser(uaString);
  return {
    Browser: ua.browser.name || "",
    BrowserVersion: ua.browser.version || "",
    Os: ua.os.name || "",
    OsVersion: ua.os.version || "",
  };
};

const getDeviceType = (width) => {
  const breakpoints = [576, 992, 1440, Infinity];
  const deviceNames = ["Mobile", "Tablet", "Laptop", "Desktop"];
  const i = breakpoints.find((bp) => width < bp);
  return { Device: deviceNames[i] };
};

const buildItem = (event) => {
  const ip = event.headers["x-forwarded-for"];
  const ua = event.headers["user-agent"];
  const body = JSON.parse(event.body);
  const salt = crypto.randomBytes(32).toString("base64"); // process.env.SALT
  const domain = "example.com";
  const item = {
    ...getDeviceType(body.width),
    ...getBrowserAndOs(ua),
    ...getAnonymousId(ip, ua, domain, salt),
    ...getDate(),
    EventName: body.eventName,
    Url: body.url,
    Referrer: body.referrer,
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
  const item = buildItem(event);
  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: "Analytics",
        item,
      })
    );
    return success({ status: true });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
};
