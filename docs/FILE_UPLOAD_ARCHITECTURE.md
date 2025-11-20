# File Upload Architecture cho Minh chứng

## 📋 Tổng quan

Hệ thống cần hỗ trợ upload và lưu trữ các file minh chứng (ảnh, video, tài liệu) cho đánh giá điểm rèn luyện.

---

## 🏗️ Kiến trúc đề xuất

### Option 1: File Service riêng (Khuyến nghị cho Production)

```
┌─────────────┐
│   Gateway   │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
┌──────▼──────┐  ┌────▼─────┐
│ Evaluation  │  │   File   │
│  Service    │  │ Service  │
└─────────────┘  └──────────┘
```

**Ưu điểm:**
- ✅ Tách biệt concerns
- ✅ Scale riêng file service
- ✅ Dễ migrate sang cloud storage (S3, Azure Blob)

**Nhược điểm:**
- ⚠️ Phức tạp hơn (thêm 1 service)
- ⚠️ Cần service discovery

---

### Option 2: File Upload trong Evaluation Service (Đơn giản, phù hợp hiện tại)

```
┌─────────────┐
│   Gateway   │
└──────┬──────┘
       │
┌──────▼──────┐
│ Evaluation  │
│  Service    │
│  + File     │
│  Upload     │
└─────────────┘
```

**Ưu điểm:**
- ✅ Đơn giản, nhanh implement
- ✅ Không cần service mới
- ✅ Phù hợp cho development/testing

**Nhược điểm:**
- ⚠️ Coupling giữa evaluation và file storage
- ⚠️ Khó scale riêng file storage

---

## 💾 Storage Options

### 1. Local Filesystem (Development)
- **Path**: `/app/uploads/evidence/`
- **URL**: `http://localhost:8080/api/files/evidence/{filename}`
- **Ưu điểm**: Đơn giản, không cần config
- **Nhược điểm**: Không scalable, mất khi container restart

### 2. Docker Volume (Recommended cho Development)
- **Path**: Volume mount `/app/uploads`
- **URL**: `http://localhost:8080/api/files/evidence/{filename}`
- **Ưu điểm**: Persist qua container restarts
- **Nhược điểm**: Vẫn không scalable

### 3. Cloud Storage (Production)
- **AWS S3**: `s3://bucket-name/evidence/{filename}`
- **Azure Blob**: `https://account.blob.core.windows.net/evidence/{filename}`
- **Google Cloud Storage**: `gs://bucket-name/evidence/{filename}`
- **Ưu điểm**: Scalable, CDN, backup tự động
- **Nhược điểm**: Cần config, có chi phí

---

## 📊 Database Schema

### Cách 1: Lưu URLs trong EvaluationDetail (Đơn giản)

```sql
ALTER TABLE evaluation_details 
ADD COLUMN evidence_urls TEXT[]; -- Array of URLs
-- hoặc
ADD COLUMN evidence_urls JSONB; -- JSON array: ["url1", "url2"]
```

### Cách 2: Bảng riêng cho Evidence Files (Normalized)

```sql
CREATE TABLE evidence_files (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    criteria_id BIGINT NOT NULL,
    sub_criteria_id VARCHAR(20), -- e.g., "1.1", "1.2"
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- image/jpeg, video/mp4, application/pdf
    file_size BIGINT, -- bytes
    uploaded_by BIGINT, -- user_id
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (evaluation_id, criteria_id) 
        REFERENCES evaluation_details(evaluation_id, criteria_id)
);
```

**Khuyến nghị**: Cách 2 (bảng riêng) vì:
- ✅ Dễ query files theo evaluation/criteria
- ✅ Dễ delete files khi cần
- ✅ Có thể thêm metadata (file_type, file_size)
- ✅ Dễ migrate sang cloud storage sau

---

## 🔧 Implementation Plan

### Phase 1: Backend - File Upload Service

1. **Add dependencies** (Spring Boot Multipart)
2. **Create FileService** - Handle upload/download
3. **Create FileController** - REST endpoints
4. **Update EvaluationDetail entity** - Add evidence_files relationship
5. **Create EvidenceFile entity** - New table
6. **Update EvaluationService** - Link files to details

### Phase 2: Frontend - File Upload Component

1. **Create FileUpload component** - Drag & drop, preview
2. **Update Evaluation form** - Replace textarea với file upload
3. **File preview** - Show images, video player, download links
4. **File validation** - Size limits, file types

### Phase 3: Gateway - File Routing

1. **Add route** - `/api/files/**` → file service
2. **CORS config** - Allow file uploads
3. **Size limits** - Max file size

---

## 📝 API Endpoints

### Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- evaluationId: Long (optional, for linking)
- criteriaId: Long (optional)
- subCriteriaId: String (optional, e.g., "1.1")

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "fileName": "evidence.jpg",
    "fileUrl": "/api/files/evidence/abc123.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }
}
```

### Get File
```
GET /api/files/{fileId}
GET /api/files/evidence/{filename}
```

### Delete File
```
DELETE /api/files/{fileId}
```

### List Files for Evaluation
```
GET /api/files/evaluation/{evaluationId}
GET /api/files/evaluation/{evaluationId}/criteria/{criteriaId}
```

---

## 🔒 Security & Validation

### File Type Validation
- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, avi, mov, webm
- **Documents**: pdf, doc, docx, xls, xlsx
- **Max size**: 50MB per file
- **Max files per criteria**: 10 files

### Security
- ✅ Validate file type (MIME type + extension)
- ✅ Scan for malware (optional, future)
- ✅ Rename files (UUID) để tránh conflicts
- ✅ Path traversal protection
- ✅ Authentication required

---

## 📦 File Naming Strategy

### Pattern:
```
{studentCode}/{evaluationId}/{criteriaId}/{subCriteriaId}/{uuid}.{ext}
```

### Example:
```
N21DCCN002/123/1/1.1/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

**Lợi ích:**
- ✅ Dễ organize
- ✅ Dễ cleanup (delete folder khi delete evaluation)
- ✅ Tránh conflicts

---

## 🚀 Migration Path

### Development → Production

1. **Development**: Local filesystem + Docker volume
2. **Staging**: Local filesystem + backup
3. **Production**: Cloud storage (S3/Azure Blob)

### Migration Script
```sql
-- Migrate existing evidence text to files table
INSERT INTO evidence_files (evaluation_id, criteria_id, file_url, file_type)
SELECT evaluation_id, criteria_id, evidence, 'text/plain'
FROM evaluation_details
WHERE evidence IS NOT NULL AND evidence != '';
```

---

## 📚 References

- [Spring Boot File Upload](https://spring.io/guides/gs/uploading-files/)
- [AWS S3 Integration](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3.html)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-java)

---

**Last Updated:** November 18, 2024

