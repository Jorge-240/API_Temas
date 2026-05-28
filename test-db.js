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
        const res = await client.query('SELECT max(id) FROM public.tema');
        console.log('Max ID:', res.rows[0].max);

        // Reset sequence for GENERATED ALWAYS AS IDENTITY
        const fix = await client.query(`
      SELECT setval(pg_get_serial_sequence('public.tema', 'id'), COALESCE(max(id), 0) + 1, false)
      FROM public.tema;
    `);
        console.log('Reset sequence result:', fix.rows);

        const testInsert = await client.query('INSERT INTO public.tema (nombre_tema) VALUES ($1) RETURNING id', ['Autofix Test']);
        console.log('Test insert ID:', testInsert.rows[0].id);

        // Clean up our test insert
        await client.query('DELETE FROM public.tema WHERE id = $1', [testInsert.rows[0].id]);
        console.log('Cleaned up test row.');

    } catch (err) {
        console.error('Error:', err.message);
    }

    await client.end();
}
test();
