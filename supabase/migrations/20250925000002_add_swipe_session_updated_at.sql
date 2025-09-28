-- Add updated_at column to swipe_sessions table
-- This column is expected by the SwipeSessionModel for tracking session modifications

ALTER TABLE public.swipe_sessions
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Create index for updated_at column for performance
CREATE INDEX idx_swipe_sessions_updated_at ON public.swipe_sessions(updated_at);

-- Create compound index for common queries
CREATE INDEX idx_swipe_sessions_user_updated ON public.swipe_sessions(user_id, updated_at DESC);

-- Update existing records to have the current timestamp
UPDATE public.swipe_sessions SET updated_at = NOW() WHERE updated_at IS NULL;