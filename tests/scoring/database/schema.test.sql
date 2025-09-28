-- Schema Test Suite for Scoring Engine
-- Tests all table structures, constraints, and relationships
-- Following TDD approach: RED phase - these tests should FAIL initially

-- Test 1: scoring_rubrics table structure and constraints
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_rubrics') THEN
        RAISE EXCEPTION 'scoring_rubrics table does not exist';
    END IF;

    -- Test required columns exist with correct types
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_rubrics.id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'provider' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_rubrics.provider column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'level' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_rubrics.level column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'task' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_rubrics.task column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'version' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_rubrics.version column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_rubrics' AND column_name = 'json' AND data_type = 'jsonb') THEN
        RAISE EXCEPTION 'scoring_rubrics.json column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_rubrics table structure: PASS';
END $$;

-- Test 2: scoring_attempts table structure and constraints
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_attempts') THEN
        RAISE EXCEPTION 'scoring_attempts table does not exist';
    END IF;

    -- Test required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempts' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_attempts.id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempts' AND column_name = 'tenant_id' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_attempts.tenant_id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempts' AND column_name = 'status' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_attempts.status column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempts' AND column_name = 'rubric_id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_attempts.rubric_id column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_attempts table structure: PASS';
END $$;

-- Test 3: scoring_attempt_events table structure
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_attempt_events') THEN
        RAISE EXCEPTION 'scoring_attempt_events table does not exist';
    END IF;

    -- Test required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempt_events' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_attempt_events.id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempt_events' AND column_name = 'attempt_id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_attempt_events.attempt_id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_attempt_events' AND column_name = 'type' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_attempt_events.type column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_attempt_events table structure: PASS';
END $$;

-- Test 4: scoring_correctors table structure
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_correctors') THEN
        RAISE EXCEPTION 'scoring_correctors table does not exist';
    END IF;

    -- Test required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_correctors' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_correctors.id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_correctors' AND column_name = 'name' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_correctors.name column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_correctors table structure: PASS';
END $$;

-- Test 5: scoring_webhooks table structure
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_webhooks') THEN
        RAISE EXCEPTION 'scoring_webhooks table does not exist';
    END IF;

    -- Test required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_webhooks' AND column_name = 'id' AND data_type = 'uuid') THEN
        RAISE EXCEPTION 'scoring_webhooks.id column missing or wrong type';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_webhooks' AND column_name = 'tenant_id' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_webhooks.tenant_id column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_webhooks table structure: PASS';
END $$;

-- Test 6: scoring_settings table structure
DO $$
BEGIN
    -- Test table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scoring_settings') THEN
        RAISE EXCEPTION 'scoring_settings table does not exist';
    END IF;

    -- Test required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scoring_settings' AND column_name = 'tenant_id' AND data_type = 'text') THEN
        RAISE EXCEPTION 'scoring_settings.tenant_id column missing or wrong type';
    END IF;

    RAISE NOTICE 'scoring_settings table structure: PASS';
END $$;

-- Test 7: Check constraints on provider values
DO $$
BEGIN
    -- This will fail until proper constraints are added
    INSERT INTO scoring_rubrics (id, provider, level, task, version, json)
    VALUES (gen_random_uuid(), 'INVALID_PROVIDER', 'B2', 'writing', 'v1', '{}');

    RAISE EXCEPTION 'Provider constraint not working - invalid provider accepted';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Provider constraint: PASS';
    WHEN others THEN
        RAISE EXCEPTION 'Provider constraint test failed with unexpected error';
END $$;

-- Test 8: Check constraints on level values
DO $$
BEGIN
    -- This will fail until proper constraints are added
    INSERT INTO scoring_rubrics (id, provider, level, task, version, json)
    VALUES (gen_random_uuid(), 'EOI', 'INVALID_LEVEL', 'writing', 'v1', '{}');

    RAISE EXCEPTION 'Level constraint not working - invalid level accepted';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Level constraint: PASS';
    WHEN others THEN
        RAISE EXCEPTION 'Level constraint test failed with unexpected error';
END $$;

-- Test 9: Check constraints on task values
DO $$
BEGIN
    -- This will fail until proper constraints are added
    INSERT INTO scoring_rubrics (id, provider, level, task, version, json)
    VALUES (gen_random_uuid(), 'EOI', 'B2', 'INVALID_TASK', 'v1', '{}');

    RAISE EXCEPTION 'Task constraint not working - invalid task accepted';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Task constraint: PASS';
    WHEN others THEN
        RAISE EXCEPTION 'Task constraint test failed with unexpected error';
END $$;

-- Test 10: Check constraints on status values
DO $$
BEGIN
    -- This will fail until proper constraints are added
    INSERT INTO scoring_attempts (id, tenant_id, provider, level, task, status, rubric_id, rubric_ver, model_name)
    VALUES (gen_random_uuid(), 'test', 'EOI', 'B2', 'writing', 'INVALID_STATUS', gen_random_uuid(), 'v1', 'gpt-4o-mini');

    RAISE EXCEPTION 'Status constraint not working - invalid status accepted';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Status constraint: PASS';
    WHEN others THEN
        RAISE EXCEPTION 'Status constraint test failed with unexpected error';
END $$;

-- Test 11: Foreign key constraints
DO $$
DECLARE
    test_rubric_id UUID := gen_random_uuid();
    test_attempt_id UUID := gen_random_uuid();
BEGIN
    -- Test foreign key constraint from scoring_attempts to scoring_rubrics
    INSERT INTO scoring_attempts (id, tenant_id, provider, level, task, status, rubric_id, rubric_ver, model_name)
    VALUES (test_attempt_id, 'test', 'EOI', 'B2', 'writing', 'queued', test_rubric_id, 'v1', 'gpt-4o-mini');

    RAISE EXCEPTION 'Foreign key constraint not working - invalid rubric_id accepted';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key constraint: PASS';
    WHEN others THEN
        RAISE EXCEPTION 'Foreign key constraint test failed with unexpected error';
END $$;

-- Test 12: Index existence
DO $$
BEGIN
    -- Test primary lookup indexes exist
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'scoring_attempts' AND indexname = 'idx_sc_attempts_status') THEN
        RAISE EXCEPTION 'Index idx_sc_attempts_status does not exist';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'scoring_attempts' AND indexname = 'idx_sc_attempts_plt') THEN
        RAISE EXCEPTION 'Index idx_sc_attempts_plt does not exist';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'scoring_rubrics' AND indexname = 'idx_sc_rubrics_active') THEN
        RAISE EXCEPTION 'Index idx_sc_rubrics_active does not exist';
    END IF;

    RAISE NOTICE 'Database indexes: PASS';
END $$;

-- Test Results Summary
DO $$
BEGIN
    RAISE NOTICE '=== SCHEMA TEST RESULTS ===';
    RAISE NOTICE 'All tests completed successfully';
    RAISE NOTICE 'Database schema meets requirements';
END $$;