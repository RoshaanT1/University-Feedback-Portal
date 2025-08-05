import { pool } from './db'

export async function initializeDatabase() {
  const client = await pool.connect()
  
  try {
    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        criteria JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        feedback_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        purse_number VARCHAR(100) NOT NULL,
        selected_dept VARCHAR(50) NOT NULL,
        ratings JSONB NOT NULL,
        comments TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create unique constraint to prevent duplicate submissions
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_purse_dept 
      ON feedback (purse_number, selected_dept)
    `)

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function seedDepartments() {
  const client = await pool.connect()
  
  try {
    // Check if departments already exist
    const existingDepts = await client.query('SELECT COUNT(*) FROM departments')
    
    if (parseInt(existingDepts.rows[0].count) > 0) {
      console.log('Departments already exist, skipping seed')
      return
    }

    // Seed initial departments from JSON structure
    const departments = [
      {
        key: 'library',
        name: 'Library Services',
        criteria: [
          'Book availability and collection quality',
          'Staff helpfulness and knowledge',
          'Facility cleanliness and maintenance',
          'Study environment and noise levels',
          'Digital resources and computer access'
        ]
      },
      {
        key: 'student_affairs',
        name: 'Department of Student Affairs',
        criteria: [
          'Response time to student queries',
          'Staff professionalism and courtesy',
          'Problem resolution effectiveness',
          'Event organization and management',
          'Student support services quality'
        ]
      },
      {
        key: 'registrar',
        name: 'Registrar Office',
        criteria: [
          'Document processing speed',
          'Accuracy of academic records',
          'Staff knowledge of procedures',
          'Online portal functionality',
          'Communication clarity and timeliness'
        ]
      },
      {
        key: 'cafeteria',
        name: 'Cafeteria Services',
        criteria: [
          'Food quality and taste',
          'Hygiene and cleanliness standards',
          'Variety of menu options',
          'Pricing and value for money',
          'Service speed and staff behavior'
        ]
      },
      {
        key: 'transport',
        name: 'Transport Services',
        criteria: [
          'Bus punctuality and reliability',
          'Vehicle condition and safety',
          'Route coverage and accessibility',
          'Driver behavior and professionalism',
          'Fare structure and payment options'
        ]
      },
      {
        key: 'it_services',
        name: 'IT Services',
        criteria: [
          'Network connectivity and speed',
          'Software support and troubleshooting',
          'Hardware maintenance and availability',
          'Response time to technical issues',
          'User training and documentation'
        ]
      }
    ]

    for (const dept of departments) {
      await client.query(
        'INSERT INTO departments (key, name, criteria) VALUES ($1, $2, $3)',
        [dept.key, dept.name, JSON.stringify(dept.criteria)]
      )
    }

    console.log('Departments seeded successfully')
  } catch (error) {
    console.error('Error seeding departments:', error)
    throw error
  } finally {
    client.release()
  }
}
