import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purseNumber = searchParams.get('purseNumber')
    
    if (!purseNumber) {
      return NextResponse.json({ error: 'Purse number is required' }, { status: 400 })
    }

    const client = await pool.connect()
    
    try {
      const result = await client.query(
        'SELECT selected_dept FROM feedback WHERE purse_number = $1',
        [purseNumber]
      )
      
      const submittedDepts = result.rows.map(row => row.selected_dept)
      
      return NextResponse.json({ submittedDepts })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error checking submissions:', error)
    return NextResponse.json({ error: 'Failed to check submissions' }, { status: 500 })
  }
}
