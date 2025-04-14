"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Calendar, Trophy, Award, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react"

// Simple chart component using div heights
const BarChartSimple = ({ data, maxValue, label }: { data: number[]; maxValue: number; label: string }) => {
  return (
    <div className="flex items-end h-40 gap-1 mt-4">
      {data.map((value, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className="w-full bg-[#283593]/70 hover:bg-[#283593] rounded-t transition-all"
            style={{
              height: `${Math.max((value / maxValue) * 100, 5)}%`,
            }}
          ></div>
          <div className="text-xs mt-2">{index + 1}</div>
        </div>
      ))}
      <div className="absolute -ml-16 text-xs text-gray-500 rotate-90 origin-center">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [totalPoints, setTotalPoints] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [achievements, setAchievements] = useState({
    firstSession: false,
    fiveSession: false,
    tenSession: false,
    oneHour: false,
    fiveHours: false,
  })

  useEffect(() => {
    // Load data from localStorage
    const history = JSON.parse(localStorage.getItem("sessionHistory") || "[]")
    const redeem = JSON.parse(localStorage.getItem("redemptions") || "[]")
    const points = Number.parseInt(localStorage.getItem("totalPoints") || "0")

    setSessionHistory(history)
    setRedemptions(redeem)
    setTotalPoints(points)
    setTotalSessions(history.length)

    // Calculate total minutes
    const minutes = history.reduce((acc: number, session: any) => {
      return acc + (session.actualDuration || session.duration)
    }, 0)
    setTotalMinutes(minutes)

    // Generate weekly data (last 7 days)
    const last7Days = Array(7).fill(0)
    const today = new Date()

    history.forEach((session: any) => {
      const sessionDate = new Date(session.date)
      const diffTime = Math.abs(today.getTime() - sessionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1

      if (diffDays < 7) {
        last7Days[diffDays] += session.actualDuration || session.duration
      }
    })

    setWeeklyData(last7Days.reverse())

    // Check achievements
    const achievementState = {
      firstSession: history.length >= 1,
      fiveSession: history.length >= 5,
      tenSession: history.length >= 10,
      oneHour: minutes >= 60,
      fiveHours: minutes >= 300,
    }

    setAchievements(achievementState)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pt-[70px] px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="text-gray-500">Track your focus progress and rewards</p>
          </div>
          <Link href="/setup">
            <Button className="mt-4 md:mt-0 bg-[#43A047] hover:bg-[#2E7D32]">
              New Study Session <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-[#283593]/10 p-3 rounded-full mr-4">
                <Trophy className="h-6 w-6 text-[#283593]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Points</p>
                <h3 className="text-2xl font-bold">{totalPoints}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-[#283593]/10 p-3 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-[#283593]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <h3 className="text-2xl font-bold">{totalSessions}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-[#283593]/10 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-[#283593]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Focus Time</p>
                <h3 className="text-2xl font-bold">{totalMinutes} min</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center">
              <div className="bg-[#283593]/10 p-3 rounded-full mr-4">
                <Award className="h-6 w-6 text-[#283593]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Achievements</p>
                <h3 className="text-2xl font-bold">{Object.values(achievements).filter(Boolean).length}/5</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analytics */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Focus Analytics</CardTitle>
                <BarChart3 className="h-5 w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weekly">
                <TabsList className="mb-4">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" disabled>
                    Monthly
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="weekly">
                  <div className="relative pl-16">
                    <BarChartSimple data={weeklyData} maxValue={Math.max(...weeklyData, 60)} label="Minutes Studied" />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <div>7 days ago</div>
                      <div>Today</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Achievements</CardTitle>
                <Award className="h-5 w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      achievements.firstSession ? "bg-[#43A047]/20 text-[#43A047]" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">First Session</div>
                    <div className="text-xs text-gray-500">Complete your first study session</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      achievements.fiveSession ? "bg-[#43A047]/20 text-[#43A047]" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Consistent Learner</div>
                    <div className="text-xs text-gray-500">Complete 5 study sessions</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      achievements.tenSession ? "bg-[#43A047]/20 text-[#43A047]" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Focus Master</div>
                    <div className="text-xs text-gray-500">Complete 10 study sessions</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      achievements.oneHour ? "bg-[#43A047]/20 text-[#43A047]" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Hour Champion</div>
                    <div className="text-xs text-gray-500">Study for a total of 1 hour</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      achievements.fiveHours ? "bg-[#43A047]/20 text-[#43A047]" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Dedication Award</div>
                    <div className="text-xs text-gray-500">Study for a total of 5 hours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Tabs defaultValue="sessions">
            <TabsList>
              <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
              <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
            </TabsList>
            <TabsContent value="sessions">
              <div className="bg-white rounded-md shadow overflow-hidden">
                {sessionHistory.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No study sessions yet. Start your first session!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sessionHistory
                          .slice()
                          .reverse()
                          .map((session, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(session.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {session.actualDuration || session.duration} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#43A047]">
                                +{session.pointsEarned}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    session.completed === false
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {session.completed === false ? "Ended Early" : "Completed"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="redemptions">
              <div className="bg-white rounded-md shadow overflow-hidden">
                {redemptions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No redemptions yet. Complete sessions to earn points!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points Used
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {redemptions
                          .slice()
                          .reverse()
                          .map((redemption, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(redemption.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{redemption.service}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-500">
                                -{redemption.points}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
