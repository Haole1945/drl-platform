"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Loader2, Eye } from 'lucide-react';
import { getStudents, getStudentByCode, getFaculties, getMajors, getClasses, type Student, type Faculty, type Major, type Class } from '@/lib/student';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/lib/role-utils';

export default function StudentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Helper to check if user is CLASS_MONITOR only (not other roles)
  const isClassMonitorOnly = () => {
    return user && hasAnyRole(user, ['CLASS_MONITOR']) && !hasAnyRole(user, ['ADMIN', 'INSTRUCTOR', 'FACULTY_INSTRUCTOR', 'ADVISOR', 'CTSV_STAFF']);
  };
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [facultyCode, setFacultyCode] = useState<string>('all');
  const [majorCode, setMajorCode] = useState<string>('all');
  const [classCode, setClassCode] = useState<string>('all');
  
  // Dropdown data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // If user is CLASS_MONITOR, force filter by their classCode
      const effectiveClassCode = isClassMonitorOnly() && user?.classCode 
        ? user.classCode 
        : (classCode && classCode !== 'all' ? classCode : undefined);
      
      const response = await getStudents({
        page,
        size,
        facultyCode: facultyCode && facultyCode !== 'all' ? facultyCode : undefined,
        majorCode: majorCode && majorCode !== 'all' ? majorCode : undefined,
        classCode: effectiveClassCode,
      });
      
      if (response.success && response.data) {
        // Filter by search term if provided
        let filtered = response.data.content || [];
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(s => 
            s.studentCode.toLowerCase().includes(searchLower) ||
            s.fullName.toLowerCase().includes(searchLower) ||
            s.className?.toLowerCase().includes(searchLower) ||
            s.majorName?.toLowerCase().includes(searchLower) ||
            s.facultyName?.toLowerCase().includes(searchLower)
          );
        }
        
        setStudents(filtered);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (error: any) {
      // API client handles retries automatically
      // Only log persistent errors after all retries
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách sinh viên.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load faculties on mount
  useEffect(() => {
    const loadFaculties = async () => {
      setLoadingFaculties(true);
      try {
        const response = await getFaculties();
        if (response.success && response.data) {
          setFaculties(response.data);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách khoa.",
          variant: "destructive"
        });
      } finally {
        setLoadingFaculties(false);
      }
    };
    loadFaculties();
  }, []);

  // Load majors when facultyCode changes
  useEffect(() => {
    const loadMajors = async () => {
      if (facultyCode === 'all') {
        setMajors([]);
        setMajorCode('all');
        return;
      }
      
      setLoadingMajors(true);
      try {
        const response = await getMajors(facultyCode);
        if (response.success && response.data) {
          setMajors(response.data);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách ngành.",
          variant: "destructive"
        });
      } finally {
        setLoadingMajors(false);
      }
    };
    loadMajors();
  }, [facultyCode]);

  // Load classes when facultyCode or majorCode changes
  useEffect(() => {
    const loadClasses = async () => {
      if (facultyCode === 'all') {
        setClasses([]);
        setClassCode('all');
        return;
      }
      
      setLoadingClasses(true);
      try {
        const response = await getClasses(
          facultyCode !== 'all' ? facultyCode : undefined,
          majorCode !== 'all' ? majorCode : undefined
        );
        if (response.success && response.data) {
          setClasses(response.data);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách lớp.",
          variant: "destructive"
        });
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, [facultyCode, majorCode]);

  // Reset dependent dropdowns when parent changes
  useEffect(() => {
    if (facultyCode === 'all') {
      setMajorCode('all');
      setClassCode('all');
    }
  }, [facultyCode]);

  useEffect(() => {
    if (majorCode === 'all') {
      setClassCode('all');
    }
  }, [majorCode]);

  // Auto-set classCode for CLASS_MONITOR
  useEffect(() => {
    if (isClassMonitorOnly() && user?.classCode && classCode === 'all') {
      setClassCode(user.classCode);
    }
  }, [user]);

  useEffect(() => {
    loadStudents();
  }, [page, size, facultyCode, majorCode, classCode]);

  const handleSearch = () => {
    setPage(0);
    loadStudents();
  };

  const getPositionBadge = (position?: string) => {
    if (!position || position === 'NONE') return null;
    const positionMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'CLASS_MONITOR': { label: 'Lớp trưởng', variant: 'default' },
      'VICE_MONITOR': { label: 'Lớp phó', variant: 'secondary' },
      'SECRETARY': { label: 'Bí thư', variant: 'outline' },
    };
    const config = positionMap[position] || { label: position, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR', 'FACULTY_INSTRUCTOR', 'ADVISOR', 'CTSV_STAFF', 'CLASS_MONITOR']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Sinh viên</h1>
            <p className="text-muted-foreground">
              Xem và quản lý thông tin sinh viên
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm và Lọc</CardTitle>
              {isClassMonitorOnly() && (
                <CardDescription>
                  Bạn chỉ có thể xem sinh viên trong lớp {user?.classCode}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Tìm kiếm theo mã SV, tên, lớp, ngành, khoa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select 
                  value={facultyCode} 
                  onValueChange={(value) => {
                    setFacultyCode(value);
                    setMajorCode('all');
                    setClassCode('all');
                  }}
                  disabled={loadingFaculties || (isClassMonitorOnly() ?? false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFaculties ? "Đang tải..." : "Tất cả Khoa"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả Khoa</SelectItem>
                    {faculties.length === 0 && !loadingFaculties && (
                      <SelectItem value="no-data" disabled>Không có dữ liệu</SelectItem>
                    )}
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.code} value={faculty.code}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={majorCode} 
                  onValueChange={(value) => {
                    setMajorCode(value);
                    setClassCode('all');
                  }}
                  disabled={facultyCode === 'all' || loadingMajors || (isClassMonitorOnly() ?? false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMajors ? "Đang tải..." : facultyCode === 'all' ? "Chọn khoa trước" : "Tất cả Ngành"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả Ngành</SelectItem>
                    {majors.length === 0 && !loadingMajors && facultyCode !== 'all' && (
                      <SelectItem value="no-data" disabled>Không có dữ liệu</SelectItem>
                    )}
                    {majors.map((major) => (
                      <SelectItem key={major.code} value={major.code}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={classCode} 
                  onValueChange={setClassCode}
                  disabled={facultyCode === 'all' || loadingClasses || (isClassMonitorOnly() ?? false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClasses ? "Đang tải..." : facultyCode === 'all' ? "Chọn khoa trước" : "Tất cả Lớp"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả Lớp</SelectItem>
                    {classes.length === 0 && !loadingClasses && facultyCode !== 'all' && (
                      <SelectItem value="no-data" disabled>Không có dữ liệu</SelectItem>
                    )}
                    {classes.map((cls) => (
                      <SelectItem key={cls.code} value={cls.code}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Tìm kiếm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách Sinh viên</CardTitle>
              <CardDescription>
                Tổng số: {totalElements} sinh viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Không tìm thấy sinh viên nào</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã SV</TableHead>
                          <TableHead>Họ và Tên</TableHead>
                          <TableHead>Lớp</TableHead>
                          <TableHead>Ngành</TableHead>
                          <TableHead>Khoa</TableHead>
                          <TableHead>Chức vụ</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.studentCode}>
                            <TableCell className="font-medium">{student.studentCode}</TableCell>
                            <TableCell>{student.fullName}</TableCell>
                            <TableCell>{student.className || student.classCode || '-'}</TableCell>
                            <TableCell>{student.majorName || student.majorCode || '-'}</TableCell>
                            <TableCell>{student.facultyName || student.facultyCode || '-'}</TableCell>
                            <TableCell>{getPositionBadge(student.position)}</TableCell>
                            <TableCell className="text-right">
                              <Link href={`/students/${student.studentCode}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Xem
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Trang {page + 1} / {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1}
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
