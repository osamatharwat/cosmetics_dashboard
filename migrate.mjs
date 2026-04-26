import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running migration: Adding productionCost column to products table...');
    
    // Check if column already exists
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'productionCost'`
    );
    
    if (rows.length > 0) {
      console.log('✓ Column productionCost already exists');
      return;
    }
    
    // Apply migration
    await connection.query(
      `ALTER TABLE \`products\` ADD \`productionCost\` decimal(10,2) DEFAULT '0'`
    );
    
    console.log('✓ Migration applied successfully: productionCost column added');
  } catch (error) {
    console.error('✗ Migration failed:', error?.message || error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
