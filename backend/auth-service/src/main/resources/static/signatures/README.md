# Sample Signatures

This folder contains sample signature images for testing purposes.

## Required Files

Place the following sample signature images in this folder:

1. `sample-advisor-signature.png` - Sample signature for advisor/CVHT
2. `sample-class-monitor-signature.png` - Sample signature for class monitor

## Image Requirements

- Format: PNG (transparent background recommended)
- Size: Recommended 200x100 pixels
- File size: < 100KB

## How to Create Sample Signatures

You can:

1. Draw a signature using any drawing tool
2. Use an online signature generator
3. Create a simple text-based signature image

## Migration

The migration `V15__seed_sample_signatures.sql` will automatically assign these signatures to:

- Advisor users (username: advisor, cvht, gvcn, gvhd)
- Class monitor users (username: loptruong, monitor, N21DCCN001)

## For Production

In production, users should upload their own signatures through the profile page.
These sample signatures are for development/testing only.
