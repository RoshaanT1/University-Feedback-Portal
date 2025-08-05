import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const client = await pool.connect()
    
    try {
      const result = await client.query(
        'SELECT key, name, criteria FROM departments ORDER BY name'
      )
      
      // Transform to match frontend format
      const departments: Record<string, { name: string; criteria: string[] }> = {}
      
      result.rows.forEach(row => {
        departments[row.key] = {
          name: row.name,
          criteria: row.criteria
        }
      })
      
      return NextResponse.json(departments)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}
