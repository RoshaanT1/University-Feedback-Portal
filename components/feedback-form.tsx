"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { API_ENDPOINTS, apiRequest, buildApiUrl } from "@/lib/api-config"

interface DepartmentConfig {
  [key: string]: { name: string; criteria: string[] };
}

export default function FeedbackForm() {
  const [formData, setFormData] = useState({ name: "", department: "", purseNumber: "" })
  const [selectedDept, setSelectedDept] = useState("")
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState("")
  const [departmentConfig, setDepartmentConfig] = useState<DepartmentConfig>({})
  const [loading, setLoading] = useState(true)
  const [existingSubmissions, setExistingSubmissions] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiRequest(API_ENDPOINTS.DEPARTMENTS)
        if (response.ok) {
          setDepartmentConfig(await response.json())
        }
      } catch (error) {
        console.error('Error loading departments:', error)
        toast({ title: "Error", description: "Failed to load departments", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const checkSubmissions = async () => {
      if (formData.purseNumber) {
        try {
          const url = buildApiUrl(API_ENDPOINTS.CHECK_SUBMISSIONS, { purseNumber: formData.purseNumber })
          const response = await apiRequest(url)
          if (response.ok) {
            const data = await response.json()
            setExistingSubmissions(data.submittedDepts || [])
          }
        } catch (error) {
          console.error('Error checking submissions:', error)
          setExistingSubmissions([])
        }
      } else {
        setExistingSubmissions([])
      }
    }
    checkSubmissions()
  }, [formData.purseNumber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.department || !formData.purseNumber || !selectedDept) {
      return toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" })
    }

    const deptCriteria = departmentConfig[selectedDept]?.criteria || []
    const missingRatings = deptCriteria.filter((criteria) => !ratings[criteria])

    if (missingRatings.length > 0) {
      return toast({ title: "Incomplete Ratings", description: "Please rate all criteria before submitting", variant: "destructive" })
    }

    try {
      const response = await apiRequest(API_ENDPOINTS.FEEDBACK, {
        method: 'POST',
        body: JSON.stringify({
          feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...formData, selectedDept, ratings, comments
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          return toast({ title: "Duplicate Submission", description: result.error, variant: "destructive" })
        }
        throw new Error(result.error || 'Failed to submit feedback')
      }

      toast({ title: "Feedback Submitted", description: "Thank you for your valuable feedback!" })
      
      // Reset form
      setFormData({ name: "", department: "", purseNumber: "" })
      setSelectedDept("")
      setRatings({})
      setComments("")
      setExistingSubmissions([])

    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({ title: "Submission Failed", description: "Failed to submit feedback. Please try again.", variant: "destructive" })
    }
  }

  const selectedDeptConfig = selectedDept ? departmentConfig[selectedDept] : null

  // Check if all required personal information is filled
  const isPersonalInfoComplete = formData.name.trim() !== "" && 
                                 formData.department.trim() !== "" && 
                                 formData.purseNumber.trim() !== ""

  // Clear department selection if personal info becomes incomplete
  useEffect(() => {
    if (!isPersonalInfoComplete && selectedDept) {
      setSelectedDept("")
      setRatings({})
    }
  }, [isPersonalInfoComplete, selectedDept])

  // Prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading departments...</div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "name", label: "Full Name *", placeholder: "Enter your full name", value: formData.name },
          { id: "department", label: "Your Department *", placeholder: "e.g., Computer Science", value: formData.department },
          { id: "purseNumber", label: "Purse Number *", placeholder: "Enter your purse number", value: formData.purseNumber }
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              value={field.value}
              onChange={(e) => setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))}
              placeholder={field.placeholder}
              required
            />
          </div>
        ))}
      </div>

      {/* Department Selection */}
      <div className="space-y-2">
        <Label htmlFor="feedback-dept">Select Department for Feedback *</Label>
        {!isPersonalInfoComplete && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-700">
              ⚠️ Please fill in all your personal information above before selecting a department
            </div>
          </div>
        )}
        <Select 
          value={selectedDept} 
          onValueChange={setSelectedDept}
          disabled={!isPersonalInfoComplete}
        >
          <SelectTrigger className={!isPersonalInfoComplete ? "opacity-50 cursor-not-allowed" : ""}>
            <SelectValue placeholder={
              !isPersonalInfoComplete 
                ? "Complete your info first..." 
                : "Choose a department to provide feedback"
            } />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(departmentConfig).map(([key, config]) => {
              const hasSubmitted = existingSubmissions.includes(key)
              return (
                <SelectItem key={key} value={key} disabled={hasSubmitted} className={hasSubmitted ? "opacity-50" : ""}>
                  <div className="flex items-center justify-between w-full">
                    <span>{config.name}</span>
                    {hasSubmitted && <span className="text-xs text-green-600 ml-2">✓ Submitted</span>}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        
        {existingSubmissions.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800"><strong>✓ You have already submitted feedback for:</strong></div>
            <ul className="text-sm text-green-700 mt-1">
              {existingSubmissions.map(deptKey => (
                <li key={deptKey} className="ml-4">• {departmentConfig[deptKey]?.name || deptKey}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Rating Criteria */}
      {selectedDeptConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Rate {selectedDeptConfig.name}</CardTitle>
            <CardDescription>
              Please rate each aspect on a scale of 1-10 where:
              <span className="block mt-1">
                <span className="text-green-600 font-medium">Good (8-10)</span> •
                <span className="text-yellow-600 font-medium"> Average (5-7)</span> •
                <span className="text-red-600 font-medium"> Poor (1-4)</span>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 p-3 text-left font-medium">Criteria</th>
                    <th className="border border-gray-300 p-2 text-center font-medium" colSpan={2}>Excellent</th>
                    <th className="border border-gray-300 p-2 text-center font-medium" colSpan={2}>Good</th>
                    <th className="border border-gray-300 p-2 text-center font-medium" colSpan={2}>Average</th>
                    <th className="border border-gray-300 p-2 text-center font-medium" colSpan={4}>Poor</th>
                  </tr>
                  <tr className="bg-blue-500 text-white text-sm">
                    <th className="border border-gray-300 p-2"></th>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                      <th key={num} className="border border-gray-300 p-2">{num}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDeptConfig.criteria.map((criteria, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 p-3 font-medium text-sm">
                        {index + 1}. {criteria}
                      </td>
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((rating) => (
                        <td key={rating} className="border border-gray-300 p-2 text-center">
                          <input
                            type="radio"
                            name={`criteria-${index}`}
                            value={rating}
                            checked={ratings[criteria] === rating}
                            onChange={() => setRatings((prev) => ({ ...prev, [criteria]: rating }))}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <div className="font-medium mb-2">Rating Scale:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { color: "green", label: "Excellent (10-9)" },
                  { color: "blue", label: "Good (8-7)" },
                  { color: "yellow", label: "Average (6-5)" },
                  { color: "red", label: "Poor (4-1)" }
                ].map((scale, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 bg-${scale.color}-500 rounded`}></div>
                    <span>{scale.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Comments */}
      {selectedDeptConfig && (
        <div className="space-y-2">
          <Label htmlFor="comments">Additional Comments (Optional)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share any additional feedback or suggestions..."
            rows={4}
          />
        </div>
      )}

      <Button type="submit" className="w-full" size="lg">Submit Feedback</Button>
    </form>
  )
}
