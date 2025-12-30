#!/bin/bash

# Script to generate self-signed certificate for digital signature
# Usage: ./generate-certificate.sh "Nguyen Van A" "nguyenvana@ptit.edu.vn"

NAME=${1:-"User Name"}
EMAIL=${2:-"user@ptit.edu.vn"}
OUTPUT_DIR="./certificates"
PASSWORD="DigitalSignature2024"

echo "🔐 Generating Digital Signature Certificate..."
echo "Name: $NAME"
echo "Email: $EMAIL"
echo ""

# Create output directory
mkdir -p $OUTPUT_DIR

# Generate private key and certificate in one command
openssl req -x509 -newkey rsa:2048 \
  -keyout "$OUTPUT_DIR/private-key.pem" \
  -out "$OUTPUT_DIR/certificate.pem" \
  -days 365 \
  -nodes \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=PTIT/OU=IT Department/CN=$NAME/emailAddress=$EMAIL"

# Convert to PKCS#12 format (.p12)
openssl pkcs12 -export \
  -out "$OUTPUT_DIR/certificate.p12" \
  -inkey "$OUTPUT_DIR/private-key.pem" \
  -in "$OUTPUT_DIR/certificate.pem" \
  -name "$NAME Digital Signature" \
  -passout pass:$PASSWORD

echo ""
echo "✅ Certificate generated successfully!"
echo ""
echo "📁 Files created:"
echo "  - $OUTPUT_DIR/private-key.pem (Private Key)"
echo "  - $OUTPUT_DIR/certificate.pem (Certificate)"
echo "  - $OUTPUT_DIR/certificate.p12 (PKCS#12 - Upload this file)"
echo ""
echo "🔑 Password for .p12 file: $PASSWORD"
echo ""
echo "📤 Upload 'certificate.p12' to the system"
echo "🔐 Use password '$PASSWORD' when uploading"
