"use client";

import { HospitalSidebarWrapper } from "@/components/sidebars";
import {
  Users,
  Bed,
  UserCheck,
  Activity,
  Clock,
  AlertTriangle,
  Heart,
  Stethoscope,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color = "primary",
}: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}/10 text-${color}`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {change}
        </div>
      </div>
    </div>
  );
}

function BedOccupancy() {
  const departments = [
    { name: "ICU", total: 24, occupied: 22, available: 2, occupancy: 92 },
    { name: "Emergency", total: 18, occupied: 15, available: 3, occupancy: 83 },
    {
      name: "General Ward",
      total: 120,
      occupied: 95,
      available: 25,
      occupancy: 79,
    },
    {
      name: "Pediatrics",
      total: 30,
      occupied: 18,
      available: 12,
      occupancy: 60,
    },
    {
      name: "Maternity",
      total: 25,
      occupied: 12,
      available: 13,
      occupancy: 48,
    },
  ];

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return "text-red-600 bg-red-50";
    if (occupancy >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        Bed Occupancy by Department
      </h3>
      <div className="space-y-4">
        {departments.map((dept) => (
          <div key={dept.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{dept.name}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(
                    dept.occupancy
                  )}`}
                >
                  {dept.occupancy}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {dept.occupied}/{dept.total}
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  dept.occupancy >= 90
                    ? "bg-red-500"
                    : dept.occupancy >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${dept.occupancy}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAdmissions() {
  const admissions = [
    {
      id: "1",
      patient: "Sarah Johnson",
      age: 34,
      department: "Emergency",
      condition: "Chest Pain",
      time: "2 hours ago",
      priority: "high",
    },
    {
      id: "2",
      patient: "Michael Chen",
      age: 67,
      department: "Cardiology",
      condition: "Heart Palpitations",
      time: "4 hours ago",
      priority: "medium",
    },
    {
      id: "3",
      patient: "Emma Davis",
      age: 28,
      department: "Maternity",
      condition: "Labor",
      time: "6 hours ago",
      priority: "low",
    },
    {
      id: "4",
      patient: "Robert Wilson",
      age: 45,
      department: "Orthopedics",
      condition: "Fracture",
      time: "8 hours ago",
      priority: "medium",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
      <div className="space-y-4">
        {admissions.map((admission) => (
          <div
            key={admission.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {admission.patient
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="font-medium">{admission.patient}</p>
                <p className="text-sm text-muted-foreground">
                  {admission.condition} • {admission.department}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  admission.priority
                )}`}
              >
                {admission.priority}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {admission.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffOverview() {
  const staffData = [
    { role: "Doctors", total: 45, onDuty: 32, available: 13 },
    { role: "Nurses", total: 120, onDuty: 85, available: 35 },
    { role: "Technicians", total: 28, onDuty: 20, available: 8 },
    { role: "Support Staff", total: 65, onDuty: 42, available: 23 },
  ];

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Staff Overview</h3>
      <div className="space-y-4">
        {staffData.map((staff) => (
          <div key={staff.role} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-primary" />
              <span className="font-medium">{staff.role}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium text-green-600">{staff.onDuty}</p>
                <p className="text-muted-foreground">On Duty</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-blue-600">{staff.available}</p>
                <p className="text-muted-foreground">Available</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{staff.total}</p>
                <p className="text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HospitalDashboard() {
  return (
    <HospitalSidebarWrapper currentPath="/hospital/dashboard">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor patient care and hospital operations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Patients"
              value="342"
              change="+8.2%"
              trend="up"
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Bed Occupancy"
              value="78%"
              change="-2.1%"
              trend="down"
              icon={<Bed className="h-5 w-5" />}
            />
            <MetricCard
              title="Staff on Duty"
              value="179"
              change="+5.3%"
              trend="up"
              icon={<UserCheck className="h-5 w-5" />}
            />
            <MetricCard
              title="Emergency Cases"
              value="23"
              change="+12.5%"
              trend="up"
              icon={<Activity className="h-5 w-5" />}
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BedOccupancy />
            <RecentAdmissions />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <StaffOverview />

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Todays Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Morning Rounds</p>
                    <p className="text-sm text-blue-700">
                      8:00 AM - All departments
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      Surgery Schedule
                    </p>
                    <p className="text-sm text-green-700">
                      10:30 AM - OR 3, Cardiac Surgery
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Staff Meeting</p>
                    <p className="text-sm text-yellow-700">
                      2:00 PM - Conference Room A
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <Heart className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-800">
                      Emergency Drill
                    </p>
                    <p className="text-sm text-purple-700">
                      4:00 PM - All departments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts and Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Critical Alerts</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2 rounded bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      ICU at Capacity
                    </p>
                    <p className="text-xs text-red-700">22/24 beds occupied</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Equipment Maintenance
                    </p>
                    <p className="text-xs text-yellow-700">
                      MRI scheduled for 6 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Patient Flow</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Admissions Today
                  </span>
                  <span className="font-medium">28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Discharges Today
                  </span>
                  <span className="font-medium">22</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Transfers
                  </span>
                  <span className="font-medium">6</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Net Change</span>
                    <span className="font-bold text-green-600">+6</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Quality Metrics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Patient Satisfaction
                  </span>
                  <span className="font-medium text-green-600">4.8/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Wait Time
                  </span>
                  <span className="font-medium">12 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Readmission Rate
                  </span>
                  <span className="font-medium text-green-600">2.1%</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="font-bold text-green-600">A+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HospitalSidebarWrapper>
  );
}
