import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
dotenv.config()
const databaseUrl = process.env.DATABASE_URL as string
if(!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
}
const sql = neon(databaseUrl)
export default sql