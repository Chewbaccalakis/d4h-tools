import * as dotenv from 'dotenv'
import D4H from 'd4h-typescript'

dotenv.config()
const apiToken = process.env['apiToken']
if (!apiToken) {
    throw new Error('apiToken is not defined in the environment variables.');
}
const d4hInstance = new D4H(apiToken)
export { d4hInstance }