-- Allow INSERT on challenge_questions (for admin to add questions)
CREATE POLICY "Allow insert on challenge_questions" 
ON public.challenge_questions 
FOR INSERT 
WITH CHECK (true);

-- Allow UPDATE on challenge_questions (for admin to edit questions)
CREATE POLICY "Allow update on challenge_questions" 
ON public.challenge_questions 
FOR UPDATE 
USING (true);

-- Allow DELETE on challenge_questions (for admin to remove questions)
CREATE POLICY "Allow delete on challenge_questions" 
ON public.challenge_questions 
FOR DELETE 
USING (true);

-- Allow DELETE on players (for admin to kick players)
CREATE POLICY "Allow delete on players" 
ON public.players 
FOR DELETE 
USING (true);