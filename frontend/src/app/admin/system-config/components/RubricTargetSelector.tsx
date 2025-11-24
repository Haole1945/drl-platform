import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Lock } from 'lucide-react';
import { getFaculties, getMajors, getClasses } from '@/lib/student';
import type { Faculty, Major, Class } from '@/lib/student';

interface RubricTargetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

type FilterType = 'ALL' | 'FACULTY' | 'MAJOR' | 'CLASS';

export const RubricTargetSelector: React.FC<RubricTargetSelectorProps> = ({ value, onChange }) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setFilterType('ALL');
    } else if (value.startsWith('FACULTY:')) {
      setFilterType('FACULTY');
    } else if (value.startsWith('MAJOR:')) {
      setFilterType('MAJOR');
    } else if (value.startsWith('CLASS:')) {
      setFilterType('CLASS');
      const codes = value.substring(6).split(',').map(c => c.trim()).filter(Boolean);
      setSelectedClasses(codes);
    }
  }, []);

  // Load faculties when filter type changes
  useEffect(() => {
    if (filterType !== 'ALL') {
      loadFaculties();
    }
    // Reset selections when filter type changes
    setSelectedFaculties([]);
    setSelectedMajors([]);
    setSelectedClasses([]);
    setMajors([]);
    setClasses([]);
  }, [filterType]);

  // Load majors when faculties are selected
  useEffect(() => {
    if (selectedFaculties.length > 0 && (filterType === 'MAJOR' || filterType === 'CLASS')) {
      loadMajorsForMultipleFaculties(selectedFaculties);
    } else {
      setMajors([]);
      setSelectedMajors([]);
    }
  }, [selectedFaculties, filterType]);

  // Load classes when majors are selected
  useEffect(() => {
    if (selectedMajors.length > 0 && filterType === 'CLASS') {
      loadClassesForMultipleMajors(selectedMajors);
    } else {
      setClasses([]);
      setSelectedClasses([]);
    }
  }, [selectedMajors, filterType]);

  const loadFaculties = async () => {
    setLoadingFaculties(true);
    try {
      const response = await getFaculties();
      if (response.success && response.data) {
        setFaculties(response.data);
      }
    } catch (error) {
      console.error('Failed to load faculties:', error);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const loadMajors = async (facultyCode: string) => {
    setLoadingMajors(true);
    try {
      const response = await getMajors(facultyCode);
      if (response.success && response.data) {
        setMajors(response.data);
      }
    } catch (error) {
      console.error('Failed to load majors:', error);
    } finally {
      setLoadingMajors(false);
    }
  };

  const loadClasses = async (facultyCode?: string, majorCode?: string) => {
    setLoadingClasses(true);
    try {
      const response = await getClasses(facultyCode, majorCode);
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Load majors for multiple faculties
  const loadMajorsForMultipleFaculties = async (facultyCodes: string[]) => {
    setLoadingMajors(true);
    try {
      // Load majors for each faculty and combine results
      const promises = facultyCodes.map(code => getMajors(code));
      const responses = await Promise.all(promises);
      
      // Combine and deduplicate majors
      const allMajors: Major[] = [];
      const seenCodes = new Set<string>();
      
      responses.forEach(response => {
        if (response.success && response.data) {
          response.data.forEach(major => {
            if (!seenCodes.has(major.code)) {
              seenCodes.add(major.code);
              allMajors.push(major);
            }
          });
        }
      });
      
      setMajors(allMajors);
    } catch (error) {
      console.error('Failed to load majors for multiple faculties:', error);
    } finally {
      setLoadingMajors(false);
    }
  };

  // Load classes for multiple majors
  const loadClassesForMultipleMajors = async (majorCodes: string[]) => {
    setLoadingClasses(true);
    try {
      // Load classes for each major and combine results
      // Don't pass facultyCode to get all classes for each major
      const promises = majorCodes.map(code => getClasses(undefined, code));
      const responses = await Promise.all(promises);
      
      // Combine and deduplicate classes
      const allClasses: Class[] = [];
      const seenCodes = new Set<string>();
      
      responses.forEach(response => {
        if (response.success && response.data) {
          response.data.forEach(cls => {
            if (!seenCodes.has(cls.code)) {
              seenCodes.add(cls.code);
              allClasses.push(cls);
            }
          });
        }
      });
      
      setClasses(allClasses);
    } catch (error) {
      console.error('Failed to load classes for multiple majors:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    if (type === 'ALL') {
      onChange('');
    }
  };

  const handleFacultyToggle = (code: string) => {
    const newSelected = selectedFaculties.includes(code)
      ? selectedFaculties.filter(c => c !== code)
      : [...selectedFaculties, code];
    
    setSelectedFaculties(newSelected);
    
    if (filterType === 'FACULTY') {
      onChange(`FACULTY:${newSelected.join(',')}`);
    } else {
      // Reset majors and classes when faculty changes in other modes
      setSelectedMajors([]);
      setSelectedClasses([]);
    }
  };

  const handleMajorToggle = (code: string) => {
    const newSelected = selectedMajors.includes(code)
      ? selectedMajors.filter(c => c !== code)
      : [...selectedMajors, code];
    
    setSelectedMajors(newSelected);
    
    if (filterType === 'MAJOR') {
      onChange(`MAJOR:${newSelected.join(',')}`);
    } else {
      // Reset classes when major changes in CLASS mode
      setSelectedClasses([]);
    }
  };

  const handleClassToggle = (code: string) => {
    const newSelected = selectedClasses.includes(code)
      ? selectedClasses.filter(c => c !== code)
      : [...selectedClasses, code];
    
    setSelectedClasses(newSelected);
    onChange(`CLASS:${newSelected.join(',')}`);
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <Label className="text-base font-medium">Áp dụng cho các lớp</Label>
      <p className="text-sm text-muted-foreground">
        Chọn phạm vi áp dụng rubric này
      </p>
      
      {/* Filter Type Selection */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          type="button"
          variant={filterType === 'ALL' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterTypeChange('ALL')}
          className="w-full"
        >
          📚 Tất cả
        </Button>
        <Button
          type="button"
          variant={filterType === 'FACULTY' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterTypeChange('FACULTY')}
          className="w-full"
        >
          🏛️ Theo khoa
        </Button>
        <Button
          type="button"
          variant={filterType === 'MAJOR' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterTypeChange('MAJOR')}
          className="w-full"
        >
          🎓 Theo ngành
        </Button>
        <Button
          type="button"
          variant={filterType === 'CLASS' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterTypeChange('CLASS')}
          className="w-full"
        >
          🏫 Theo lớp
        </Button>
      </div>
      
      {/* Progressive disclosure based on filter type */}
      {filterType !== 'ALL' && (
        <div className="space-y-4">
          {/* Step 1: Faculty Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {filterType === 'FACULTY' ? 'Chọn khoa (có thể chọn nhiều)' : '1️⃣ Chọn khoa (có thể chọn nhiều)'}
            </Label>
            {loadingFaculties ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[150px] border rounded-md p-3">
                <div className="space-y-2">
                  {faculties.map((faculty) => (
                    <div key={faculty.code} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                      <Checkbox
                        id={`faculty-${faculty.code}`}
                        checked={selectedFaculties.includes(faculty.code)}
                        onCheckedChange={() => handleFacultyToggle(faculty.code)}
                      />
                      <label
                        htmlFor={`faculty-${faculty.code}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {faculty.name} ({faculty.code})
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedFaculties.length > 0 && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Đã chọn: {selectedFaculties.length} khoa
              </p>
            )}
          </div>

          {/* Step 2: Major Selection (unlocked after faculty) */}
          {(filterType === 'MAJOR' || filterType === 'CLASS') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                {filterType === 'MAJOR' ? 'Chọn ngành (có thể chọn nhiều)' : '2️⃣ Chọn ngành (có thể chọn nhiều)'}
                {selectedFaculties.length === 0 && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              {selectedFaculties.length === 0 ? (
                <div className="p-4 border rounded-md bg-muted/30 text-center text-sm text-muted-foreground">
                  🔒 Chọn khoa trước để mở khóa
                </div>
              ) : loadingMajors ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[150px] border rounded-md p-3">
                  <div className="space-y-2">
                    {majors.map((major) => (
                      <div key={major.code} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                        <Checkbox
                          id={`major-${major.code}`}
                          checked={selectedMajors.includes(major.code)}
                          onCheckedChange={() => handleMajorToggle(major.code)}
                        />
                        <label
                          htmlFor={`major-${major.code}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {major.name} ({major.code})
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedMajors.length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Đã chọn: {selectedMajors.length} ngành
                </p>
              )}
            </div>
          )}

          {/* Step 3: Class Selection (unlocked after major) */}
          {filterType === 'CLASS' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                3️⃣ Chọn lớp (có thể chọn nhiều)
                {selectedMajors.length === 0 && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              {selectedMajors.length === 0 ? (
                <div className="p-4 border rounded-md bg-muted/30 text-center text-sm text-muted-foreground">
                  🔒 Chọn ngành trước để mở khóa
                </div>
              ) : loadingClasses ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[150px] border rounded-md p-3">
                  <div className="space-y-2">
                    {classes.map((cls) => (
                      <div key={cls.code} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                        <Checkbox
                          id={`class-${cls.code}`}
                          checked={selectedClasses.includes(cls.code)}
                          onCheckedChange={() => handleClassToggle(cls.code)}
                        />
                        <label
                          htmlFor={`class-${cls.code}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {cls.name} ({cls.code})
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedClasses.length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Đã chọn: {selectedClasses.length} lớp
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
