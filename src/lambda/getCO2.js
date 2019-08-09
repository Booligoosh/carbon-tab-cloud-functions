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
        console.log(string)

        // Parse string
        const dates = {}
        string.split(`\n`).filter(line => !line.startsWith(`#`)).forEach(line => {
            const regexResult = /^ *?([0-9]+) *?([0-9]+) *?([0-9]+) *?([0-9.]+) *?([0-9.]+) *?$/.exec(line)
            console.log(regexResult)
            if (regexResult) {
                const year = Number(regexResult[1])
                const month = Number(regexResult[2])
                const day = Number(regexResult[3])
                const cycle = Number(regexResult[4])
                const trend = Number(regexResult[5])
                dates[`${padWithZeroes(year, 4)}-${padWithZeroes(month, 2)}-${padWithZeroes(day, 2)}`] = {cycle,trend}
            }
        })

        ftp.end()
        callback(null, {statusCode: 200, body: JSON.stringify(dates), headers})
    });
}

function padWithZeroes (n, minLength) {
    n = n.toString()
    while (n.length < minLength) {
        n = `0` + n
    }
    return n
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