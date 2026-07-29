package alpgo

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const (
	GovernanceDir = ".governance"
	BallotsFile   = "ballots.jsonl"
)

type Vote struct {
	VoterDid   string
	BallotID   string
	Value      string
	Rationale  string
	Timestamp  string
	Signature  string
}

func NewVote(voterDid, ballotID, value, rationale, timestamp, signature string) *Vote {
	if rationale == "" {
		rationale = ""
	}
	if timestamp == "" {
		timestamp = time.Now().Format(time.RFC3339)
	}
	if signature == "" {
		signature = ""
	}
	return &Vote{
		VoterDid:  voterDid,
		BallotID:  ballotID,
		Value:     value,
		Rationale: rationale,
		Timestamp: timestamp,
		Signature: signature,
	}
}

func (v *Vote) ToDict() map[string]any {
	return map[string]any{
		"voter_did":  v.VoterDid,
		"ballot_id":  v.BallotID,
		"value":      v.Value,
		"rationale":  v.Rationale,
		"timestamp":  v.Timestamp,
		"signature":  v.Signature,
	}
}

func (v *Vote) Sign(privateKey string) string {
	// Simplified signing for Go without external crypto libs beyond stdlib
	payload := fmt.Sprintf("{\"ballot_id\":\"%s\",\"rationale\":\"%s\",\"timestamp\":\"%s\",\"value\":\"%s\",\"voter_did\":\"%s\"}",
		v.BallotID, v.Rationale, v.Timestamp, v.Value, v.VoterDid)
	v.Signature = sha256Hex(payload + privateKey)
	return v.Signature
}

type BallotRecord struct {
	BallotID    string
	PolicyID    string
	Description string
	Votes       []*Vote
	Status      string
	Quorum      int
	CreatedAt   string
	ClosedAt    string
}

func NewBallotRecord(ballotID, policyID, description string, votes []*Vote, status string, quorum int, createdAt, closedAt string) *BallotRecord {
	if status == "" {
		status = "open"
	}
	if createdAt == "" {
		createdAt = time.Now().Format(time.RFC3339)
	}
	return &BallotRecord{
		BallotID:    ballotID,
		PolicyID:    policyID,
		Description: description,
		Votes:       votes,
		Status:      status,
		Quorum:      quorum,
		CreatedAt:   createdAt,
		ClosedAt:    closedAt,
	}
}

func (b *BallotRecord) ToDict() map[string]any {
	voteDicts := []map[string]any{}
	for _, v := range b.Votes {
		voteDicts = append(voteDicts, v.ToDict())
	}
	return map[string]any{
		"ballot_id":   b.BallotID,
		"policy_id":   b.PolicyID,
		"description": b.Description,
		"votes":       voteDicts,
		"status":      b.Status,
		"quorum":      b.Quorum,
		"created_at":  b.CreatedAt,
		"closed_at":   b.ClosedAt,
	}
}

func (b *BallotRecord) Tally() map[string]int {
	counts := map[string]int{"approve": 0, "reject": 0, "abstain": 0}
	for _, v := range b.Votes {
		if _, ok := counts[v.Value]; !ok {
			counts[v.Value] = 0
		}
		counts[v.Value]++
	}
	counts["total"] = len(b.Votes)
	return counts
}

type GovernanceReport struct {
	BallotID   string
	Result     string
	Tally      map[string]int
	StartedAt  string
	FinishedAt string
}

func NewGovernanceReport(ballotID, result string, tally map[string]int, startedAt, finishedAt string) *GovernanceReport {
	if startedAt == "" {
		startedAt = time.Now().Format(time.RFC3339)
	}
	if finishedAt == "" {
		finishedAt = time.Now().Format(time.RFC3339)
	}
	return &GovernanceReport{
		BallotID:   ballotID,
		Result:     result,
		Tally:      tally,
		StartedAt:  startedAt,
		FinishedAt: finishedAt,
	}
}

func (g *GovernanceReport) ToDict() map[string]any {
	return map[string]any{
		"ballot_id":  g.BallotID,
		"result":     g.Result,
		"tally":      g.Tally,
		"started_at": g.StartedAt,
		"finished_at": g.FinishedAt,
	}
}

type PolicyBallot struct {
	AlpDir  string
	Ballots map[string]*BallotRecord
}

func NewPolicyBallot(alpDir string) *PolicyBallot {
	pb := &PolicyBallot{
		AlpDir:  alpDir,
		Ballots: make(map[string]*BallotRecord),
	}
	pb.Load()
	return pb
}

func (p *PolicyBallot) ballotsPath() string {
	return filepath.Join(p.AlpDir, GovernanceDir, BallotsFile)
}

func (p *PolicyBallot) Load() {
	path := p.ballotsPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	// Simplified: in production, parse JSONL properly
	lines := splitLines(string(data))
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		// In production, parse JSON
		_ = line
	}
}

func (p *PolicyBallot) SaveBallot(ballot *BallotRecord) {
	d := filepath.Join(p.AlpDir, GovernanceDir)
	if err := os.MkdirAll(d, 0755); err != nil {
		return
	}
	// In production, append JSON line
	_ = d
}

func (p *PolicyBallot) OpenBallot(policyID, description string, quorum int) *BallotRecord {
	ballotID := fmt.Sprintf("ballot-%s", randomString(12))
	ballot := NewBallotRecord(ballotID, policyID, description, nil, "open", quorum, "", "")
	p.Ballots[ballotID] = ballot
	p.SaveBallot(ballot)
	return ballot
}

func (p *PolicyBallot) CastVote(ballotID, voterDid, value, rationale, privateKey string) *Vote {
	ballot := p.Ballots[ballotID]
	if ballot == nil || ballot.Status != "open" {
		return nil
	}
	vote := NewVote(voterDid, ballotID, value, rationale, time.Now().Format(time.RFC3339), "")
	if privateKey != "" {
		vote.Sign(privateKey)
	}
	ballot.Votes = append(ballot.Votes, vote)
	p.SaveBallot(ballot)
	return vote
}

func (p *PolicyBallot) CloseBallot(ballotID string) *BallotRecord {
	ballot := p.Ballots[ballotID]
	if ballot == nil || ballot.Status != "open" {
		return nil
	}
	ballot.Status = "closed"
	ballot.ClosedAt = time.Now().Format(time.RFC3339)
	p.SaveBallot(ballot)
	return ballot
}

func (p *PolicyBallot) GetBallot(ballotID string) *BallotRecord {
	return p.Ballots[ballotID]
}

func (p *PolicyBallot) ListBallots() []*BallotRecord {
	ballots := make([]*BallotRecord, 0, len(p.Ballots))
	for _, b := range p.Ballots {
		ballots = append(ballots, b)
	}
	sort.Slice(ballots, func(i, j int) bool {
		return ballots[i].CreatedAt < ballots[j].CreatedAt
	})
	return ballots
}

type GovernanceEngine struct {
	AlpDir          string
	Ballot          *PolicyBallot
	MinQuorum       int
	QualifiedVoters map[string]bool
}

func NewGovernanceEngine(alpDir string, minQuorum int) *GovernanceEngine {
	return &GovernanceEngine{
		AlpDir:          alpDir,
		Ballot:          NewPolicyBallot(alpDir),
		MinQuorum:       minQuorum,
		QualifiedVoters: make(map[string]bool),
	}
}

func NewGovernanceEngineDefault(alpDir string) *GovernanceEngine {
	return NewGovernanceEngine(alpDir, 3)
}

func (g *GovernanceEngine) Qualify(voterDid string) {
	g.QualifiedVoters[voterDid] = true
}

func (g *GovernanceEngine) Disqualify(voterDid string) {
	delete(g.QualifiedVoters, voterDid)
}

func (g *GovernanceEngine) Propose(policyID, description string, quorum *int) *BallotRecord {
	effectiveQuorum := g.MinQuorum
	if quorum != nil {
		effectiveQuorum = max(*quorum, len(g.QualifiedVoters)/2+1)
	} else {
		effectiveQuorum = max(g.MinQuorum, len(g.QualifiedVoters)/2+1)
	}
	return g.Ballot.OpenBallot(policyID, description, effectiveQuorum)
}

func (g *GovernanceEngine) Vote(ballotID, voterDid, value, rationale, privateKey string) map[string]any {
	if !g.QualifiedVoters[voterDid] {
		return map[string]any{"accepted": false, "reason": "voter_not_qualified"}
	}
	ballot := g.Ballot.GetBallot(ballotID)
	if ballot == nil || ballot.Status != "open" {
		return map[string]any{"accepted": false, "reason": "ballot_not_open"}
	}
	for _, v := range ballot.Votes {
		if v.VoterDid == voterDid {
			return map[string]any{"accepted": false, "reason": "already_voted"}
		}
	}
	vote := g.Ballot.CastVote(ballotID, voterDid, value, rationale, privateKey)
	if vote == nil {
		return map[string]any{"accepted": false, "reason": "cast_failed"}
	}
	return map[string]any{"accepted": true, "vote": vote.ToDict()}
}

func (g *GovernanceEngine) CloseAndTally(ballotID string) *GovernanceReport {
	ballot := g.Ballot.CloseBallot(ballotID)
	if ballot == nil {
		panic(fmt.Sprintf("Ballot '%s' not found or already closed.", ballotID))
	}
	return g.TallyBallot(ballot)
}

func (g *GovernanceEngine) GetReport(ballotID string) *GovernanceReport {
	ballot := g.Ballot.GetBallot(ballotID)
	if ballot == nil || ballot.Status != "closed" {
		return nil
	}
	return g.TallyBallot(ballot)
}

func (g *GovernanceEngine) ListBallots() []*BallotRecord {
	return g.Ballot.ListBallots()
}

func (g *GovernanceEngine) TallyBallot(ballot *BallotRecord) *GovernanceReport {
	tally := ballot.Tally()
	total := tally["total"]
	var result string
	if total < ballot.Quorum {
		result = "quorum_not_met"
	} else if tally["approve"] > tally["reject"] {
		result = "approved"
	} else if tally["reject"] > tally["approve"] {
		result = "rejected"
	} else {
		result = "tied"
	}
	return NewGovernanceReport(ballot.BallotID, result, tally, ballot.CreatedAt, ballot.ClosedAt)
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
