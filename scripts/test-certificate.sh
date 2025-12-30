#!/bin/bash

# Script to test/verify certificate
# Usage: ./test-certificate.sh certificates/certificate.p12

CERT_FILE=${1:-"certificates/certificate.p12"}
PASSWORD=${2:-"DigitalSignature2024"}

if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate file not found: $CERT_FILE"
    exit 1
fi

echo "🔍 Testing Certificate: $CERT_FILE"
echo ""

# Extract certificate info
echo "📋 Certificate Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openssl pkcs12 -in "$CERT_FILE" -nokeys -passin pass:$PASSWORD | openssl x509 -noout -subject -issuer -dates -email
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if certificate is valid
echo "✅ Certificate Validation:"
CURRENT_DATE=$(date +%s)
NOT_BEFORE=$(openssl pkcs12 -in "$CERT_FILE" -nokeys -passin pass:$PASSWORD | openssl x509 -noout -startdate | cut -d= -f2)
NOT_AFTER=$(openssl pkcs12 -in "$CERT_FILE" -nokeys -passin pass:$PASSWORD | openssl x509 -noout -enddate | cut -d= -f2)

NOT_BEFORE_EPOCH=$(date -d "$NOT_BEFORE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$NOT_BEFORE" +%s 2>/dev/null)
NOT_AFTER_EPOCH=$(date -d "$NOT_AFTER" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)

if [ $CURRENT_DATE -ge $NOT_BEFORE_EPOCH ] && [ $CURRENT_DATE -le $NOT_AFTER_EPOCH ]; then
    echo "  ✅ Certificate is VALID"
    DAYS_LEFT=$(( ($NOT_AFTER_EPOCH - $CURRENT_DATE) / 86400 ))
    echo "  📅 Days remaining: $DAYS_LEFT days"
else
    echo "  ❌ Certificate is EXPIRED or NOT YET VALID"
fi
echo ""

# Test signing
echo "🔐 Testing Digital Signature:"
TEST_FILE="test-document.txt"
SIGNATURE_FILE="test-signature.sig"

# Create test document
echo "This is a test document for digital signature verification." > $TEST_FILE

# Extract private key
openssl pkcs12 -in "$CERT_FILE" -nocerts -nodes -passin pass:$PASSWORD -out temp-private-key.pem 2>/dev/null

# Sign the document
openssl dgst -sha256 -sign temp-private-key.pem -out $SIGNATURE_FILE $TEST_FILE

if [ $? -eq 0 ]; then
    echo "  ✅ Document signed successfully"
    
    # Extract public key for verification
    openssl pkcs12 -in "$CERT_FILE" -nokeys -passin pass:$PASSWORD -out temp-cert.pem 2>/dev/null
    openssl x509 -in temp-cert.pem -pubkey -noout > temp-public-key.pem
    
    # Verify signature
    openssl dgst -sha256 -verify temp-public-key.pem -signature $SIGNATURE_FILE $TEST_FILE
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Signature verified successfully"
        echo ""
        echo "🎉 Certificate is working correctly!"
    else
        echo "  ❌ Signature verification failed"
    fi
else
    echo "  ❌ Failed to sign document"
fi

# Cleanup
rm -f temp-private-key.pem temp-cert.pem temp-public-key.pem $TEST_FILE $SIGNATURE_FILE

echo ""
echo "✅ Test completed!"
