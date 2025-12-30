"use client";

import { useEffect, useState } from 'react';
import { getEvaluationById, getCriteriaByRubric } from '@/lib/evaluation';
import { getStudentByCode } from '@/lib/student';
import { parseSubCriteria } from '@/lib/criteria-parser';
import { parseEvidence } from '@/lib/evidence-parser';
import type { Evaluation, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';
import type { Student } from '@/lib/student';
import { Loader2 } from 'lucide-react';

import { getClassKeyUsers, getStudentUser, type UserSignature } from '@/lib/api/class-users';

interface EvaluationPrintSheetProps {
  evaluationId: number;
}

export function EvaluationPrintSheet({ evaluationId }: EvaluationPrintSheetProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [criteriaWithSubCriteria, setCriteriaWithSubCriteria] = useState<CriteriaWithSubCriteria[]>([]);
  const [advisorSignature, setAdvisorSignature] = useState<UserSignature | null>(null);
  const [classMonitorSignature, setClassMonitorSignature] = useState<UserSignature | null>(null);
  const [studentSignature, setStudentSignature] = useState<UserSignature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const evalResponse = await getEvaluationById(evaluationId);
        
        if (evalResponse.success && evalResponse.data) {
          const evalData = evalResponse.data;
          setEvaluation(evalData);

          // Load student info
          const studentResponse = await getStudentByCode(evalData.studentCode);
          
          if (studentResponse.success && studentResponse.data) {
            setStudent(studentResponse.data);
            
            // Load student user info (for signature)
            console.log('[PRINT-SHEET] Loading student user for code:', evalData.studentCode);
            try {
              const studentUserResponse = await getStudentUser(evalData.studentCode);
              console.log('[PRINT-SHEET] Student user response:', studentUserResponse);
              if (studentUserResponse.success && studentUserResponse.data) {
                console.log('[PRINT-SHEET] Setting student signature:', studentUserResponse.data);
                setStudentSignature(studentUserResponse.data);
              } else {
                console.warn('[PRINT-SHEET] Student user response not successful:', studentUserResponse.message);
              }
            } catch (error) {
              console.error('[PRINT-SHEET] Error loading student user:', error);
            }
            
            // TEMPORARY: Hardcode signatures for testing
            setAdvisorSignature({
              username: 'advisor',
              fullName: 'Cố vấn Học tập CNTT2',
              email: 'advisor@ptithcm.edu.vn',
              classCode: 'D21CQCN01-N',
              signatureImageUrl: '/files/signatures/advisor-signature.svg',
              signatureUploadedAt: null
            });
            
            setClassMonitorSignature({
              username: 'classmonitor',
              fullName: 'Nguyễn Văn An',
              email: 'classmonitor@ptithcm.edu.vn',
              classCode: 'D21CQCN01-N',
              signatureImageUrl: '/files/signatures/classmonitor-signature.svg',
              signatureUploadedAt: null
            });
          }

          // Load criteria
          const criteriaResponse = await getCriteriaByRubric(evalData.rubricId);
          
          if (criteriaResponse.success && criteriaResponse.data) {
            const criteriaData = criteriaResponse.data as Criteria[];
            
            // Parse criteria with sub-criteria and scores
            const parsed = criteriaData.map(criterion => {
              const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
              const detail = evalData.details.find(d => d.criteriaId === criterion.id);
              
              // Parse scores from comment (JSON format)
              let advisorSubScores: Record<string, number> = {};
              let classMonitorSubScores: Record<string, number> = {};
              
              if (detail?.note || detail?.evidence) {
                const commentText = detail.note || detail.evidence;
                
                if (commentText && commentText.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(commentText);
                    
                    if (parsed.scores?.advisorSubCriteria) {
                      advisorSubScores = parsed.scores.advisorSubCriteria;
                    }
                    if (parsed.scores?.classMonitorSubCriteria) {
                      classMonitorSubScores = parsed.scores.classMonitorSubCriteria;
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
              
              // Map sub-criteria with scores (use advisor if available, else class monitor, else student)
              const subCriteriaWithScores = subCriteria.map(sub => {
                // Try to get score from parsed JSON first
                let score = advisorSubScores[sub.id] ?? classMonitorSubScores[sub.id];
                
                // If no score in JSON, try to get from evidence (student self-score)
                if (score === undefined || score === null) {
                  const parsedEvidence = detail?.evidence ? parseEvidence(detail.evidence) : [];
                  const evidenceScore = parsedEvidence.find(e => e.subCriteriaId === sub.id)?.score;
                  
                  // If still no score, try to parse from comment JSON (selfSubCriteria)
                  if (evidenceScore === undefined && detail?.note) {
                    try {
                      const commentJson = JSON.parse(detail.note);
                      if (commentJson.scores?.selfSubCriteria) {
                        score = commentJson.scores.selfSubCriteria[sub.id];
                      }
                    } catch (e) {
                      // Ignore
                    }
                  } else {
                    score = evidenceScore;
                  }
                }
                
                return {
                  ...sub,
                  score: score ?? 0,
                  evidence: '',
                };
              });

              return {
                ...criterion,
                subCriteria: subCriteriaWithScores,
                totalScore: detail?.score || 0,
                advisorScore: detail?.advisorScore,
                finalScore: detail?.advisorScore ?? detail?.classMonitorScore ?? detail?.score ?? 0,
              };
            });

            setCriteriaWithSubCriteria(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading evaluation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!evaluation || !student) {
    return <div className="p-4 text-center">Không tìm thấy dữ liệu</div>;
  }

  const totalScore = criteriaWithSubCriteria.reduce((sum, c) => sum + (c.finalScore || 0), 0);
  const currentDate = new Date();

  return (
    <div 
      className="print-sheet bg-white p-8 max-w-[210mm] mx-auto" 
      style={{ 
        fontFamily: 'Times New Roman, serif',
        backgroundColor: 'white',
        color: 'black',
        padding: '2rem',
        maxWidth: '210mm',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div className="text-center mb-6" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'black' }}>
        <div className="font-bold text-sm" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>HỌC VIỆN CN BƯU CHÍNH VIỄN THÔNG</div>
        <div className="font-bold text-sm" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>HỌC VIỆN CN BCVT CƠ SỞ TẠI TP. HCM</div>
        <div className="text-sm mt-4" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="font-bold text-sm" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Độc lập - Tự do - Hạnh phúc</div>
        <div className="border-b-2 border-black w-32 mx-auto my-2" style={{ borderBottom: '2px solid black', width: '8rem', margin: '0.5rem auto' }}></div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN</h1>
        <div className="mt-2">
          <span className="font-bold">Học kỳ: {evaluation.semester?.split('-')[2] || 'II'}</span>
          <span className="ml-8 font-bold">Năm học: {evaluation.academicYear || '2024-2025'}</span>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div>Họ và tên: <span className="font-bold">{student.fullName}</span></div>
          <div>Ngày sinh: <span className="font-bold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : ''}</span></div>
        </div>
        <div className="flex justify-between">
          <div>Mã số sinh viên: <span className="font-bold">{student.studentCode}</span></div>
          <div>Lớp: <span className="font-bold">{student.className || student.classCode}</span></div>
        </div>
      </div>

      {/* Criteria Table */}
      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr>
            <th className="border border-black p-2 w-12">TT</th>
            <th className="border border-black p-2">Nội dung đánh giá</th>
            <th className="border border-black p-2 w-20">Điểm quy định</th>
            <th className="border border-black p-2 w-20">Sinh viên đánh giá</th>
            <th className="border border-black p-2 w-20">Tập thể lớp đánh giá</th>
            <th className="border border-black p-2 w-20">CVHT đánh giá</th>
          </tr>
        </thead>
        <tbody>
          {criteriaWithSubCriteria.flatMap((criterion) => {
            const criterionRows = [];
            const detail = evaluation.details.find(d => d.criteriaId === criterion.id);
            
            // Parse class monitor sub-scores once for this criterion
            let classMonitorSubScores: Record<string, number> = {};
            if (detail?.note) {
              try {
                const parsed = JSON.parse(detail.note);
                if (parsed.scores?.classMonitorSubCriteria) {
                  classMonitorSubScores = parsed.scores.classMonitorSubCriteria;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            // Criterion Header
            criterionRows.push(
              <tr key={`criterion-header-${criterion.id}`}>
                <td colSpan={6} className="border border-black p-2 font-bold bg-gray-100">
                  Tiêu chí {criterion.orderIndex}. {criterion.name}
                </td>
              </tr>
            );
            
            // Sub-criteria
            criterion.subCriteria.forEach((sub) => {
              const parsedEvidence = detail?.evidence ? parseEvidence(detail.evidence) : [];
              const studentScore = parsedEvidence.find(e => e.subCriteriaId === sub.id)?.score ?? 0;
              
              // Get class monitor score for this sub-criteria
              let classMonitorSubScore: string | number = '';
              // Show class monitor score if it exists in the parsed JSON (even if classMonitorScore is null)
              if (classMonitorSubScores[sub.id] !== undefined) {
                classMonitorSubScore = classMonitorSubScores[sub.id];
              } else if (detail?.classMonitorScore !== undefined && detail?.classMonitorScore !== null) {
                // Fallback: if classMonitorScore exists but no sub-scores, show 0
                classMonitorSubScore = 0;
              }
              
              criterionRows.push(
                <tr key={`sub-${criterion.id}-${sub.id}`}>
                  <td className="border border-black p-2 text-center">{sub.id}</td>
                  <td className="border border-black p-2">{sub.name || sub.description}</td>
                  <td className="border border-black p-2 text-center">{sub.maxPoints} điểm</td>
                  <td className="border border-black p-2 text-center">{studentScore}</td>
                  <td className="border border-black p-2 text-center">{classMonitorSubScore}</td>
                  <td className="border border-black p-2 text-center font-bold">{sub.score}</td>
                </tr>
              );
            });
            
            // Criterion Total
            const criterionMaxPoints = criterion.maxPoints || criterion.subCriteria.reduce((sum, sub) => sum + sub.maxPoints, 0);
            
            // Calculate class monitor total from sub-scores if available
            let classMonitorTotal: string | number = '';
            if (Object.keys(classMonitorSubScores).length > 0) {
              classMonitorTotal = Object.values(classMonitorSubScores).reduce((sum, score) => sum + score, 0);
            } else if (detail?.classMonitorScore !== undefined && detail?.classMonitorScore !== null) {
              classMonitorTotal = detail.classMonitorScore;
            }
            
            criterionRows.push(
              <tr key={`total-${criterion.id}`}>
                <td colSpan={2} className="border border-black p-2 font-bold">
                  Mức điểm tối đa Tiêu chí {criterion.orderIndex}
                </td>
                <td className="border border-black p-2 text-center font-bold">{criterionMaxPoints} điểm</td>
                <td className="border border-black p-2 text-center">{criterion.totalScore}</td>
                <td className="border border-black p-2 text-center">{classMonitorTotal}</td>
                <td className="border border-black p-2 text-center font-bold">{criterion.finalScore}</td>
              </tr>
            );
            
            return criterionRows;
          })}
          
          {/* Grand Total */}
          <tr key="grand-total">
            <td colSpan={2} className="border border-black p-2 font-bold text-center">TỔNG CỘNG</td>
            <td className="border border-black p-2 text-center font-bold">100</td>
            <td className="border border-black p-2 text-center">{evaluation.totalPoints || evaluation.totalScore}</td>
            <td className="border border-black p-2 text-center">
              {criteriaWithSubCriteria.reduce((sum, c) => {
                const detail = evaluation.details.find(d => d.criteriaId === c.id);
                if (detail?.note) {
                  try {
                    const parsed = JSON.parse(detail.note);
                    if (parsed.scores?.classMonitorSubCriteria) {
                      const subTotal = Object.values(parsed.scores.classMonitorSubCriteria).reduce((s: number, score: any) => s + Number(score), 0);
                      return sum + subTotal;
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
                if (detail?.classMonitorScore !== undefined && detail?.classMonitorScore !== null) {
                  return sum + detail.classMonitorScore;
                }
                return sum;
              }, 0)}
            </td>
            <td className="border border-black p-2 text-center font-bold text-lg">{Math.round(totalScore)}</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="mt-8 text-right text-sm italic">
        TP. HCM, ngày {currentDate.getDate()} tháng {currentDate.getMonth() + 1} năm {currentDate.getFullYear()}
      </div>
      
      <div className="grid grid-cols-3 gap-8 mt-6 text-center text-sm">
        <div>
          <div className="font-bold mb-2">XÁC NHẬN CỦA</div>
          <div className="font-bold mb-16">CỐ VẤN HỌC TẬP</div>
          {advisorSignature?.signatureImageUrl ? (
            <>
              <img 
                src={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'}${advisorSignature.signatureImageUrl}`}
                alt="Chữ ký CVHT"
                className="mx-auto mb-2"
                style={{ maxHeight: '60px', maxWidth: '150px' }}
              />
              <div className="font-bold">{advisorSignature.fullName}</div>
            </>
          ) : (
            <div className="text-gray-400 italic text-xs">(Chưa có chữ ký)</div>
          )}
        </div>
        <div>
          <div className="font-bold mb-2">TM. BAN CÁN SỰ</div>
          <div className="font-bold mb-16">LỚP TRƯỞNG</div>
          {classMonitorSignature?.signatureImageUrl ? (
            <>
              <img 
                src={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'}${classMonitorSignature.signatureImageUrl}`}
                alt="Chữ ký lớp trưởng"
                className="mx-auto mb-2"
                style={{ maxHeight: '60px', maxWidth: '150px' }}
              />
              <div className="font-bold">{classMonitorSignature.fullName}</div>
            </>
          ) : (
            <div className="text-gray-400 italic text-xs">(Chưa có chữ ký)</div>
          )}
        </div>
        <div>
          <div className="font-bold mb-16">SINH VIÊN</div>
          {studentSignature?.signatureImageUrl ? (
            <>
              <img 
                src={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api'}${studentSignature.signatureImageUrl}`}
                alt="Chữ ký sinh viên"
                className="mx-auto mb-2"
                style={{ maxHeight: '60px', maxWidth: '150px' }}
              />
              <div className="font-bold">{student.fullName}</div>
            </>
          ) : (
            <>
              <div className="text-gray-400 italic text-xs mb-2">(Chưa có chữ ký)</div>
              <div className="font-bold">{student.fullName}</div>
            </>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print-sheet {
            margin: 0;
            padding: 20mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
