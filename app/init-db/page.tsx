"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { API_ENDPOINTS, apiRequest } from '@/lib/api-config'

export default function InitDatabase() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setMessage('')
    setIsError(false)

    try {
      const response = await apiRequest(API_ENDPOINTS.INIT_DB, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('Database initialized successfully! You can now use the feedback system.')
        setIsError(false)
      } else {
        setMessage(`Error: ${result.error || 'Failed to initialize database'}`)
        setIsError(true)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
      setIsError(true)
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-lg text-gray-600">Initialize your feedback system database</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Initialization</CardTitle>
            <CardDescription>
              This will create the necessary tables and seed initial departments in your PostgreSQL database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What will be created:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>departments</strong> table - Stores department configurations</li>
                <li>• <strong>feedback</strong> table - Stores user feedback submissions</li>
                <li>• Initial department data (Library, Student Affairs, Registrar, etc.)</li>
                <li>• Unique constraints to prevent duplicate submissions</li>
              </ul>
            </div>

            <Button 
              onClick={initializeDatabase} 
              disabled={isInitializing}
              className="w-full"
              size="lg"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Database'}
            </Button>

            {message && (
              <div className={`p-4 rounded-lg border ${
                isError 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                <p className="font-medium">{isError ? 'Error' : 'Success'}</p>
                <p className="text-sm mt-1">{message}</p>
              </div>
            )}

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Only run this once when setting up your system for the first time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
