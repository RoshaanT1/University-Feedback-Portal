import { NextResponse } from 'next/server'
import { initializeDatabase, seedDepartments } from '@/lib/init-db'

export async function POST() {
  try {
    await initializeDatabase()
    await seedDepartments()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
