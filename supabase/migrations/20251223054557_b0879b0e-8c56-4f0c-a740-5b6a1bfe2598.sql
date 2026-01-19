-- Allow DELETE on news_ticker (for admin to clear news)
CREATE POLICY "Allow delete on news_ticker" 
ON public.news_ticker 
FOR DELETE 
USING (true);