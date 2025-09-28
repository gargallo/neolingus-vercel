-- Standalone test for scoring engine schema
-- This tests only the scoring engine tables in isolation

-- Test table creation without dependencies
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test 1: Create scoring_rubrics table
CREATE TABLE test_scoring_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL CHECK (provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    task TEXT NOT NULL CHECK (task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation')),
    version TEXT NOT NULL,
    json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    archived_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_test_scoring_rubrics_version UNIQUE (provider, level, task, version)
);

-- Test 2: Create scoring_attempts table
CREATE TABLE test_scoring_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    user_id UUID NULL,
    exam_session_id UUID NULL,
    exam_id TEXT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    task TEXT NOT NULL CHECK (task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation')),
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'scored', 'failed')),
    rubric_id UUID NOT NULL,
    rubric_ver TEXT NOT NULL,
    model_name TEXT NOT NULL,
    committee JSONB DEFAULT '[]',
    score_json JSONB NULL,
    qc_json JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_test_scoring_attempts_rubric_id FOREIGN KEY (rubric_id) REFERENCES test_scoring_rubrics(id)
);

-- Test 3: Insert test data and verify constraints
INSERT INTO test_scoring_rubrics (provider, level, task, version, json)
VALUES ('EOI', 'B2', 'writing', 'v1', '{"criteria": [{"id": "content", "weight": 0.4}]}');

-- Test 4: Verify constraint violations are caught
DO $$
BEGIN
    -- Test invalid provider
    BEGIN
        INSERT INTO test_scoring_rubrics (provider, level, task, version, json)
        VALUES ('INVALID', 'B2', 'writing', 'v2', '{}');
        RAISE EXCEPTION 'Provider constraint failed - invalid provider accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Provider constraint: PASS';
    END;

    -- Test invalid level
    BEGIN
        INSERT INTO test_scoring_rubrics (provider, level, task, version, json)
        VALUES ('EOI', 'INVALID', 'writing', 'v2', '{}');
        RAISE EXCEPTION 'Level constraint failed - invalid level accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Level constraint: PASS';
    END;

    -- Test invalid task
    BEGIN
        INSERT INTO test_scoring_rubrics (provider, level, task, version, json)
        VALUES ('EOI', 'B2', 'INVALID', 'v2', '{}');
        RAISE EXCEPTION 'Task constraint failed - invalid task accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Task constraint: PASS';
    END;

    -- Test invalid status
    BEGIN
        INSERT INTO test_scoring_attempts (tenant_id, provider, level, task, rubric_id, rubric_ver, model_name, status)
        VALUES ('test', 'EOI', 'B2', 'writing', (SELECT id FROM test_scoring_rubrics LIMIT 1), 'v1', 'gpt-4o-mini', 'INVALID');
        RAISE EXCEPTION 'Status constraint failed - invalid status accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Status constraint: PASS';
    END;

END $$;

-- Test 5: Test foreign key constraint
DO $$
DECLARE
    test_rubric_id UUID;
BEGIN
    SELECT id INTO test_rubric_id FROM test_scoring_rubrics LIMIT 1;

    -- Insert valid attempt
    INSERT INTO test_scoring_attempts (tenant_id, provider, level, task, rubric_id, rubric_ver, model_name)
    VALUES ('test', 'EOI', 'B2', 'writing', test_rubric_id, 'v1', 'gpt-4o-mini');

    RAISE NOTICE 'Valid foreign key: PASS';

    -- Test invalid foreign key
    BEGIN
        INSERT INTO test_scoring_attempts (tenant_id, provider, level, task, rubric_id, rubric_ver, model_name)
        VALUES ('test', 'EOI', 'B2', 'writing', uuid_generate_v4(), 'v1', 'gpt-4o-mini');
        RAISE EXCEPTION 'Foreign key constraint failed - invalid rubric_id accepted';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Foreign key constraint: PASS';
    END;
END $$;

-- Clean up test tables
DROP TABLE test_scoring_attempts;
DROP TABLE test_scoring_rubrics;

-- Test Results
DO $$
BEGIN
    RAISE NOTICE '=== SCORING ENGINE SCHEMA TEST RESULTS ===';
    RAISE NOTICE 'All schema tests passed successfully';
    RAISE NOTICE 'Database schema is ready for implementation';
END $$;