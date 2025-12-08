import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Scoring API Route - Phân tích từng sub-criteria và fake detection
 * Sử dụng OpenAI Vision API (gpt-4o-mini) để phân tích minh chứng THỰC SỰ
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { 
      criteriaId, 
      subCriteria, // Array of {id, name, description, maxPoints}
      evidenceFileIds, 
      evaluationId,
      maxScore: requestMaxScore,
      token: clientToken // Token from client for backend API calls
    } = body;
    
    const fileCount = evidenceFileIds?.length || 0;
    const maxScore = requestMaxScore || 10;
    const hasSubCriteria = subCriteria && Array.isArray(subCriteria) && subCriteria.length > 0;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    const OPENAI_BASE_URL = 'https://api.openai.com/v1';
    // Use internal service URL if available (for Docker), otherwise use public URL
    const API_BASE = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY không được cấu hình');
    }

    if (!OPENAI_API_KEY.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY không hợp lệ');
    }

    // Use token from client request
    const token = clientToken || '';

    // Fetch file metadata first (need token for this endpoint)
    // Group files by subCriteriaId to only analyze sub-criteria that have evidence
    const fileMetadataPromises = evidenceFileIds.map(async (fileId: number) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/files/${fileId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          return data.data; // FileUploadResponse with subCriteriaId
        } else {
          const errorText = await response.text().catch(() => response.statusText);
          console.warn(`Failed to fetch file metadata ${fileId}: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
          return null;
        }
      } catch (error: any) {
        console.error(`Error fetching file metadata ${fileId}:`, error?.message || error);
        return null;
      }
    });

    const fileMetadataList = (await Promise.all(fileMetadataPromises)).filter(Boolean);
    
    if (fileMetadataList.length === 0) {
      throw new Error(`Không thể lấy thông tin file. Có thể do thiếu token xác thực hoặc file không tồn tại. Đã thử ${evidenceFileIds.length} file(s).`);
    }

    console.log(`Successfully fetched metadata for ${fileMetadataList.length}/${evidenceFileIds.length} files`);

    // Group files by subCriteriaId
    // Only analyze sub-criteria that have files
    const filesBySubCriteria: Record<string, typeof fileMetadataList> = {};
    const filesWithoutSubCriteria: typeof fileMetadataList = [];
    
    for (const fileMeta of fileMetadataList) {
      if (fileMeta.subCriteriaId) {
        // File has subCriteriaId - map to that sub-criteria
        const subId = fileMeta.subCriteriaId;
        if (!filesBySubCriteria[subId]) {
          filesBySubCriteria[subId] = [];
        }
        filesBySubCriteria[subId].push(fileMeta);
      } else {
        // File doesn't have subCriteriaId - will need to map manually or skip
        filesWithoutSubCriteria.push(fileMeta);
        console.warn(`File ${fileMeta.fileName} (ID: ${fileMeta.id}) không có subCriteriaId`);
      }
    }

    // If files don't have subCriteriaId, try to map them to first sub-criteria (fallback)
    // In production, files should always have subCriteriaId
    if (filesWithoutSubCriteria.length > 0 && hasSubCriteria && subCriteria.length > 0) {
      console.warn(`${filesWithoutSubCriteria.length} file(s) không có subCriteriaId, sẽ map với sub-criteria đầu tiên`);
      const firstSubId = subCriteria[0].id;
      if (!filesBySubCriteria[firstSubId]) {
        filesBySubCriteria[firstSubId] = [];
      }
      filesBySubCriteria[firstSubId].push(...filesWithoutSubCriteria);
    }

    console.log(`Files grouped by sub-criteria:`, Object.keys(filesBySubCriteria));

    // Filter sub-criteria to only those that have files
    const subCriteriaWithFiles = hasSubCriteria 
      ? subCriteria.filter((sub: any) => {
          // Check if any file belongs to this sub-criteria
          return filesBySubCriteria[sub.id] && filesBySubCriteria[sub.id].length > 0;
        })
      : [];

    if (subCriteriaWithFiles.length === 0 && hasSubCriteria) {
      throw new Error('Không có sub-criteria nào có file minh chứng để phân tích. Vui lòng đảm bảo file được upload với sub-criteria tương ứng.');
    }

    console.log(`Sub-criteria with files: ${subCriteriaWithFiles.length}/${subCriteria?.length || 0}`);
    
    // Fetch file content and convert to base64, grouped by sub-criteria
    // Note: /files/evidence/ endpoint is public, no auth needed
    const fileContentsBySubCriteria: Record<string, Array<{ type: string; content: string; fileName: string }>> = {};
    const errors: string[] = [];
    
    // Process files for each sub-criteria that has files
    for (const sub of subCriteriaWithFiles) {
      const filesForSub = filesBySubCriteria[sub.id] || [];
      fileContentsBySubCriteria[sub.id] = [];
      
      for (const fileMeta of filesForSub) {
        try {
        // Extract URL path from fileUrl (e.g., "/files/evidence/0/1/filename.jpg")
        const fileUrl = fileMeta.fileUrl || '';
        if (!fileUrl) {
          errors.push(`File ${fileMeta.fileName || 'unknown'} không có URL`);
          continue;
        }

        // Ensure we have absolute URL
        let fullUrl: string;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          fullUrl = fileUrl;
        } else if (fileUrl.startsWith('/')) {
          // Relative URL starting with /
          fullUrl = `${API_BASE}${fileUrl}`;
        } else {
          // Relative URL without /
          fullUrl = `${API_BASE}/${fileUrl}`;
        }
        
        console.log(`Fetching file content from: ${fullUrl} (original: ${fileUrl})`);
        
        // File endpoint /files/evidence/ is public, no auth needed
        const fileResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });

        if (!fileResponse.ok) {
          const errorText = await fileResponse.text().catch(() => 'Unknown error');
          errors.push(`File ${fileMeta.fileName}: HTTP ${fileResponse.status} - ${errorText.substring(0, 100)}`);
          console.warn(`Failed to fetch file: ${fullUrl} - ${fileResponse.status} ${fileResponse.statusText}`);
          continue;
        }

        const contentType = fileResponse.headers.get('content-type') || fileMeta.fileType || 'application/octet-stream';
        const buffer = await fileResponse.arrayBuffer();
        
        if (buffer.byteLength === 0) {
          errors.push(`File ${fileMeta.fileName}: File rỗng`);
          continue;
        }

        const base64 = Buffer.from(buffer).toString('base64');

        // Determine if it's an image
        const isImage = contentType.startsWith('image/');
        
        if (isImage) {
          // For images, use base64 data URL
          fileContentsBySubCriteria[sub.id].push({
            type: 'image',
            content: base64,
            fileName: fileMeta.fileName || 'unknown'
          });
          console.log(`Successfully loaded image for ${sub.id}: ${fileMeta.fileName} (${buffer.byteLength} bytes)`);
        } else {
          // For documents, try to extract text (simplified - just note the file type)
          fileContentsBySubCriteria[sub.id].push({
            type: 'document',
            content: `[Document file: ${fileMeta.fileName}, type: ${contentType}, size: ${fileMeta.fileSize || buffer.byteLength} bytes]`,
            fileName: fileMeta.fileName || 'unknown'
          });
          console.log(`Successfully loaded document for ${sub.id}: ${fileMeta.fileName} (${buffer.byteLength} bytes)`);
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        errors.push(`File ${fileMeta.fileName || 'unknown'} (${sub.id}): ${errorMsg}`);
        console.error(`Error processing file ${fileMeta.fileName} for ${sub.id}:`, error);
        }
      }
    }

    // Check if we have any files loaded
    const totalFilesLoaded = Object.values(fileContentsBySubCriteria).reduce((sum, files) => sum + files.length, 0);
    if (totalFilesLoaded === 0) {
      const errorDetails = errors.length > 0 ? `\nChi tiết lỗi:\n${errors.join('\n')}` : '';
      throw new Error(`Không thể tải được nội dung file minh chứng. Đã thử ${fileMetadataList.length} file(s).${errorDetails}`);
    }

    console.log(`Successfully loaded ${totalFilesLoaded} files across ${Object.keys(fileContentsBySubCriteria).length} sub-criteria`);

    // Build prompt based on whether we have sub-criteria
    let systemPrompt = '';
    let userPrompt = '';

    if (hasSubCriteria && subCriteriaWithFiles.length > 0) {
      // Phân tích CHỈ các sub-criteria có file
      systemPrompt = `Bạn là chuyên gia đánh giá rèn luyện sinh viên với khả năng phát hiện minh chứng giả mạo và đánh giá tính liên quan.

QUY TẮC NGHIÊM NGẶT:
1. BẠN ĐANG XEM NỘI DUNG FILE THỰC SỰ - Phân tích kỹ từng file
2. CHỈ PHÂN TÍCH CÁC SUB-CRITERIA CÓ FILE - Bỏ qua sub-criteria không có bằng chứng
3. KIỂM TRA TÍNH LIÊN QUAN TRƯỚC TIÊN:
   - Điểm rèn luyện chỉ bao gồm: ý thức học tập, kết quả học tập, chấp hành nội quy, hoạt động ngoại khóa, tinh thần vượt khó
   - Nếu file KHÔNG LIÊN QUAN (ảnh selfie, ảnh ngẫu nhiên, tài liệu không liên quan) → ĐIỂM 0 và confidence < 30%
   - Nếu file có liên quan nhưng không đủ minh chứng → Điểm 30-50%
4. FAKE DETECTION:
   - Phát hiện ảnh bị chỉnh sửa (Photoshop, AI-generated, deepfake)
   - Phát hiện tài liệu giả mạo (font lạ, định dạng không nhất quán, ngày tháng không hợp lý)
   - Nếu phát hiện fake → isAuthentic = false, điểm thấp
5. CHỈ TRẢ VỀ ĐIỂM CHO CÁC SUB-CRITERIA CÓ FILE - Không tính tổng, không đánh giá sub-criteria không có file

Trả lời ngắn gọn, súc tích bằng tiếng Việt.`;

      const subCriteriaList = subCriteriaWithFiles.map((sub: any) => 
        `- ${sub.id} ${sub.name}: ${sub.maxPoints} điểm${sub.description ? ` (${sub.description})` : ''}`
      ).join('\n');

      // Build user message with files for each sub-criteria
      const userContent: Array<any> = [
        {
          type: 'text',
          text: `Bạn đang xem minh chứng THỰC SỰ cho các sub-criteria sau (CHỈ các sub-criteria có file):

${subCriteriaList}

YÊU CẦU PHÂN TÍCH NGHIÊM NGẶT:
1. Với MỖI sub-criteria CÓ FILE:
   a) XEM KỸ nội dung file - File có liên quan đến sub-criteria này không?
   b) Nếu KHÔNG LIÊN QUAN → suggestedScore = 0, confidence < 30%, reason = "File không liên quan đến tiêu chí đánh giá rèn luyện"
   c) Nếu có liên quan → Kiểm tra fake detection → Cho điểm dựa trên chất lượng minh chứng

2. FAKE DETECTION - Kiểm tra kỹ:
   - Ảnh: Màu sắc không tự nhiên, đường viền bất thường, text bị mờ/nhòe, metadata không khớp, dấu hiệu chỉnh sửa
   - Tài liệu: Font chữ không nhất quán, định dạng lạ, ngày tháng không hợp lý, chữ ký nghi vấn
   - Nếu phát hiện fake → isAuthentic = false, authenticityConfidence < 50%, điểm thấp

3. TÍNH LIÊN QUAN - QUAN TRỌNG NHẤT:
   - Ảnh selfie, ảnh ngẫu nhiên, tài liệu không liên quan → ĐIỂM 0
   - Chỉ cho điểm khi file THỰC SỰ chứng minh cho sub-criteria

4. CHỈ TRẢ VỀ ĐIỂM CHO CÁC SUB-CRITERIA CÓ FILE - Không tính tổng, không đánh giá sub-criteria không có file

Trả về JSON (CHỈ các sub-criteria có file):
{
  "subCriteriaScores": [
    {
      "subCriteriaId": "1.1",
      "suggestedScore": <0 đến maxPoints, 0 nếu không liên quan>,
      "maxScore": <maxPoints của sub-criteria>,
      "confidence": <0-100, THẤP nếu không liên quan>,
      "isAuthentic": <true/false>,
      "authenticityConfidence": <0-100>,
      "reason": "<Giải thích: có liên quan không? có fake không? điểm số dựa trên gì?>"
    }
    // CHỈ các sub-criteria có file, không cần overallConfidence hay overallReason
  ]
}`
        }
      ];

      // Add files for each sub-criteria
      for (const sub of subCriteriaWithFiles) {
        const filesForSub = fileContentsBySubCriteria[sub.id] || [];
        if (filesForSub.length === 0) continue;

        userContent.push({
          type: 'text',
          text: `\n=== MINH CHỨNG CHO ${sub.id} ${sub.name} (${filesForSub.length} file) ===`
        });

        for (const fileContent of filesForSub) {
          if (fileContent.type === 'image') {
            userContent.push({
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${fileContent.content}`,
                detail: 'high'
              }
            });
          } else {
            userContent.push({
              type: 'text',
              text: `\n[File: ${fileContent.fileName}]\n${fileContent.content}\n`
            });
          }
        }
      }

      userPrompt = userContent; // Will be used in messages array
    } else {
      // Fallback: Phân tích tổng thể
      systemPrompt = `Bạn là chuyên gia đánh giá rèn luyện sinh viên với khả năng phát hiện minh chứng giả mạo.

QUY TẮC NGHIÊM NGẶT:
1. BẠN ĐANG XEM NỘI DUNG FILE THỰC SỰ - Phân tích kỹ từng file
2. KIỂM TRA TÍNH LIÊN QUAN TRƯỚC TIÊN:
   - Điểm rèn luyện chỉ bao gồm: ý thức học tập, kết quả học tập, chấp hành nội quy, hoạt động ngoại khóa, tinh thần vượt khó
   - Nếu file KHÔNG LIÊN QUAN → ĐIỂM 0-30% và confidence < 30%
3. FAKE DETECTION: Phát hiện ảnh/tài liệu bị chỉnh sửa, giả mạo

Trả lời ngắn gọn, súc tích bằng tiếng Việt.`;

      const totalFiles = Object.values(fileContentsBySubCriteria).reduce((sum, files) => sum + files.length, 0);
      userPrompt = `Bạn đang xem ${totalFiles} file minh chứng THỰC SỰ cho một tiêu chí trong bảng điểm rèn luyện sinh viên.

Điểm tối đa: ${maxScore}

YÊU CẦU NGHIÊM NGẶT:
1. XEM KỸ nội dung file - File có liên quan đến điểm rèn luyện không?
   - Nếu KHÔNG LIÊN QUAN (ảnh selfie, file ngẫu nhiên) → scorePercent = 0-30%, confidence < 30%
2. FAKE DETECTION - Kiểm tra kỹ dấu hiệu chỉnh sửa, giả mạo
3. Chỉ cho điểm cao khi minh chứng RÕ RÀNG và PHÙ HỢP

Trả về JSON:
{
  "scorePercent": <0-100, 0-30 nếu không liên quan>,
  "confidence": <0-100, THẤP nếu không liên quan>,
  "isAuthentic": <true/false>,
  "authenticityConfidence": <0-100>,
  "reason": "<Giải thích: có liên quan không? có fake không? điểm số dựa trên gì?>"
}`;
    }

    // Build messages with file content
    const messages: Array<{ role: string; content: any }> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    if (hasSubCriteria && subCriteriaWithFiles.length > 0) {
      // Use the userContent we built above (with files grouped by sub-criteria)
      messages.push({
        role: 'user',
        content: userPrompt // This is already the userContent array with files
      });
    } else {
      // Fallback: Build simple user message (no sub-criteria)
      const userContent: Array<any> = [
        {
          type: 'text',
          text: userPrompt
        }
      ];

      // Add all files (if any)
      const allFiles = Object.values(fileContentsBySubCriteria).flat();
      for (const fileContent of allFiles) {
        if (fileContent.type === 'image') {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${fileContent.content}`,
              detail: 'high'
            }
          });
        } else {
          userContent.push({
            type: 'text',
            text: `\n[File: ${fileContent.fileName}]\n${fileContent.content}\n`
          });
        }
      }

      messages.push({
        role: 'user',
        content: userContent
      });
    }

    const openaiRequest = {
      model: 'gpt-4o-mini',
      max_tokens: hasSubCriteria ? 1500 : 800, // More tokens for detailed analysis
      temperature: 0.2, // Lower temperature for more consistent, strict evaluation
      messages: messages,
      response_format: { type: "json_object" }
    };

    const openaiResponse = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      if (openaiResponse.status === 401) {
        throw new Error('API Key không hợp lệ');
      } else if (openaiResponse.status === 429) {
        throw new Error('Đã vượt giới hạn API');
      } else {
        throw new Error(`Lỗi API: ${openaiResponse.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('Không nhận được phản hồi từ AI');
    }

    let aiResult;
    try {
      aiResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Lỗi xử lý phản hồi AI');
    }

    const processingTimeMs = Date.now() - startTime;

    if (hasSubCriteria && aiResult.subCriteriaScores) {
      // Phân tích theo sub-criteria - CHỈ các sub-criteria có file
      const subCriteriaScores = aiResult.subCriteriaScores.map((subScore: any) => ({
        subCriteriaId: subScore.subCriteriaId,
        suggestedScore: Math.round(Math.max(0, Math.min(subScore.suggestedScore, subScore.maxScore))),
        maxScore: subScore.maxScore,
        confidence: Math.min(100, Math.max(0, subScore.confidence || 30)), // Default lower if not specified
        isAuthentic: subScore.isAuthentic !== false,
        authenticityConfidence: Math.min(100, Math.max(0, subScore.authenticityConfidence || 50)),
        reason: subScore.reason || 'Đã phân tích minh chứng'
      }));

      // KHÔNG tính tổng điểm - chỉ trả về điểm từng sub-criteria
      // suggestedScore và status chỉ để tương thích với frontend, nhưng không dùng
      return NextResponse.json({
        success: true,
        data: {
          criteriaId,
          suggestedScore: 0, // Không tính tổng
          maxScore,
          status: 'UNCERTAIN' as const, // Không đánh giá tổng
          confidence: 0, // Không có confidence tổng
          reason: `Đã phân tích ${subCriteriaScores.length} sub-criteria có bằng chứng`,
          processingTimeMs,
          subCriteriaScores // CHỈ điểm từng sub-criteria có file
        }
      });
    } else {
      // Fallback: Phân tích tổng thể
      const scorePercent = Math.min(100, Math.max(0, aiResult.scorePercent || 0)); // Default 0 if not specified
      const rawScore = (scorePercent / 100) * maxScore;
      const suggestedScore = Math.round(rawScore);
      const confidence = Math.min(100, Math.max(0, aiResult.confidence || 30)); // Default lower
      const isAuthentic = aiResult.isAuthentic !== false;
      const authenticityConfidence = Math.min(100, Math.max(0, aiResult.authenticityConfidence || 50));

      let status: 'ACCEPTABLE' | 'REJECT' | 'UNCERTAIN' = 'UNCERTAIN';
      if (scorePercent >= 70) {
        status = 'ACCEPTABLE';
      } else if (scorePercent <= 40 || suggestedScore === 0) {
        status = 'REJECT';
      }

      return NextResponse.json({
        success: true,
        data: {
          criteriaId,
          suggestedScore,
          maxScore,
          status,
          confidence,
          reason: aiResult.reason || 'AI đã phân tích minh chứng',
          processingTimeMs,
          isAuthentic,
          authenticityConfidence
        }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('AI Scoring error:', error);

    return NextResponse.json({
      success: false,
      data: {
        criteriaId: 1,
        suggestedScore: 0,
        maxScore: 10,
        status: 'UNCERTAIN' as const,
        confidence: 0,
        reason: errorMessage,
        processingTimeMs: Date.now() - startTime
      },
      error: errorMessage
    }, { status: 500 });
  }
}
