"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllUsers, 
  activateUser, 
  deactivateUser, 
  updateUserRoles, 
  getAllRoles,
  type UserListParams 
} from '@/lib/auth';
import type { User, Role } from '@/types/auth';
import { Search, RefreshCw, CheckCircle2, XCircle, Edit, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();

  // Load available roles
  useEffect(() => {
    loadRoles();
  }, []);

  // Load users when filters change
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, activeFilter]);

  const loadRoles = async () => {
    try {
      const response = await getAllRoles();
      if (response.success && response.data) {
        setAvailableRoles(response.data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: UserListParams = {
        page: currentPage,
        size: pageSize,
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (activeFilter !== 'all') {
        params.isActive = activeFilter === 'active';
      }
      
      const response = await getAllUsers(params);
      if (response.success && response.data) {
        setUsers(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
      } else {
        toast({
          title: 'Lỗi',
          description: response.message || 'Không thể tải danh sách người dùng',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải danh sách người dùng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadUsers();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setActiveFilter('all');
    setCurrentPage(0);
  };

  const handleEditRoles = (user: User) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || [user.role].filter(Boolean) as string[]);
    setShowEditDialog(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const response = await updateUserRoles(selectedUser.id, selectedRoles);
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Cập nhật quyền người dùng thành công',
        });
        setShowEditDialog(false);
        loadUsers();
      } else {
        toast({
          title: 'Lỗi',
          description: response.message || 'Không thể cập nhật quyền',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật quyền',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const response = await activateUser(selectedUser.id);
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Kích hoạt tài khoản thành công',
        });
        setShowActivateDialog(false);
        loadUsers();
      } else {
        toast({
          title: 'Lỗi',
          description: response.message || 'Không thể kích hoạt tài khoản',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể kích hoạt tài khoản',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const response = await deactivateUser(selectedUser.id);
      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Vô hiệu hóa tài khoản thành công',
        });
        setShowDeactivateDialog(false);
        loadUsers();
      } else {
        toast({
          title: 'Lỗi',
          description: response.message || 'Không thể vô hiệu hóa tài khoản',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể vô hiệu hóa tài khoản',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | number[] | undefined): string => {
    if (!date) return 'N/A';
    if (Array.isArray(date)) {
      const [year, month, day] = date;
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    try {
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const getUserRoles = (user: User): string[] => {
    if (user.roles && user.roles.length > 0) {
      return user.roles;
    }
    if (user.role) {
      return [user.role];
    }
    return [];
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản và phân quyền người dùng
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tất cả vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} variant="default">
                  <Search className="mr-2 h-4 w-4" />
                  Tìm kiếm
                </Button>
                <Button onClick={handleResetFilters} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Đặt lại
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách Người dùng</CardTitle>
              <CardDescription>
                Tổng số: {users.length} người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Không tìm thấy người dùng nào
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Tên đăng nhập</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Mã SV</TableHead>
                          <TableHead>Vai trò</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.fullName || 'N/A'}</TableCell>
                            <TableCell>{user.studentCode || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {getUserRoles(user).map((role) => (
                                  <Badge key={role} variant="secondary">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.isActive !== false ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Hoạt động
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Vô hiệu hóa
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRoles(user)}
                                >
                                  <Edit className="mr-1 h-3 w-3" />
                                  Quyền
                                </Button>
                                {user.isActive !== false ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDeactivateDialog(true);
                                    }}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Vô hiệu hóa
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowActivateDialog(true);
                                    }}
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Kích hoạt
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Trang {currentPage + 1} / {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage >= totalPages - 1}
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

          {/* Edit Roles Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa Quyền</DialogTitle>
                <DialogDescription>
                  Chọn quyền cho người dùng: {selectedUser?.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {availableRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((r) => r !== role));
                        }
                      }}
                    />
                    <Label htmlFor={role} className="cursor-pointer">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveRoles} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Activate Dialog */}
          <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kích hoạt Tài khoản</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn kích hoạt tài khoản của {selectedUser?.username}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleActivate} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Kích hoạt'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Deactivate Dialog */}
          <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Vô hiệu hóa Tài khoản</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn vô hiệu hóa tài khoản của {selectedUser?.username}?
                  Người dùng sẽ không thể đăng nhập sau khi tài khoản bị vô hiệu hóa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Vô hiệu hóa'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
