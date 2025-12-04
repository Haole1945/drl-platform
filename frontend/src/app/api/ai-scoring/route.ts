import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Scoring API Route - Sử dụng OpenAI API (gpt-4o-mini)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { criteriaId, evidenceFileIds, maxScore: requestMaxScore } = body;
    const fileCount = evidenceFileIds?.length || 0;
    const maxScore = requestMaxScore || 10; // Lấy maxScore từ request hoặc mặc định 10

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    const OPENAI_BASE_URL = 'https://api.openai.com/v1';

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY không được cấu hình');
    }

    if (!OPENAI_API_KEY.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY không hợp lệ');
    }

    const openaiRequest = {
      model: 'gpt-4o-mini',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{
        role: 'system',
        content: 'Bạn là chuyên gia đánh giá rèn luyện sinh viên. Trả lời ngắn gọn, súc tích bằng tiếng Việt.'
      }, {
        role: 'user',
        content: `Đánh giá minh chứng cho tiêu chí với ${fileCount} file. Điểm tối đa là ${maxScore}.

Trả về JSON:
{
  "scorePercent": 85,
  "confidence": 80,
  "reason": "Lý do ngắn gọn"
}`
      }],
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
      if (openaiResponse.status === 401) {
        throw new Error('API Key không hợp lệ');
      } else if (openaiResponse.status === 429) {
        throw new Error('Đã vượt giới hạn API');
      } else {
        throw new Error(`Lỗi API: ${openaiResponse.status}`);
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
    } catch {
      throw new Error('Lỗi xử lý phản hồi AI');
    }

    // Tính điểm dựa trên phần trăm và maxScore
    // Đảm bảo điểm số là số nguyên (không có phần thập phân)
    const scorePercent = Math.min(100, Math.max(0, aiResult.scorePercent || 70));
    const rawScore = (scorePercent / 100) * maxScore;
    const suggestedScore = Math.round(rawScore); // Làm tròn thành số nguyên
    const confidence = Math.min(100, Math.max(0, aiResult.confidence || 70));

    let status: 'ACCEPTABLE' | 'REJECT' | 'UNCERTAIN' = 'UNCERTAIN';
    if (scorePercent >= 70) {
      status = 'ACCEPTABLE';
    } else if (scorePercent <= 40) {
      status = 'REJECT';
    }

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        criteriaId,
        suggestedScore,
        maxScore,
        status,
        confidence,
        reason: aiResult.reason || 'AI đã phân tích minh chứng',
        processingTimeMs
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

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
