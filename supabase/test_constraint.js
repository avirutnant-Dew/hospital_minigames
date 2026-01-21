const SUPABASE_URL = "https://pgvyvokqtwsbybfjwbgo.supabase.co";
const SERVICE_TOKEN = "sb_secret_oEu9SWuf8eAcN50IOIkBSw_mV4cRKOP";

async function testConstraint() {
    console.log("Testing database insert for HOSPITAL_NETWORK...");
    try {
        // First get a valid team ID
        const teamsRes = await fetch(`${SUPABASE_URL}/rest/v1/teams?select=id&limit=1`, {
            headers: { 'apikey': SERVICE_TOKEN, 'Authorization': `Bearer ${SERVICE_TOKEN}` }
        });
        const teams = await teamsRes.json();
        if (!teams || teams.length === 0) { console.error("No teams found"); return; }
        const teamId = teams[0].id;

        const response = await fetch(`${SUPABASE_URL}/rest/v1/grow_plus_games`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_TOKEN,
                'Authorization': `Bearer ${SERVICE_TOKEN}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                game_type: 'HOSPITAL_NETWORK',
                team_id: teamId,
                is_active: false, // Don't disrupt live game
                ends_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`FAILED: ${response.status} - ${err}`);
        } else {
            console.log("SUCCESS: 'HOSPITAL_NETWORK' inserted successfully. Constraint is NOT the issue.");
        }
    } catch (err) {
        console.error(`Network error: ${err.message}`);
    }
}

testConstraint();
