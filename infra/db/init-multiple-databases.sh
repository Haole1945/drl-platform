#!/bin/bash
set -e

# Create databases for each service
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create auth-service database
    CREATE DATABASE drl_auth;
    
    -- Create student-service database
    CREATE DATABASE drl_student;
    
    -- Create evaluation-service database
    CREATE DATABASE drl_evaluation;
    
    -- Create ai-validation-service database
    CREATE DATABASE drl_ai_validation;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE drl_auth TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_student TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_evaluation TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE drl_ai_validation TO $POSTGRES_USER;
EOSQL

echo "Multiple databases created successfully!"

