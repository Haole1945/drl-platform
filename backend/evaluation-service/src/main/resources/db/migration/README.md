# Database Migrations Guide

## Overview

This directory contains Flyway database migrations for the evaluation service. Migrations are versioned and applied automatically on application startup.

## Directory Structure

```
db/migration/
├── V1__Create_evaluation_tables.sql          # Initial schema
├── V2__Insert_initial_data.sql               # Seed data
├── V3__Create_notifications_table.sql        # Notifications
├── V4__add_target_classes_to_rubrics.sql     # Rubric targeting
├── V6__move_target_to_period.sql             # Period targeting
├── V7__add_rejection_level.sql               # Smart resubmit
├── V8__add_created_by_to_evaluations.sql     # Audit trail
├── TEMPLATE__migration_template.sql          # Template for new migrations
├── TEMPLATE__rollback_template.sql           # Template for rollbacks
├── rollback/                                 # Rollback scripts (manual)
│   ├── U7__rollback_add_rejection_level.sql
│   └── U8__rollback_add_created_by_to_evaluations.sql
└── README.md                                 # This file
```

## Naming Convention

### Forward Migrations (Auto-applied by Flyway)

- Format: `V{version}__{description}.sql`
- Example: `V9__add_email_to_users.sql`
- Rules:
  - Version must be unique and sequential
  - Use double underscore `__` after version
  - Use snake_case for description
  - Never modify after applied to production

### Rollback Scripts (Manual only)

- Format: `U{version}__rollback_{description}.sql`
- Example: `U9__rollback_add_email_to_users.sql`
- Location: `rollback/` subdirectory
- Rules:
  - Must match corresponding V{version}
  - Never auto-applied by Flyway
  - Must be run manually if needed

## Creating a New Migration

### Step 1: Copy Template

```bash
cp TEMPLATE__migration_template.sql V9__your_migration_name.sql
```

### Step 2: Fill in Details

```sql
-- Update header
-- Version: V9
-- Description: Add email column to users
-- Date: 2025-11-29
-- Author: Your Name

-- Update pre-checks
-- Update migration SQL
-- Update post-validation
```

### Step 3: Create Rollback Script

```bash
cp TEMPLATE__rollback_template.sql rollback/U9__rollback_your_migration_name.sql
```

### Step 4: Test Locally

```bash
# Start fresh database
docker-compose down
docker volume rm infra_dbdata
docker-compose up -d

# Check migration applied
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT version, description, success FROM flyway_schema_history;"
```

### Step 5: Test Rollback (if needed)

```bash
# Run rollback script manually
docker exec -it drl-postgres psql -U drl -d drl -f /path/to/rollback/U9__rollback_your_migration_name.sql
```

## Migration Best Practices

### ✅ DO:

1. **Always backup** before data migrations
2. **Add validation** checks before and after
3. **Use transactions** for atomic operations
4. **Add comments** to explain complex logic
5. **Test on staging** before production
6. **Create rollback** scripts for all migrations
7. **Make idempotent** when possible
8. **Document** breaking changes

### ❌ DON'T:

1. **Never modify** applied migrations
2. **Never delete** migration files
3. **Don't skip** version numbers
4. **Don't use** dynamic SQL in migrations
5. **Don't assume** data state
6. **Don't forget** to add indexes
7. **Don't ignore** warnings

## Migration Checklist

Before creating a migration:

- [ ] Copied from template
- [ ] Updated version number (sequential)
- [ ] Added clear description
- [ ] Added pre-migration checks
- [ ] Added post-migration validation
- [ ] Created backup if modifying data
- [ ] Added indexes for new columns
- [ ] Added comments for documentation
- [ ] Created corresponding rollback script
- [ ] Tested on local database
- [ ] Tested rollback script
- [ ] Reviewed by team member

## Common Patterns

### Adding a Column

```sql
-- With default value (safe for existing rows)
ALTER TABLE users
ADD COLUMN email VARCHAR(255) DEFAULT NULL;

-- Add index
CREATE INDEX idx_users_email ON users(email);

-- Add constraint
ALTER TABLE users
ADD CONSTRAINT chk_email_format
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
```

### Migrating Data

```sql
-- Backup first
CREATE TABLE users_backup_v9 AS SELECT * FROM users;

-- Migrate data
UPDATE users
SET new_column = CASE
    WHEN condition THEN value1
    ELSE value2
END;

-- Validate
DO $$
DECLARE
    unmigrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated
    FROM users WHERE new_column IS NULL AND old_column IS NOT NULL;

    IF unmigrated > 0 THEN
        RAISE WARNING '% rows not migrated', unmigrated;
    END IF;
END $$;
```

### Adding a Table

```sql
CREATE TABLE IF NOT EXISTS new_table (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_new_table_name ON new_table(name);

-- Add foreign keys
ALTER TABLE new_table
ADD CONSTRAINT fk_new_table_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Rollback Procedure

### When to Rollback:

- Migration causes errors in production
- Data corruption detected
- Performance issues
- Need to revert feature

### How to Rollback:

1. **Stop the application**

```bash
docker-compose stop evaluation-service
```

2. **Backup current state**

```bash
docker exec -it drl-postgres pg_dump -U drl drl > backup_before_rollback.sql
```

3. **Run rollback script**

```bash
docker exec -it drl-postgres psql -U drl -d drl -f /path/to/rollback/UX__rollback_script.sql
```

4. **Verify rollback**

```bash
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT * FROM information_schema.columns WHERE table_name = 'your_table';"
```

5. **Update Flyway history** (if needed)

```sql
DELETE FROM flyway_schema_history WHERE version = 'X';
```

6. **Restart application**

```bash
docker-compose start evaluation-service
```

## Troubleshooting

### Migration Failed

```bash
# Check Flyway history
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"

# Check for failed migrations
docker exec -it drl-postgres psql -U drl -d drl -c "SELECT * FROM flyway_schema_history WHERE success = false;"

# Fix and retry
# 1. Fix the migration file
# 2. Delete failed entry from flyway_schema_history
# 3. Restart service
```

### Checksum Mismatch

```bash
# This happens if you modify an applied migration
# Solution: Never modify applied migrations!
# If absolutely necessary:
# 1. Update checksum in flyway_schema_history
# 2. Or use Flyway repair command
```

## Version History

| Version | Description      | Date       | Author |
| ------- | ---------------- | ---------- | ------ |
| V1      | Initial schema   | 2025-11-29 | Team   |
| V2      | Seed data        | 2025-11-29 | Team   |
| V3      | Notifications    | 2025-11-29 | Team   |
| V4      | Rubric targeting | 2025-11-29 | Team   |
| V6      | Period targeting | 2025-11-29 | Team   |
| V7      | Smart resubmit   | 2025-11-29 | Team   |
| V8      | Audit trail      | 2025-11-29 | Team   |

## Resources

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Migration Examples](../../../../../../../docs/MIGRATION_EXAMPLES.md)

## Support

For questions or issues:

1. Check this README
2. Review migration examples
3. Ask team lead
4. Create issue in project tracker
