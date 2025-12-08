"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createStudent, getFaculties, getMajors, getClasses, type Faculty, type Major, type Class } from '@/lib/student';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    academicYear: '',
    email: '',
    classCode: '',
    majorCode: '',
    facultyCode: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

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
      if (!formData.facultyCode) {
        setMajors([]);
        setFormData(prev => ({ ...prev, majorCode: '', classCode: '' }));
        return;
      }
      
      setLoadingMajors(true);
      try {
        const response = await getMajors(formData.facultyCode);
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
  }, [formData.facultyCode]);

  // Load classes when facultyCode or majorCode changes
  useEffect(() => {
    const loadClasses = async () => {
      if (!formData.facultyCode) {
        setClasses([]);
        setFormData(prev => ({ ...prev, classCode: '' }));
        return;
      }
      
      setLoadingClasses(true);
      try {
        const response = await getClasses(
          formData.facultyCode,
          formData.majorCode || undefined
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
  }, [formData.facultyCode, formData.majorCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name;
    const value = e.target.value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-fill email when studentCode changes (if email is empty)
      if (name === 'studentCode' && value && !prev.email) {
        // Convert to lowercase and add email domain
        const emailSuggestion = value.toLowerCase() + '@student.ptithcm.edu.vn';
        newData.email = emailSuggestion;
      }
      
      return newData;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset dependent fields when parent changes
      if (name === 'facultyCode') {
        newData.majorCode = '';
        newData.classCode = '';
      } else if (name === 'majorCode') {
        newData.classCode = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.studentCode || !formData.fullName || !formData.classCode || 
        !formData.majorCode || !formData.facultyCode || !formData.email) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ các trường bắt buộc.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailPattern = /^[a-z0-9]+@student\.ptithcm\.edu\.vn$/;
    if (!emailPattern.test(formData.email.toLowerCase())) {
      toast({
        title: "Lỗi",
        description: "Email phải có định dạng: studentCode@student.ptithcm.edu.vn (ví dụ: n21dccn001@student.ptithcm.edu.vn)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const studentData: any = {
        studentCode: formData.studentCode,
        fullName: formData.fullName,
        email: formData.email.toLowerCase(), // Normalize to lowercase
        classCode: formData.classCode,
        majorCode: formData.majorCode,
        facultyCode: formData.facultyCode,
      };

      // Add optional fields if provided
      if (formData.dateOfBirth) {
        studentData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.gender) {
        studentData.gender = formData.gender;
      }
      if (formData.phone) {
        studentData.phone = formData.phone;
      }
      if (formData.address) {
        studentData.address = formData.address;
      }
      if (formData.academicYear) {
        studentData.academicYear = formData.academicYear;
      }

      const response = await createStudent(studentData);

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Tạo sinh viên mới thành công.",
        });
        router.push('/students');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo sinh viên. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY_INSTRUCTOR']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Tạo Sinh viên Mới</h1>
              <p className="text-muted-foreground">
                Thêm thông tin sinh viên mới vào hệ thống
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Sinh viên</CardTitle>
              <CardDescription>
                Điền đầy đủ thông tin để tạo sinh viên mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Student Code */}
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">
                      Mã Sinh viên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="studentCode"
                      name="studentCode"
                      type="text"
                      placeholder="VD: N21DCCN001"
                      value={formData.studentCode}
                      onChange={handleChange}
                      required
                      maxLength={20}
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Họ và Tên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Ngày Sinh</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số Điện thoại</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="0123456789"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={20}
                    />
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Niên khóa</Label>
                    <Input
                      id="academicYear"
                      name="academicYear"
                      type="text"
                      placeholder="VD: 2024-2025"
                      value={formData.academicYear}
                      onChange={handleChange}
                      maxLength={20}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="n21dccn001@student.ptithcm.edu.vn"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Định dạng: studentCode@student.ptithcm.edu.vn
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Nhập địa chỉ"
                    value={formData.address}
                    onChange={handleChange}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Faculty */}
                  <div className="space-y-2">
                    <Label htmlFor="facultyCode">
                      Khoa <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.facultyCode}
                      onValueChange={(value) => handleSelectChange('facultyCode', value)}
                      disabled={loadingFaculties}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingFaculties ? "Đang tải..." : "Chọn khoa"} />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.code} value={faculty.code}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Major */}
                  <div className="space-y-2">
                    <Label htmlFor="majorCode">
                      Ngành <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.majorCode}
                      onValueChange={(value) => handleSelectChange('majorCode', value)}
                      disabled={!formData.facultyCode || loadingMajors}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !formData.facultyCode 
                              ? "Chọn khoa trước" 
                              : loadingMajors 
                              ? "Đang tải..." 
                              : "Chọn ngành"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {majors.map((major) => (
                          <SelectItem key={major.code} value={major.code}>
                            {major.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <Label htmlFor="classCode">
                      Lớp <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.classCode}
                      onValueChange={(value) => handleSelectChange('classCode', value)}
                      disabled={!formData.facultyCode || loadingClasses}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !formData.facultyCode 
                              ? "Chọn khoa trước" 
                              : loadingClasses 
                              ? "Đang tải..." 
                              : "Chọn lớp"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.code} value={cls.code}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/students">
                    <Button type="button" variant="outline" disabled={isLoading}>
                      Hủy
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo Sinh viên'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

