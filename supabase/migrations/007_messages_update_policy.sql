-- Allow coaches to update their own thread messages (for actions_applied flag)
CREATE POLICY "sp_messages_update" ON sp_assistant_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sp_assistant_threads t
      WHERE t.id = sp_assistant_messages.thread_id
      AND t.user_id = auth.uid()
    )
  );

-- Allow coaches to update their own threads (for title updates)
CREATE POLICY "sp_threads_update" ON sp_assistant_threads
  FOR UPDATE USING (user_id = auth.uid());
