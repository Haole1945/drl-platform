"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getActiveRubric, getCriteriaByRubric, createEvaluation, submitEvaluation } from '@/lib/evaluation';
import { canCreateEvaluation, hasAnyRole } from '@/lib/role-utils';
import { getStudents, getFaculties, getMajors, getClasses, type Student, type Faculty, type Major, type Class } from '@/lib/student';
import type { Rubric, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';
import { parseSubCriteria, calculateCriteriaTotal } from '@/lib/criteria-parser';
import { FileUpload, type UploadedFile } from '@/components/FileUpload';
import { Loader2, AlertCircle, Search, Users, ArrowRight } from 'lucide-react';
import { getOpenPeriod } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GradeBadge } from '@/components/GradeBadge';

function NewEvaluationContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [semester, setSemester] = useState('');
  const [openPeriod, setOpenPeriod] = useState<any>(null);
  const [checkingPeriod, setCheckingPeriod] = useState(true);
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>('');
  const isAdmin = useMemo(() => hasAnyRole(user, ['ADMIN']), [user]);
  
  // Student selection page state (for admin)
  const [showStudentSelection, setShowStudentSelection] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [facultyCode, setFacultyCode] = useState<string>('all');
  const [majorCode, setMajorCode] = useState<string>('all');
  const [classCode, setClassCode] = useState<string>('all');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  // State for sub-criteria scores: criteriaId -> subCriteriaId -> score
  const [subCriteriaScores, setSubCriteriaScores] = useState<Record<number, Record<string, number>>>({});
  // State for sub-criteria evidence: criteriaId -> subCriteriaId -> evidence
  const [subCriteriaEvidence, setSubCriteriaEvidence] = useState<Record<number, Record<string, string>>>({});
  // State for uploaded files: criteriaId -> subCriteriaId -> files[]
  const [subCriteriaFiles, setSubCriteriaFiles] = useState<Record<number, Record<string, UploadedFile[]>>>({});

  // Parse criteria to include sub-criteria
  const criteriaWithSubCriteria = useMemo<CriteriaWithSubCriteria[]>(() => {
    return criteria.map(criterion => {
      const parsedSubCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
      const scores = subCriteriaScores[criterion.id] || {};
      // Map parsed sub-criteria to include score and evidence
      const subCriteria = parsedSubCriteria.map(sub => ({
        ...sub,
        score: scores[sub.id] || 0,
        evidence: subCriteriaEvidence[criterion.id]?.[sub.id] || '',
      }));
      const totalScore = calculateCriteriaTotal(subCriteria, scores);
      
      return {
        ...criterion,
        subCriteria,
        totalScore,
      };
    });
  }, [criteria, subCriteriaScores, subCriteriaEvidence]);

  // Calculate total score across all criteria
  const totalScore = useMemo(() => {
    return criteriaWithSubCriteria.reduce((sum, c) => sum + c.totalScore, 0);
  }, [criteriaWithSubCriteria]);

  // Check if admin needs to select student
  useEffect(() => {
    if (!user || !canCreateEvaluation(user)) {
      router.push('/dashboard');
      return;
    }

    // For admin: check if studentCode is in query params
    if (isAdmin) {
      const studentCodeFromQuery = searchParams.get('studentCode');
      if (studentCodeFromQuery) {
        setSelectedStudentCode(studentCodeFromQuery);
        setShowStudentSelection(false);
      } else {
        // Show student selection page
        setShowStudentSelection(true);
        setLoading(false);
        return;
      }
    } else {
      // For non-admin: use their own studentCode
      if (user?.studentCode) {
        setSelectedStudentCode(user.studentCode);
      }
    }
  }, [user, router, isAdmin, searchParams]);

  // Load faculties for student selection
  useEffect(() => {
    if (!showStudentSelection) return;

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
  }, [showStudentSelection, toast]);

  // Load majors when facultyCode changes
  useEffect(() => {
    if (!showStudentSelection || facultyCode === 'all') {
      setMajors([]);
      setMajorCode('all');
      return;
    }

    const loadMajors = async () => {
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
  }, [showStudentSelection, facultyCode, toast]);

  // Load classes when facultyCode or majorCode changes
  useEffect(() => {
    if (!showStudentSelection || facultyCode === 'all') {
      setClasses([]);
      setClassCode('all');
      return;
    }

    const loadClasses = async () => {
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
  }, [showStudentSelection, facultyCode, majorCode, toast]);

  // Reset dependent dropdowns
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

  // Load students for selection page
  const loadStudentsForSelection = async () => {
    setLoadingStudents(true);
    try {
      const response = await getStudents({
        page,
        size,
        facultyCode: facultyCode && facultyCode !== 'all' ? facultyCode : undefined,
        majorCode: majorCode && majorCode !== 'all' ? majorCode : undefined,
        classCode: classCode && classCode !== 'all' ? classCode : undefined,
      });
      
      if (response.success && response.data) {
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
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách sinh viên.",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (showStudentSelection) {
      loadStudentsForSelection();
    }
  }, [showStudentSelection, page, size, facultyCode, majorCode, classCode]);

  const handleSearch = () => {
    setPage(0);
    loadStudentsForSelection();
  };

  const handleSelectStudent = (studentCode: string) => {
    router.push(`/evaluations/new?studentCode=${studentCode}`);
  };

  // Load rubric and period (main data loading) - only when student is selected
  useEffect(() => {
    if (!user || !canCreateEvaluation(user) || showStudentSelection) {
      return;
    }

    if (isAdmin && !selectedStudentCode) {
      return;
    }

    if (!isAdmin && !user?.studentCode) {
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        // Check for open period first
        setCheckingPeriod(true);
        try {
          const periodResponse = await getOpenPeriod();
          if (!isMounted) return;
          
          if (periodResponse.success && periodResponse.data) {
            setOpenPeriod(periodResponse.data);
          }
        } catch (error) {
          // Silently handle period check failure
        } finally {
          if (isMounted) {
            setCheckingPeriod(false);
          }
        }
        
        // Load rubric
        // For admin: need to fetch student info to get classCode
        // For non-admin: use their own classCode
        let classCodeForRubric = user?.classCode;
        
        if (isAdmin && selectedStudentCode) {
          // Fetch student info to get classCode
          try {
            const { getStudentByCode } = await import('@/lib/student');
            const studentResponse = await getStudentByCode(selectedStudentCode);
            if (studentResponse.success && studentResponse.data) {
              classCodeForRubric = studentResponse.data.classCode;
            }
          } catch (error) {
            // Failed to fetch student info - continue with user's classCode
          }
        }
        
        const rubricResponse = await getActiveRubric(undefined, classCodeForRubric);
        if (!isMounted) return;
        
        if (rubricResponse.success && rubricResponse.data) {
          setRubric(rubricResponse.data);
          
          const criteriaResponse = await getCriteriaByRubric(rubricResponse.data.id);
          if (!isMounted) return;
          
          if (criteriaResponse.success && criteriaResponse.data) {
            setCriteria(criteriaResponse.data);
            const initialScores: Record<number, Record<string, number>> = {};
            criteriaResponse.data.forEach(c => {
              initialScores[c.id] = {};
            });
            setSubCriteriaScores(initialScores);
          }
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy rubric đang active. Vui lòng liên hệ quản trị viên.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        let errorMessage = "Không thể tải rubric. Vui lòng thử lại.";
        
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('kết nối')) {
          errorMessage = "Không thể kết nối đến server. Vui lòng đảm bảo backend services đang chạy và bạn đã đăng nhập.";
        } else if (error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.message?.includes('authorization')) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user, router, isAdmin, selectedStudentCode, showStudentSelection, toast]);
  

  // Auto-fill semester from open period when available
  useEffect(() => {
    if (openPeriod?.semester && !semester) {
      setSemester(openPeriod.semester);
    }
  }, [openPeriod, semester]);

  const handleSubCriteriaScoreChange = (criteriaId: number, subCriteriaId: string, score: number) => {
    // Only allow integers
    const intScore = Math.round(score);
    
    setSubCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: intScore,
      },
    }));
  };

  const handleSubCriteriaEvidenceChange = (criteriaId: number, subCriteriaId: string, evidence: string) => {
    setSubCriteriaEvidence(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: evidence,
      },
    }));
  };


  const handleSubmit = async (asDraft: boolean) => {
    // For admin, use selectedStudentCode; for others, use user.studentCode
    const studentCodeToUse = isAdmin ? selectedStudentCode : user?.studentCode;
    
    if (!studentCodeToUse || !rubric || !semester.trim()) {
      toast({
        title: "Lỗi",
        description: isAdmin 
          ? "Vui lòng chọn sinh viên và điền đầy đủ thông tin."
          : "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive"
      });
      return;
    }

    // Validation: score > maxPoints is not allowed for both "Lưu Nháp" and "Tạo Đánh giá"
    // Note: Negative scores are allowed (some criteria can deduct points)
    // Note: Total score = 0 is allowed (can happen in valid scenarios)
    const hasInvalidScores = criteriaWithSubCriteria.some(criterion => {
      return criterion.subCriteria.some(sub => {
        const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
        // Validate: score should not exceed maxPoints (applies to both draft and non-draft)
        // Negative scores are allowed (for criteria that deduct points)
        return score > sub.maxPoints;
      });
    });

    if (hasInvalidScores) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại điểm số. Điểm không được vượt quá điểm tối đa của tiêu chí.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Convert sub-criteria scores to evaluation details format
      // For each main criteria, create one detail with the total score
      const details = criteriaWithSubCriteria.map(criterion => {
        // Build evidence string with scores and files
        // Format: "SCORES:1.1=3,1.2=10|EVIDENCE:1.1. Name: /files/... 1.2. Name: /files/..."
        // Include all scores (including 0) to ensure all sub-criteria scores are saved
        const scores = criterion.subCriteria
          .map(sub => {
            const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
            return `${sub.id}=${score}`;
          })
          .join(',');
        
        const subEvidence = criterion.subCriteria
          .map(sub => {
            const files = subCriteriaFiles[criterion.id]?.[sub.id] || [];
            const fileUrls = files.map(f => f.fileUrl).join(', ');
            return fileUrls ? `${sub.id}. ${sub.name}: ${fileUrls}` : '';
          })
          .filter(e => e)
          .join('\n');
        
        // Combine scores and evidence
        const combinedEvidence = scores ? `SCORES:${scores}|EVIDENCE:${subEvidence}` : `EVIDENCE:${subEvidence}`;

        return {
          criteriaId: criterion.id,
          score: criterion.totalScore, // Total of all sub-criteria (can be 0 for draft)
          evidence: combinedEvidence,
          note: '',
        };
      });

      const response = await createEvaluation({
        studentCode: studentCodeToUse,
        semester: semester.trim(),
        academicYear: rubric.academicYear,
        rubricId: rubric.id,
        details: details as any,
        asDraft: asDraft // Send draft flag to backend
      });

      if (response.success && response.data) {
        // If "Tạo Đánh giá" (not draft), automatically submit it
        if (!asDraft) {
          try {
            const submitResponse = await submitEvaluation(response.data.id);
            if (submitResponse.success) {
              toast({
                title: "Thành công",
                description: "Đánh giá đã được tạo và nộp thành công.",
              });
              router.push(`/evaluations/${response.data.id}`);
              return;
            }
          } catch (submitError: any) {
            // If submit fails, still show success for creation
            toast({
              title: "Đã tạo đánh giá",
              description: submitError.message || "Đánh giá đã được tạo nhưng chưa thể nộp. Vui lòng nộp sau.",
              variant: "default"
            });
            router.push(`/evaluations/${response.data.id}`);
            return;
          }
        }
        
        // If "Lưu Nháp" (draft), just save and redirect
        toast({
          title: "Thành công",
          description: "Đánh giá đã được lưu nháp. Bạn có thể tiếp tục chỉnh sửa sau.",
        });
        router.push(`/evaluations/${response.data.id}`);
      }
    } catch (error: any) {
      // If we reach here, it means all retries failed - this is a real error
      // Retry logic in API client handles transient errors automatically
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đánh giá. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show student selection page for admin
  if (showStudentSelection) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Chọn Sinh viên</h1>
              <p className="text-muted-foreground">
                Chọn sinh viên để tạo đánh giá điểm rèn luyện
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tìm kiếm và Lọc</CardTitle>
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
                    disabled={loadingFaculties}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingFaculties ? "Đang tải..." : "Tất cả Khoa"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả Khoa</SelectItem>
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
                    disabled={facultyCode === 'all' || loadingMajors}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingMajors ? "Đang tải..." : facultyCode === 'all' ? "Chọn khoa trước" : "Tất cả Ngành"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả Ngành</SelectItem>
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
                    disabled={facultyCode === 'all' || loadingClasses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingClasses ? "Đang tải..." : facultyCode === 'all' ? "Chọn khoa trước" : "Tất cả Lớp"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả Lớp</SelectItem>
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
                {loadingStudents ? (
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
                              <TableCell className="text-right">
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleSelectStudent(student.studentCode)}
                                >
                                  Chọn
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!rubric || criteria.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Không tìm thấy rubric đang active.</p>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tạo Đánh giá Mới</h1>
            <p className="text-muted-foreground">
              Điền thông tin đánh giá điểm rèn luyện
            </p>
          </div>
          
          {/* Alert if no open period */}
          {!checkingPeriod && !openPeriod && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không có đợt đánh giá đang mở</AlertTitle>
              <AlertDescription>
                Hiện tại không có đợt đánh giá nào đang mở. Bạn có thể tạo và lưu nháp đánh giá, 
                nhưng sẽ không thể nộp cho đến khi có đợt đánh giá mới được mở. 
                Vui lòng liên hệ quản trị viên để biết thêm thông tin.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Info if period is open */}
          {!checkingPeriod && openPeriod && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đợt đánh giá đang mở</AlertTitle>
              <AlertDescription>
                <strong>{openPeriod.name}</strong> - Học kỳ: {openPeriod.semester}
                <br />
                Thời gian: {new Date(openPeriod.startDate).toLocaleDateString('vi-VN')} 
                {' - '} 
                {new Date(openPeriod.endDate).toLocaleDateString('vi-VN')}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Đánh giá</CardTitle>
              <CardDescription>
                Rubric: {rubric.name} (Tối đa: {rubric.maxScore} điểm)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && selectedStudentCode && (
                <div className="space-y-2">
                  <Label htmlFor="studentCode">Sinh viên *</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedStudentCode}</p>
                        <p className="text-sm text-muted-foreground">
                          Đã chọn sinh viên. 
                          <Button
                            variant="link"
                            className="p-0 h-auto ml-1"
                            onClick={() => router.push('/evaluations/new')}
                          >
                            Chọn lại
                          </Button>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="semester">Học kỳ *</Label>
                <Input
                  id="semester"
                  placeholder="Ví dụ: 2024-2025-HK1"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiêu chí Đánh giá</CardTitle>
              <CardDescription className="flex items-center gap-[150px]">
                <span>
                  Tổng điểm hiện tại: <strong>{totalScore} / {rubric.maxScore}</strong>
                </span>
                <GradeBadge score={totalScore} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteriaWithSubCriteria.map((criterion, index) => (
                <div key={criterion.id} className="space-y-4 border rounded-lg p-4">
                  {/* Main Criteria Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        {index + 1}. {criterion.name}
                      </h4>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Tổng điểm tiêu chí:
                        </div>
                        <div className="text-lg font-bold">
                          {criterion.totalScore} / {criterion.maxPoints} điểm
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Criteria Table */}
                  {criterion.subCriteria.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div className="col-span-1">Mã</div>
                        <div className="col-span-5">Tên tiêu chí</div>
                        <div className="col-span-2 text-center">Điểm tối đa</div>
                        <div className="col-span-2 text-center">Điểm tự chấm</div>
                        <div className="col-span-2 text-center">
                          <div>Bằng chứng</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">
                            (tối đa 10 file, 50MB/file)
                          </div>
                        </div>
                      </div>
                      
                      {criterion.subCriteria.map((sub) => {
                        const currentScore = subCriteriaScores[criterion.id]?.[sub.id] || 0;
                        const currentEvidence = subCriteriaEvidence[criterion.id]?.[sub.id] || '';
                        
                        return (
                          <div key={sub.id} className="grid grid-cols-12 gap-2 items-start border-b pb-2 last:border-0">
                            <div className="col-span-1 text-sm font-medium">{sub.id}</div>
                            <div className="col-span-5">
                              <div className="text-sm font-medium">{sub.name}</div>
                              {sub.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {sub.description}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 text-center text-sm">
                              {sub.maxPoints} điểm
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <Input
                                type="number"
                                min={sub.maxPoints < 0 ? -Math.abs(sub.maxPoints) : 0}
                                max={sub.maxPoints}
                                step="1"
                                value={currentScore}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  // Clamp value: allow negative if maxPoints suggests it (like -1 for retake)
                                  const clamped = sub.maxPoints < 0 
                                    ? Math.max(-Math.abs(sub.maxPoints), Math.min(val, Math.abs(sub.maxPoints)))
                                    : Math.max(0, Math.min(val, sub.maxPoints));
                                  handleSubCriteriaScoreChange(criterion.id, sub.id, clamped);
                                }}
                                className="text-center w-20 h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2 flex justify-center items-center">
                              <FileUpload
                                criteriaId={criterion.id}
                                subCriteriaId={sub.id}
                                onFilesChange={(files) => {
                                  setSubCriteriaFiles(prev => ({
                                    ...prev,
                                    [criterion.id]: {
                                      ...(prev[criterion.id] || {}),
                                      [sub.id]: files,
                                    },
                                  }));
                                }}
                                existingFiles={subCriteriaFiles[criterion.id]?.[sub.id] || []}
                                maxFiles={10}
                                maxSizeMB={50}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Fallback: If no sub-criteria parsed, show old format
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {criterion.description}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Điểm tự chấm (0 - {criterion.maxPoints})</Label>
                          <Input
                            type="number"
                            min="0"
                            max={criterion.maxPoints}
                            step="1"
                            value={criterion.totalScore}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              handleSubCriteriaScoreChange(criterion.id, 'main', val);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Bằng chứng / Minh chứng</Label>
                          <FileUpload
                            criteriaId={criterion.id}
                            onFilesChange={(files) => {
                              // Store files for main criteria (fallback case)
                              setSubCriteriaFiles(prev => ({
                                ...prev,
                                [criterion.id]: {
                                  ...(prev[criterion.id] || {}),
                                  'main': files,
                                },
                              }));
                            }}
                            existingFiles={subCriteriaFiles[criterion.id]?.['main'] || []}
                            maxFiles={10}
                            maxSizeMB={50}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={submitting || !semester.trim()}
              title="Lưu tạm để tiếp tục chỉnh sửa sau (không yêu cầu đầy đủ thông tin)"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Nháp'
              )}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !semester.trim()}
              title="Tạo và nộp đánh giá ngay (yêu cầu đầy đủ thông tin)"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang nộp...
                </>
              ) : (
                'Nộp Đánh giá'
              )}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <NewEvaluationContent />
    </Suspense>
  );
}
