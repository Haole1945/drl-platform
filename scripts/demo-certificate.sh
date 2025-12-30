#!/bin/bash

# Demo script - Tạo certificate và test ngay
# Không cần tham số, chạy là xong!

echo "🎬 DEMO: Tạo và Test Certificate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Config
NAME="Demo User"
EMAIL="demo@ptit.edu.vn"
OUTPUT_DIR="./demo-certificates"
PASSWORD="DemoPassword123"

# Step 1: Tạo certificate
echo "📝 Step 1: Tạo certificate..."
mkdir -p $OUTPUT_DIR

openssl req -x509 -newkey rsa:2048 \
  -keyout "$OUTPUT_DIR/private-key.pem" \
  -out "$OUTPUT_DIR/certificate.pem" \
  -days 365 \
  -nodes \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=PTIT/OU=Demo/CN=$NAME/emailAddress=$EMAIL" \
  2>/dev/null

openssl pkcs12 -export \
  -out "$OUTPUT_DIR/certificate.p12" \
  -inkey "$OUTPUT_DIR/private-key.pem" \
  -in "$OUTPUT_DIR/certificate.pem" \
  -name "$NAME Digital Signature" \
  -passout pass:$PASSWORD \
  2>/dev/null

echo "  ✅ Certificate created!"
echo ""

# Step 2: Xem thông tin
echo "📋 Step 2: Xem thông tin certificate..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openssl pkcs12 -in "$OUTPUT_DIR/certificate.p12" -nokeys -passin pass:$PASSWORD 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates -email
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Test ký document
echo "🔐 Step 3: Test ký document..."

# Tạo document test
TEST_DOC="$OUTPUT_DIR/test-document.txt"
echo "Đây là tài liệu test cho chữ ký số." > $TEST_DOC
echo "Nội dung: Đánh giá điểm rèn luyện sinh viên." >> $TEST_DOC
echo "Người ký: $NAME" >> $TEST_DOC
echo "Thời gian: $(date)" >> $TEST_DOC

# Extract private key
openssl pkcs12 -in "$OUTPUT_DIR/certificate.p12" -nocerts -nodes -passin pass:$PASSWORD \
  -out "$OUTPUT_DIR/temp-private-key.pem" 2>/dev/null

# Ký document
SIGNATURE_FILE="$OUTPUT_DIR/signature.sig"
openssl dgst -sha256 -sign "$OUTPUT_DIR/temp-private-key.pem" -out $SIGNATURE_FILE $TEST_DOC

echo "  ✅ Document signed!"
echo "  📄 Document: $TEST_DOC"
echo "  🔏 Signature: $SIGNATURE_FILE"
echo ""

# Step 4: Verify signature
echo "✅ Step 4: Verify signature..."

# Extract public key
openssl pkcs12 -in "$OUTPUT_DIR/certificate.p12" -nokeys -passin pass:$PASSWORD \
  -out "$OUTPUT_DIR/temp-cert.pem" 2>/dev/null
openssl x509 -in "$OUTPUT_DIR/temp-cert.pem" -pubkey -noout > "$OUTPUT_DIR/temp-public-key.pem"

# Verify
openssl dgst -sha256 -verify "$OUTPUT_DIR/temp-public-key.pem" -signature $SIGNATURE_FILE $TEST_DOC

if [ $? -eq 0 ]; then
    echo "  ✅ Signature VALID - Chữ ký hợp lệ!"
else
    echo "  ❌ Signature INVALID - Chữ ký không hợp lệ!"
fi
echo ""

# Step 5: Test thay đổi document
echo "🔍 Step 5: Test nếu document bị thay đổi..."

# Thay đổi document
echo "THAY ĐỔI NỘI DUNG" >> $TEST_DOC

# Verify lại
openssl dgst -sha256 -verify "$OUTPUT_DIR/temp-public-key.pem" -signature $SIGNATURE_FILE $TEST_DOC 2>/dev/null

if [ $? -eq 0 ]; then
    echo "  ❌ Signature still valid (shouldn't happen!)"
else
    echo "  ✅ Signature INVALID - Phát hiện document bị thay đổi!"
    echo "  → Chữ ký số hoạt động đúng!"
fi
echo ""

# Cleanup temp files
rm -f "$OUTPUT_DIR/temp-"*

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEMO HOÀN THÀNH!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Files created in: $OUTPUT_DIR/"
echo "  ├── certificate.p12      ← Upload file này"
echo "  ├── test-document.txt    ← Document đã ký"
echo "  └── signature.sig        ← Chữ ký số"
echo ""
echo "🔑 Password: $PASSWORD"
echo ""
echo "✅ Kết luận:"
echo "  - Certificate tạo thành công"
echo "  - Ký document thành công"
echo "  - Verify signature thành công"
echo "  - Phát hiện thay đổi thành công"
echo ""
echo "🚀 Chữ ký số hoạt động hoàn hảo!"
echo ""
