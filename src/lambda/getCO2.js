const headers = {
    'Access-Control-Allow-Origin' : `*`
}

const PromiseFtp = require(`promise-ftp`)
const ftp = new PromiseFtp()

exports.handler = async (event, context, callback) => {
    if (event.httpMethod === `OPTIONS`) { // The browser is checking the function to see the headers (called 'preflight' I think)
        callback(null, {statusCode: 204, headers})
    }
    if (event.httpMethod !== `GET`) {
        callback({statusCode: 405, headers}, null)
    }
    // ftp://aftp.cmdl.noaa.gov/products/trends/co2/co2_trend_gl.txt
    return ftp.connect({host: `aftp.cmdl.noaa.gov`})
    .then(serverMessage => {
        console.log('Server message: '+serverMessage)
        return ftp.get(`/products/trends/co2/co2_trend_gl.txt`)
    }).then(stream => streamToString(stream)).then(string => {
        ftp.end()
        callback(null, {statusCode: 204, body: string, headers})
    });
}

function streamToString (readableStream) {
    return new Promise((resolve, reject) => {
        let data = ``

        readableStream.on('readable', function() {
            let chunk = readableStream.read()
            while (chunk) {
                data += chunk
                chunk = readableStream.read()
            }
        })
        
        readableStream.on('end', function() {
            resolve(data)
        })
    })
}