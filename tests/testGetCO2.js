require(`../src/lambda/getCO2`).handler({
    httpMethod: `GET`
}, {}, console.log)