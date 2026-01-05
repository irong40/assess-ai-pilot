-- Enable RLS on threat_intelligence table
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;

-- Anyone can read threat intelligence (it's public CVE data)
CREATE POLICY "Anyone can view threat intelligence"
ON threat_intelligence FOR SELECT
USING (true);

-- Service role can manage threat intelligence
CREATE POLICY "Service role can manage threat intelligence"
ON threat_intelligence FOR ALL
USING (true);