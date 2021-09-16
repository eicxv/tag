exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({ s: 42 }),
  };
  return response;
};
