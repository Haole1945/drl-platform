"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  FileText, 
  Users, 
  Award, 
  TrendingUp, 
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getEvaluations } from '@/lib/evaluation';
import { getStudents, getFaculties, getClasses } from '@/lib/student';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Evaluation } from '@/types/evaluation';
import type { Student } from '@/lib/student';

interface EvaluationStats {
  total: number;
  byStatus: {
    DRAFT: number;
    SUBMITTED: number;
    CLASS_APPROVED: number;
    FACULTY_APPROVED: number;
    CTSV_APPROVED: number;
    INSTITUTE_APPROVED: number;
    REJECTED: number;
  };
  bySemester: Record<string, number>;
  averageScore: number;
}

interface StudentStats {
  total: number;
  byFaculty: Record<string, number>;
  byClass: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#3b82f6',
  CLASS_APPROVED: '#10b981',
  FACULTY_APPROVED: '#22c55e',
  CTSV_APPROVED: '#16a34a',
  INSTITUTE_APPROVED: '#15803d',
  REJECTED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  CLASS_APPROVED: 'Duyệt lớp',
  FACULTY_APPROVED: 'Duyệt khoa',
  CTSV_APPROVED: 'Duyệt CTSV',
  INSTITUTE_APPROVED: 'Duyệt Học viện',
  REJECTED: 'Từ chối',
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats>({
    total: 0,
    byStatus: {
      DRAFT: 0,
      SUBMITTED: 0,
      CLASS_APPROVED: 0,
      FACULTY_APPROVED: 0,
      CTSV_APPROVED: 0,
      INSTITUTE_APPROVED: 0,
      REJECTED: 0,
    },
    bySemester: {},
    averageScore: 0,
  });
  const [studentStats, setStudentStats] = useState<StudentStats>({
    total: 0,
    byFaculty: {},
    byClass: {},
  });
  const [faculties, setFaculties] = useState<Array<{ code: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedFaculty, selectedClass, selectedSemester]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load evaluations
      const evalParams: any = {
        page: 0,
        size: 1000, // Get all for statistics
      };
      if (selectedSemester !== 'all') {
        evalParams.semester = selectedSemester;
      }

      const evaluationsResponse = await getEvaluations(evalParams);
      let evaluations: Evaluation[] = [];
      if (evaluationsResponse.success && evaluationsResponse.data) {
        evaluations = evaluationsResponse.data.content || [];
      }

      // Load students
      const studentsResponse = await getStudents({ page: 0, size: 1000 });
      let students: Student[] = [];
      if (studentsResponse.success && studentsResponse.data) {
        students = studentsResponse.data.content || [];
      }

      // Filter by faculty/class if selected
      if (selectedFaculty !== 'all') {
        students = students.filter(s => s.facultyCode === selectedFaculty);
        evaluations = evaluations.filter(e => {
          // Filter evaluations by matching student's faculty
          return students.some(s => s.studentCode === e.studentCode);
        });
      }

      if (selectedClass !== 'all') {
        students = students.filter(s => s.classCode === selectedClass);
        evaluations = evaluations.filter(e => {
          return students.some(s => s.studentCode === e.studentCode);
        });
      }

      // Calculate evaluation statistics
      const stats: EvaluationStats = {
        total: evaluations.length,
        byStatus: {
          DRAFT: 0,
          SUBMITTED: 0,
          CLASS_APPROVED: 0,
          FACULTY_APPROVED: 0,
          CTSV_APPROVED: 0,
          INSTITUTE_APPROVED: 0,
          REJECTED: 0,
        },
        bySemester: {},
        averageScore: 0,
      };

      let totalScore = 0;
      let scoreCount = 0;

      evaluations.forEach(evaluation => {
        // Count by status
        const status = evaluation.status as keyof typeof stats.byStatus;
        if (stats.byStatus[status] !== undefined) {
          stats.byStatus[status]++;
        }

        // Count by semester
        if (evaluation.semester) {
          stats.bySemester[evaluation.semester] = (stats.bySemester[evaluation.semester] || 0) + 1;
        }

        // Calculate average score
        const score = evaluation.totalPoints || evaluation.totalScore;
        if (score !== null && score !== undefined) {
          totalScore += score;
          scoreCount++;
        }
      });

      stats.averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      // Calculate student statistics
      const studentStatsData: StudentStats = {
        total: students.length,
        byFaculty: {},
        byClass: {},
      };

      students.forEach(student => {
        if (student.facultyCode) {
          studentStatsData.byFaculty[student.facultyCode] = 
            (studentStatsData.byFaculty[student.facultyCode] || 0) + 1;
        }
        if (student.classCode) {
          studentStatsData.byClass[student.classCode] = 
            (studentStatsData.byClass[student.classCode] || 0) + 1;
        }
      });

      setEvaluationStats(stats);
      setStudentStats(studentStatsData);

      // Load faculties and classes for filters
      const facultiesResponse = await getFaculties();
      if (facultiesResponse.success && facultiesResponse.data) {
        setFaculties(facultiesResponse.data);
      }

      const classesResponse = await getClasses();
      if (classesResponse.success && classesResponse.data) {
        setClasses(classesResponse.data);
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải dữ liệu thống kê',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const statusChartData = Object.entries(evaluationStats.byStatus).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    color: STATUS_COLORS[key] || '#94a3b8',
  }));

  const semesterChartData = Object.entries(evaluationStats.bySemester)
    .sort()
    .map(([semester, count]) => ({
      semester,
      count,
    }));

  const facultyChartData = Object.entries(studentStats.byFaculty)
    .map(([code, count]) => {
      const faculty = faculties.find(f => f.code === code);
      return {
        name: faculty?.name || code,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  const handleExport = () => {
    toast({
      title: 'Thông báo',
      description: 'Chức năng xuất báo cáo đang được phát triển',
    });
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
              <p className="text-muted-foreground">
                Xem báo cáo và thống kê hệ thống
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Khoa</label>
                  <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khoa</SelectItem>
                      {faculties.map(faculty => (
                        <SelectItem key={faculty.code} value={faculty.code}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Lớp</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả lớp</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.code} value={cls.code}>
                          {cls.name || cls.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Học kỳ</label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả học kỳ</SelectItem>
                      {Object.keys(evaluationStats.bySemester)
                        .sort()
                        .reverse()
                        .map(semester => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{evaluationStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      Tổng số phiếu đánh giá
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng sinh viên</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      Số lượng sinh viên trong hệ thống
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {evaluationStats.averageScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Điểm rèn luyện trung bình
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {evaluationStats.byStatus.INSTITUTE_APPROVED +
                        evaluationStats.byStatus.CTSV_APPROVED +
                        evaluationStats.byStatus.FACULTY_APPROVED +
                        evaluationStats.byStatus.CLASS_APPROVED}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Số đánh giá đã được duyệt
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố theo trạng thái</CardTitle>
                  <CardDescription>
                    Số lượng đánh giá theo từng trạng thái
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tỷ lệ trạng thái</CardTitle>
                    <CardDescription>
                      Biểu đồ tròn thể hiện tỷ lệ các trạng thái
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Semester Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Đánh giá theo học kỳ</CardTitle>
                    <CardDescription>
                      Số lượng đánh giá theo từng học kỳ
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {semesterChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={semesterChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semester" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        Không có dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Faculty Distribution */}
              {facultyChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Phân bố sinh viên theo khoa</CardTitle>
                    <CardDescription>
                      Số lượng sinh viên theo từng khoa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={facultyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Status Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết trạng thái</CardTitle>
                  <CardDescription>
                    Số lượng đánh giá theo từng trạng thái
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(evaluationStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{STATUS_LABELS[status] || status}</p>
                          <p className="text-2xl font-bold mt-1">{count}</p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: STATUS_COLORS[status] || '#94a3b8',
                            color: 'white',
                          }}
                        >
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
