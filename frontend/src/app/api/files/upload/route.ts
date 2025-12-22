import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get backend URL from environment or use default
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    // Get auth headers from the incoming request
    // The client should send these headers
    const authHeader = request.headers.get("Authorization");
    const userId = request.headers.get("X-User-Id");
    const userCode = request.headers.get("X-User-Code");
    const userRoles = request.headers.get("X-User-Roles");
    
    console.log("[File Upload Proxy] Auth info:", {
      hasAuth: !!authHeader,
      userId,
      userCode,
      userRoles,
    });
    
    // Forward the request to backend with auth headers
    const headers: Record<string, string> = {};
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    if (userId) {
      headers["X-User-Id"] = userId;
    }
    if (userCode) {
      headers["X-User-Code"] = userCode;
    }
    if (userRoles) {
      headers["X-User-Roles"] = userRoles;
    }
    
    console.log("[File Upload Proxy] Forwarding to:", `${backendUrl}/api/files/upload`);
    console.log("[File Upload Proxy] Headers:", Object.keys(headers));
    
    const response = await fetch(`${backendUrl}/api/files/upload`, {
      method: "POST",
      body: formData,
      headers,
    });

    console.log("[File Upload Proxy] Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[File Upload Proxy] Backend error:", response.status, errorText);
      return NextResponse.json(
        { success: false, message: `Upload failed: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("[File Upload Proxy] Success:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[File Upload Proxy] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
