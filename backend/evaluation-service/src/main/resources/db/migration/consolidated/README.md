# Consolidated Migrations

## Overview

This directory contains **consolidated** database migrations that combine all incremental migrations (V1-V8) into 2 clean files:

1. **V1\_\_create_complete_schema.sql** - Complete database schema
2. **V2\_\_insert_seed_data.sql** - Test/seed data

## Why Consolidated?

### Problems with Incremental Migrations:

- ❌ 8 separate files (V1-V8) to understand schema
- ❌ Missing V5 (gap in versions)
- ❌ Hard to see complete picture
- ❌ Difficult to setup fresh database

### Benefits of Consolidated:

- ✅ 2 files only - easy to understand
- ✅ Complete schema in one place
- ✅ Separate schema from data
- ✅ Fast fresh database setup
- ✅ Better for new developers

## File Structure

```
consolidated/
├── V1__create_complete_schema.sql    # All tables, indexes, constraints
├── V2__insert_seed_data.sql          # Test data
└── README.md                          # This file
```

## What's Included

### V1 - Complete Schema:

- ✅ All 8 tables (rubrics, criteria, evaluations, etc.)
- ✅ All indexes for performance
- ✅ All foreign keys and constraints
- ✅ All comments for documentation
- ✅ Validation checks
- ✅ Includes features from V1-V8:
  - Evaluation system
  - Notifications
  - Rubric targeting
  - Period targeting
  - Smart resubmit (rejection levels)
  - Audit trail (created_by)

### V2 - Seed Data:

- ✅ Sample evaluation periods
- ✅ Sample rubric
- ✅ Sample criteria (5 criteria)
- ✅ Links rubric to period
- ✅ Optional: Sample evaluations (commented out)

## How to Use

### Option 1: Fresh Database (Recommended for new projects)

1. **Backup old migrations** (if you have existing data):

```bash
# Move old migrations to backup
mkdir -p ../backup
mv ../V*.sql ../backup/
```

2. **Copy consolidated migrations**:

```bash
# Copy to main migration directory
cp V1__create_complete_schema.sql ../
cp V2__insert_seed_data.sql ../
```

3. **Reset database**:

```bash
docker-compose down
docker volume rm infra_dbdata
docker-compose up -d
```

4. **Verify**:

```bash
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT version, description, success FROM flyway_schema_history;"
```

You should see:

```
 version |        description        | success
---------+---------------------------+---------
 1       | create complete schema    | t
 2       | insert seed data          | t
```

### Option 2: Keep Existing Migrations (For production)

**DON'T** replace existing migrations if you have production data!

Use consolidated migrations only for:

- New environments
- Development databases
- Testing
- Documentation reference

## Mapping: Old → New

| Old Migrations | New Migration     | What it does                  |
| -------------- | ----------------- | ----------------------------- |
| V1             | V1 (consolidated) | Create evaluation tables      |
| V2             | V2 (consolidated) | Insert seed data              |
| V3             | V1 (consolidated) | Create notifications table    |
| V4             | V1 (consolidated) | Add target_classes to rubrics |
| V5             | (missing)         | -                             |
| V6             | V1 (consolidated) | Move target to period         |
| V7             | V1 (consolidated) | Add rejection level           |
| V8             | V1 (consolidated) | Add created_by                |

## Schema Overview

### Tables Created:

1. **rubrics** - Evaluation templates
2. **criteria** - Scoring criteria
3. **evaluation_periods** - Submission periods
4. **evaluations** - Student evaluations
5. **evaluation_details** - Scores per criteria
6. **evaluation_history** - Audit trail
7. **evidence_files** - File uploads
8. **notifications** - User notifications

### Key Features:

- **Smart Resubmit**: `last_rejection_level` tracks where evaluation was rejected
- **Audit Trail**: `created_by` and `evaluation_history` track changes
- **Flexible Targeting**: `target_classes` on rubrics and periods
- **Performance**: 20+ indexes for fast queries
- **Documentation**: Comments on all tables and key columns

## Validation

Both migrations include validation checks:

### V1 Validation:

```sql
-- Checks that all 8 tables were created
-- Raises exception if any table is missing
```

### V2 Validation:

```sql
-- Reports count of periods, rubrics, criteria
-- Warns if no data was inserted
```

## Troubleshooting

### Migration Failed

**Check Flyway history:**

```bash
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT * FROM flyway_schema_history WHERE success = false;"
```

**Fix and retry:**

1. Fix the SQL error
2. Delete failed entry: `DELETE FROM flyway_schema_history WHERE version = 'X';`
3. Restart service

### Want to Add More Seed Data

Edit `V2__insert_seed_data.sql`:

- Uncomment sample evaluation section
- Add your own test data
- Use `INSERT ... WHERE NOT EXISTS` pattern

### Need to Rollback

See `../rollback/` directory for rollback scripts.

## Best Practices

### ✅ DO:

- Use consolidated migrations for **new** projects
- Keep old migrations for **existing** production databases
- Test on staging before production
- Backup before any migration

### ❌ DON'T:

- Replace migrations in production without backup
- Modify these files after they're applied
- Delete old migrations if you have production data

## Future Migrations

For new features, create incremental migrations:

```bash
# Copy template
cp ../TEMPLATE__migration_template.sql ../V3__your_new_feature.sql

# Edit V3 with your changes
# Create rollback script
cp ../TEMPLATE__rollback_template.sql ../rollback/U3__rollback_your_new_feature.sql
```

New migrations will be V3, V4, V5... (continuing from V2 seed data)

## Questions?

- Check main migration README: `../README.md`
- Check examples: `../../../../../../../../docs/MIGRATION_EXAMPLES.md`
- Ask team lead

---

**Last Updated:** 2025-11-29
**Status:** Ready for use
