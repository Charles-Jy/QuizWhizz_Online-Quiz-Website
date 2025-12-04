import { db } from '../../../lib/db';

export async function GET(req) {
  const [rows] = await db.query('SELECT * FROM users');
  return new Response(JSON.stringify(rows), { status: 200 });
}

export async function POST(req) {
  const { name, email } = await req.json();
  await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
  return new Response(JSON.stringify({ message: 'User added' }), { status: 201 });
}
