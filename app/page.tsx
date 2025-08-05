"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FeedbackForm from "@/components/feedback-form"
import AnalyticsDashboard from "@/components/analytics-dashboard"

// You can also set page-specific metadata if needed
// export const metadata = {
//   title: "Feedback & Analytics | University Feedback System",
//   description: "Submit feedback and view analytics for university departments"
// }

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">University Feedback System</h1>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">University Feedback System</h1>
          <p className="text-lg text-gray-600">Share your feedback and view department analytics</p>
        </div>

        <Tabs defaultValue="feedback" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="feedback">Submit Feedback</TabsTrigger>
            <TabsTrigger value="analytics">View Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Department Feedback Form</CardTitle>
                <CardDescription>
                  Please fill out your details and select a department to provide feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeedbackForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
