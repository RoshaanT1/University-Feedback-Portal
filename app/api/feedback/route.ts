import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      feedbackId, 
      name, 
      department, 
      purseNumber, 
      selectedDept, 
      ratings, 
      comments 
    } = body

    const client = await pool.connect()
    
    try {
      // Check for duplicate submission
      const duplicateCheck = await client.query(
        'SELECT id FROM feedback WHERE purse_number = $1 AND selected_dept = $2',
        [purseNumber, selectedDept]
      )
      
      if (duplicateCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Feedback already submitted for this department with this purse number' }, 
          { status: 409 }
        )
      }

      // Insert feedback
      const result = await client.query(
        `INSERT INTO feedback 
         (feedback_id, name, department, purse_number, selected_dept, ratings, comments) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [feedbackId, name, department, purseNumber, selectedDept, JSON.stringify(ratings), comments]
      )
      
      return NextResponse.json({ 
        success: true, 
        id: result.rows[0].id,
        message: 'Feedback submitted successfully'
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purseNumber = searchParams.get('purseNumber')
    
    const client = await pool.connect()
    
    try {
      let query = 'SELECT * FROM feedback ORDER BY created_at DESC'
      let params: string[] = []
      
      if (purseNumber) {
        query = 'SELECT * FROM feedback WHERE purse_number = $1 ORDER BY created_at DESC'
        params = [purseNumber]
      }
      
      const result = await client.query(query, params)
      
      // Transform data to match frontend format
      const feedback = result.rows.map(row => ({
        id: row.feedback_id,
        name: row.name,
        department: row.department,
        purseNumber: row.purse_number,
        selectedDept: row.selected_dept,
        ratings: row.ratings,
        comments: row.comments,
        timestamp: row.timestamp.toISOString()
      }))
      
      return NextResponse.json(feedback)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
