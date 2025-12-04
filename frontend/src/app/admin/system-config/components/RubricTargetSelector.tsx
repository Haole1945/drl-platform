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

type FilterType = 'ALL' | 'FACULTY' | 'MAJOR' | 'CLASS' | 'COHORT';

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
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [cohorts, setCohorts] = useState<Map<string, Class[]>>(new Map());

  // Extract cohort from class code (e.g., D21CQCN01-N -> D21)
  const extractCohort = (classCode: string): string | null => {
    // Match pattern: D21, D22, D23, etc. (letter + 2 digits at start)
    const match = classCode.match(/^([A-Z]\d{2})/);
    return match ? match[1] : null;
  };

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setFilterType('ALL');
    } else if (value.startsWith('FACULTY:')) {
      setFilterType('FACULTY');
    } else if (value.startsWith('MAJOR:')) {
      setFilterType('MAJOR');
    } else if (value.startsWith('COHORT:')) {
      setFilterType('COHORT');
      const codes = value.substring(7).split(',').map(c => c.trim()).filter(Boolean);
      setSelectedCohorts(codes);
    } else if (value.startsWith('CLASS:')) {
      setFilterType('CLASS');
      const codes = value.substring(6).split(',').map(c => c.trim()).filter(Boolean);
      setSelectedClasses(codes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Load faculties when filter type changes
  useEffect(() => {
    if (filterType !== 'ALL') {
      loadFaculties();
    }
    // Reset selections when filter type changes
    setSelectedFaculties([]);
    setSelectedMajors([]);
    setSelectedClasses([]);
    setSelectedCohorts([]);
    setMajors([]);
    setClasses([]);
    setCohorts(new Map());
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

  // Load all classes and group by cohort when COHORT filter is selected
  useEffect(() => {
    if (filterType === 'COHORT') {
      loadAllClassesForCohort();
    } else {
      setCohorts(new Map());
      setSelectedCohorts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const loadAllClassesForCohort = async () => {
    setLoadingClasses(true);
    try {
      // Load all classes (no filter)
      const response = await getClasses();
      if (response.success && response.data) {
        // Group classes by cohort
        const cohortMap = new Map<string, Class[]>();
        response.data.forEach(cls => {
          const cohort = extractCohort(cls.code);
          if (cohort) {
            if (!cohortMap.has(cohort)) {
              cohortMap.set(cohort, []);
            }
            cohortMap.get(cohort)!.push(cls);
          }
        });
        setCohorts(cohortMap);
      }
    } catch (error) {
      // Failed to load classes for cohort
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadFaculties = async () => {
    setLoadingFaculties(true);
    try {
      const response = await getFaculties();
      if (response.success && response.data) {
        setFaculties(response.data);
      }
    } catch (error) {
      // Failed to load faculties
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
      // Failed to load majors
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
      // Failed to load classes
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
      // Failed to load majors for multiple faculties
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
      // Failed to load classes for multiple majors
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

  const handleCohortToggle = (cohort: string) => {
    const newSelected = selectedCohorts.includes(cohort)
      ? selectedCohorts.filter(c => c !== cohort)
      : [...selectedCohorts, cohort];
    
    setSelectedCohorts(newSelected);
    onChange(`COHORT:${newSelected.join(',')}`);
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <Label className="text-base font-medium">Áp dụng cho các lớp</Label>
      <p className="text-sm text-muted-foreground">
        Chọn phạm vi áp dụng rubric này
      </p>
      
      {/* Filter Type Selection */}
      <div className="grid grid-cols-5 gap-2">
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
          variant={filterType === 'COHORT' ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterTypeChange('COHORT')}
          className="w-full"
        >
          🔑 Theo khóa
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
          {/* Step 1: Faculty Selection (not shown for COHORT) */}
          {filterType !== 'COHORT' && (
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
          )}

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

          {/* Step 3: Cohort Selection (for COHORT filter) */}
          {filterType === 'COHORT' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Chọn khóa (có thể chọn nhiều)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Khóa được tự động trích xuất từ mã lớp (ví dụ: D21CQCN01-N → Khóa D21)
              </p>
              {loadingClasses ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-3">
                  <div className="space-y-3">
                    {Array.from(cohorts.entries())
                      .sort(([a], [b]) => b.localeCompare(a)) // Sort descending (newest first)
                      .map(([cohort, cohortClasses]) => (
                        <div key={cohort} className="space-y-2">
                          <div className="flex items-center space-x-2 p-2 rounded hover:bg-accent bg-muted/50">
                            <Checkbox
                              id={`cohort-${cohort}`}
                              checked={selectedCohorts.includes(cohort)}
                              onCheckedChange={() => handleCohortToggle(cohort)}
                            />
                            <label
                              htmlFor={`cohort-${cohort}`}
                              className="text-sm font-semibold cursor-pointer flex-1"
                            >
                              🔑 Khóa {cohort} ({cohortClasses.length} lớp)
                            </label>
                          </div>
                          {selectedCohorts.includes(cohort) && (
                            <div className="ml-6 space-y-1 pl-2 border-l-2 border-primary/30">
                              {cohortClasses.slice(0, 5).map((cls) => (
                                <div key={cls.code} className="text-xs text-muted-foreground">
                                  • {cls.name} ({cls.code})
                                </div>
                              ))}
                              {cohortClasses.length > 5 && (
                                <div className="text-xs text-muted-foreground italic">
                                  ... và {cohortClasses.length - 5} lớp khác
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
              {selectedCohorts.length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Đã chọn: {selectedCohorts.length} khóa
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
