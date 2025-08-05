"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { API_ENDPOINTS, apiRequest } from "@/lib/api-config"

interface FeedbackData {
  id: number | string
  name: string
  department: string
  purseNumber: string
  selectedDept: string
  ratings: Record<string, number>
  comments: string
  timestamp: string
}

// Load department names dynamically from the same JSON file
const COLORS = {
  good: "#22c55e",
  average: "#eab308",
  poor: "#ef4444",
}

export default function AnalyticsDashboard() {
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [selectedDept, setSelectedDept] = useState("")
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptResponse, feedbackResponse] = await Promise.all([
          apiRequest(API_ENDPOINTS.DEPARTMENTS),
          apiRequest(API_ENDPOINTS.FEEDBACK)
        ])

        if (deptResponse.ok) {
          const config = await deptResponse.json()
          const names: Record<string, string> = {}
          Object.entries(config).forEach(([key, dept]) => {
            if (dept && typeof dept === 'object' && 'name' in dept) {
              names[key] = (dept as { name: string }).name
            }
          })
          setDepartmentNames(names)
        }

        if (feedbackResponse.ok) {
          const data = await feedbackResponse.json()
          setFeedbackData(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const getDepartmentAnalytics = (deptKey: string) => {
    const deptFeedback = feedbackData.filter((f) => f.selectedDept === deptKey)
    console.log(`Analytics for ${deptKey}:`, { deptFeedback, feedbackDataLength: feedbackData.length })

    if (deptFeedback.length === 0) return null

    const allRatings = deptFeedback.flatMap((f) => Object.values(f.ratings).filter(r => typeof r === 'number' && !isNaN(r)))
    console.log('All ratings:', allRatings)
    
    if (allRatings.length === 0) return null
    
    const avgRating = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length

    const ratingDistribution = {
      good: allRatings.filter((r) => r >= 7).length,
      average: allRatings.filter((r) => r >= 4 && r < 7).length,
      poor: allRatings.filter((r) => r < 4).length,
    }
    console.log('Rating distribution:', ratingDistribution)

    // Criteria-wise analysis
    const criteriaAnalysis: Record<string, number[]> = {}
    deptFeedback.forEach((feedback) => {
      if (feedback.ratings && typeof feedback.ratings === 'object') {
        Object.entries(feedback.ratings).forEach(([criteria, rating]) => {
          if (typeof rating === 'number' && !isNaN(rating)) {
            if (!criteriaAnalysis[criteria]) criteriaAnalysis[criteria] = []
            criteriaAnalysis[criteria].push(rating)
          }
        })
      }
    })

    const criteriaAverage = Object.entries(criteriaAnalysis).map(([criteria, ratings]) => ({
      criteria: criteria.length > 20 ? criteria.substring(0, 20) + "..." : criteria,
      fullCriteria: criteria,
      average: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      count: ratings.length,
    }))

    const feedbackComments = deptFeedback.filter(f => f.comments && f.comments.trim().length > 0)

    // Time-based analysis
    const feedbackByDate = deptFeedback.reduce((acc, feedback) => {
      const date = new Date(feedback.timestamp).toLocaleDateString()
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {} as Record<string, number>)

    const timeSeriesData = Object.entries(feedbackByDate).map(([date, count]) => ({
      date,
      count,
      formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Rating trends by criteria (for line chart)
    const ratingTrends = Object.entries(criteriaAnalysis).map(([criteria, ratings]) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      return {
        criteria: criteria.length > 15 ? criteria.substring(0, 15) + "..." : criteria,
        fullCriteria: criteria,
        rating: avg,
        color: avg >= 7 ? COLORS.good : avg >= 4 ? COLORS.average : COLORS.poor
      }
    }).sort((a, b) => b.rating - a.rating)

    // Satisfaction levels with shorter labels
    const satisfactionLevels = [
      { level: 'Excellent', fullLevel: 'Excellent (9-10)', count: allRatings.filter(r => r >= 9).length, color: '#10b981' },
      { level: 'Good', fullLevel: 'Good (7-8)', count: allRatings.filter(r => r >= 7 && r < 9).length, color: '#22c55e' },
      { level: 'Average', fullLevel: 'Average (5-6)', count: allRatings.filter(r => r >= 5 && r < 7).length, color: '#eab308' },
      { level: 'Below Avg', fullLevel: 'Below Average (3-4)', count: allRatings.filter(r => r >= 3 && r < 5).length, color: '#f97316' },
      { level: 'Poor', fullLevel: 'Poor (1-2)', count: allRatings.filter(r => r < 3).length, color: '#ef4444' }
    ]

    // Response rate analysis
    const totalPossibleResponses = deptFeedback.length * Object.keys(criteriaAnalysis).length
    const actualResponses = allRatings.length
    const responseRate = totalPossibleResponses > 0 ? (actualResponses / totalPossibleResponses) * 100 : 0

    return {
      totalResponses: deptFeedback.length,
      averageRating: avgRating,
      ratingDistribution,
      criteriaAverage,
      feedbackComments: feedbackComments,
      timeSeriesData,
      ratingTrends,
      satisfactionLevels,
      responseRate,
      highestRatedCriteria: ratingTrends.length > 0 ? ratingTrends[0] : null,
      lowestRatedCriteria: ratingTrends.length > 0 ? ratingTrends[ratingTrends.length - 1] : null,
    }
  }

  const analytics = selectedDept ? getDepartmentAnalytics(selectedDept) : null

  const pieData = analytics && analytics.ratingDistribution
    ? [
        { name: "Good (7-10)", value: analytics.ratingDistribution.good, color: COLORS.good },
        { name: "Average (4-6)", value: analytics.ratingDistribution.average, color: COLORS.average },
        { name: "Poor (1-3)", value: analytics.ratingDistribution.poor, color: COLORS.poor },
      ].filter(item => item.value > 0)  // Only show segments with data
    : []

  // Debug: Log the data to console
  if (analytics && pieData.length === 0) {
    console.log('No pie data available. Rating distribution:', analytics.ratingDistribution)
  }

  // Prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Department Analytics</h2>
          <div className="text-gray-600">View feedback analysis for each department</div>
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select department to analyze" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(departmentNames).map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedDept && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-gray-500">Please select a department to view analytics</div>
          </CardContent>
        </Card>
      )}

      {selectedDept && !analytics && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-gray-500">No feedback data available for this department</div>
          </CardContent>
        </Card>
      )}

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{analytics.totalResponses}</div>
                <div className="text-xs text-gray-500 truncate">
                  {analytics.responseRate.toFixed(1)}% completion
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{analytics.averageRating.toFixed(1)}/10</div>
                <Badge
                  variant={
                    analytics.averageRating >= 7
                      ? "default"
                      : analytics.averageRating >= 4
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {analytics.averageRating >= 7 ? "Good" : analytics.averageRating >= 4 ? "Average" : "Poor"}
                </Badge>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Satisfaction Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {(
                    (analytics.ratingDistribution.good /
                      (analytics.ratingDistribution.good +
                        analytics.ratingDistribution.average +
                        analytics.ratingDistribution.poor)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-xs text-gray-500 truncate">rating 7+ out of 10</div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">
                  {(
                    (analytics.ratingDistribution.poor /
                      (analytics.ratingDistribution.good +
                        analytics.ratingDistribution.average +
                        analytics.ratingDistribution.poor)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-xs text-gray-500 truncate">rating below 4</div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600">
                  {analytics.highestRatedCriteria ? analytics.highestRatedCriteria.rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {analytics.highestRatedCriteria ? analytics.highestRatedCriteria.criteria : 'No data'}
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium truncate">Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">{analytics.feedbackComments.length}</div>
                <div className="text-xs text-gray-500 truncate">written feedback</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid - Fixed Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Rating Distribution Pie Chart */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rating Distribution</CardTitle>
                <CardDescription className="text-sm">Overall satisfaction breakdown</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {pieData.length > 0 ? (
                  <ChartContainer
                    config={{
                      good: { label: "Good", color: COLORS.good },
                      average: { label: "Average", color: COLORS.average },
                      poor: { label: "Poor", color: COLORS.poor },
                    }}
                    className="h-56 w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow">
                                  <div className="font-medium">{data.name}</div>
                                  <div className="text-sm">Count: {data.value}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-56">
                    <div className="text-gray-500">No rating data available</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Satisfaction Levels - Fixed */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Satisfaction Levels</CardTitle>
                <CardDescription className="text-sm">Detailed rating breakdown</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    count: { label: "Count", color: "#8b5cf6" },
                  }}
                  className="h-56 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.satisfactionLevels} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="level" 
                        tick={{ fontSize: 10 }}
                        interval={0}
                        height={50}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Feedback Timeline - Fixed */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Feedback Timeline</CardTitle>
                <CardDescription className="text-sm">Responses over time</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    count: { label: "Responses", color: "#06b6d4" },
                  }}
                  className="h-56 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.timeSeriesData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#06b6d4" 
                        fill="#06b6d4" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Top criteria performance at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.criteriaAverage.length > 0 ? (
                <div className="flex justify-center">
                  <ChartContainer
                    config={{
                      rating: { label: "Rating", color: "#f59e0b" },
                    }}
                    className="h-64 w-full max-w-md"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analytics.criteriaAverage.slice(0, 5)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="criteria" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Rating"
                          dataKey="average"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">No criteria data available</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Analysis of feedback trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Top Performing Area</div>
                    <div className="text-xs text-gray-600 break-words">
                      {analytics.highestRatedCriteria 
                        ? `${analytics.highestRatedCriteria.fullCriteria.substring(0, 50)}${analytics.highestRatedCriteria.fullCriteria.length > 50 ? '...' : ''} scores highest at ${analytics.highestRatedCriteria.rating.toFixed(1)}/10`
                        : 'No data available'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Area for Improvement</div>
                    <div className="text-xs text-gray-600 break-words">
                      {analytics.lowestRatedCriteria 
                        ? `${analytics.lowestRatedCriteria.fullCriteria.substring(0, 50)}${analytics.lowestRatedCriteria.fullCriteria.length > 50 ? '...' : ''} needs attention at ${analytics.lowestRatedCriteria.rating.toFixed(1)}/10`
                        : 'No data available'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Response Engagement</div>
                    <div className="text-xs text-gray-600">
                      {analytics.responseRate.toFixed(1)}% completion rate with {analytics.feedbackComments.length} detailed comments
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">Overall Trend</div>
                    <div className="text-xs text-gray-600">
                      {analytics.averageRating >= 7 
                        ? 'Department is performing well with high satisfaction rates'
                        : analytics.averageRating >= 4
                        ? 'Department shows average performance with room for improvement'
                        : 'Department requires immediate attention and improvement strategies'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {analytics.satisfactionLevels.find(s => s.level === 'Excellent')?.count || 0}
                    </div>
                    <div className="text-xs text-green-700">Excellent Ratings</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {analytics.criteriaAverage.length}
                    </div>
                    <div className="text-xs text-blue-700">Criteria Evaluated</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {analytics.timeSeriesData.length}
                    </div>
                    <div className="text-xs text-purple-700">Days with Feedback</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {analytics.feedbackComments.length > 0 
                        ? ((analytics.feedbackComments.length / analytics.totalResponses) * 100).toFixed(0)
                        : 0
                      }%
                    </div>
                    <div className="text-xs text-orange-700">Left Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Section - Fixed */}
          {analytics.feedbackComments.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Feedback Comments</CardTitle>
                <CardDescription>Additional comments and suggestions from respondents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {analytics.feedbackComments.map((feedback, index) => (
                    <div key={feedback.id || index} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Anonymous Feedback #{index + 1}</span>
                          {feedback.department && (
                            <span className="ml-2 text-gray-500">• {feedback.department}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {new Date(feedback.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed break-words">
                        {feedback.comments}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}