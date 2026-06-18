const headers = {
    'Access-Control-Allow-Origin': `*`,
}

const CO2_TREND_URL = `https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_trend_gl.txt`

// Kept identical to the old Netlify deployment so existing clients don't need to change.
const FUNCTION_PATH = `/.netlify/functions/getCO2`

export default {
    async fetch(request) {
        if (new URL(request.url).pathname !== FUNCTION_PATH) {
            return new Response(null, { status: 404, headers })
        }
        if (request.method === `OPTIONS`) { // CORS preflight
            return new Response(null, { status: 204, headers })
        }
        if (request.method !== `GET`) {
            return new Response(null, { status: 405, headers })
        }

        const response = await fetch(CO2_TREND_URL)
        if (!response.ok) {
            return new Response(null, { status: 502, headers })
        }
        const string = await response.text()

        // Parse string
        const dates = {}
        string.split(`\n`).filter(line => !line.startsWith(`#`)).forEach(line => {
            const regexResult = /^ *?([0-9]+) *?([0-9]+) *?([0-9]+) *?([0-9.]+) *?([0-9.]+) *?$/.exec(line)
            if (regexResult) {
                const year = Number(regexResult[1])
                const month = Number(regexResult[2])
                const day = Number(regexResult[3])
                const cycle = Number(regexResult[4])
                const trend = Number(regexResult[5])
                dates[`${padWithZeroes(year, 4)}-${padWithZeroes(month, 2)}-${padWithZeroes(day, 2)}`] = { cycle, trend }
            }
        })

        return new Response(JSON.stringify(dates), {
            status: 200,
            headers: { ...headers, 'Content-Type': `application/json` },
        })
    }
}

function padWithZeroes(n, minLength) {
    n = n.toString()
    while (n.length < minLength) {
        n = `0` + n
    }
    return n
}
