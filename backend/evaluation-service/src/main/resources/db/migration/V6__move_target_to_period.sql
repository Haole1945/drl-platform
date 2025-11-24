-- Move targetClasses from rubrics to evaluation_periods
-- This allows each period to have its own rubric and target

-- Step 1: Add new columns to evaluation_periods
ALTER TABLE evaluation_periods 
ADD COLUMN rubric_id BIGINT,
ADD COLUMN target_classes TEXT;

-- Step 2: Add foreign key constraint
ALTER TABLE evaluation_periods
ADD CONSTRAINT fk_period_rubric 
FOREIGN KEY (rubric_id) REFERENCES rubrics(id);

-- Step 3: Migrate existing data
-- For each active period, link it to the active rubric and copy targetClasses
UPDATE evaluation_periods ep
SET rubric_id = (
    SELECT id FROM rubrics 
    WHERE is_active = true 
    AND academic_year = ep.academic_year 
    LIMIT 1
),
target_classes = (
    SELECT target_classes FROM rubrics 
    WHERE is_active = true 
    AND academic_year = ep.academic_year 
    LIMIT 1
)
WHERE ep.is_active = true 
  AND ep.start_date <= CURRENT_DATE 
  AND ep.end_date >= CURRENT_DATE;

-- Step 4: Remove targetClasses from rubrics (keep for now, will remove later)
-- ALTER TABLE rubrics DROP COLUMN target_classes;

-- Step 5: Add index for performance
CREATE INDEX idx_period_rubric ON evaluation_periods(rubric_id);
CREATE INDEX idx_period_target ON evaluation_periods(target_classes);
