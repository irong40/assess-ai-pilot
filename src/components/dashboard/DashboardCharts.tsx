
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const chartConfig = {
  assessments: { label: "Assessments", color: "#3b82f6" },
  findings: { label: "Findings", color: "#ef4444" }
};

const DashboardCharts = () => {
  const complianceData = [
    { framework: "NIST 800-53", score: 85, assessments: 3 },
    { framework: "ISO 27001", score: 92, assessments: 2 },
    { framework: "HIPAA", score: 78, assessments: 1 },
    { framework: "CMMC L2", score: 65, assessments: 1 },
    { framework: "SOC 2", score: 88, assessments: 1 }
  ];

  const riskData = [
    { name: "Critical", value: 3, color: "#dc2626" },
    { name: "High", value: 8, color: "#ea580c" },
    { name: "Medium", value: 15, color: "#ca8a04" },
    { name: "Low", value: 12, color: "#16a34a" }
  ];

  const trendData = [
    { month: "Jan", assessments: 2, findings: 45 },
    { month: "Feb", assessments: 3, findings: 38 },
    { month: "Mar", assessments: 1, findings: 52 },
    { month: "Apr", assessments: 4, findings: 29 },
    { month: "May", assessments: 2, findings: 41 },
    { month: "Jun", assessments: 3, findings: 35 }
  ];

  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assessment & Findings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="assessments" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="findings" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Scores */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Compliance Framework Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px]">
            <BarChart data={complianceData}>
              <XAxis dataKey="framework" />
              <YAxis domain={[0, 100]} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [`${value}%`, 'Compliance Score']}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardCharts;
