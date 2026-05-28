const { Client } = require('pg');

async function test() {
    const client = new Client({
        host: 'aws-1-us-west-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.xngezbbtmbirpjxchaix',
        password: 'Un1s1m0n_2021',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tema'
    `);
        console.log('Columns:', res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    }

    await client.end();
}
test();
