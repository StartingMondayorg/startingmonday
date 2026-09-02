# Kickoff Brief Template

Copy into the wave manifest, one per ticket. The brief is the worker's entire starting context;
it starts cold and knows nothing this brief does not say or point to.

```
## Kickoff: SMK-XX <title>

You are a worker agent for ticket SMK-XX in the Starting Monday repo. Work only this ticket.
Read docs/orchestration/framework.md sections "Worker lifecycle" and "Guardrails" and follow them.

Ticket: <one-paragraph restatement of the problem and the deliverable>
Full ticket text: fetch SMK-XX from Jira before starting; it is the specification.

Decisions already made (do not relitigate):
- <decision>: <who made it, when>

Governance:
- <none | AGENTS.md signal-engine preflight: governing story WS#-##, boundaries, evidence required>

Branch: SMK-XX/<short-description>
Definition of done: <observable outcomes; tests/evidence that must exist>
Out of scope: <explicitly excluded work, with the ticket that owns it>
Escalate to the orchestrator if: <ticket-specific triggers, plus anything in framework Escalation>

Report format: what changed, evidence lines (commands + key output), PR URL,
Verified/Unverified labels, open questions.
```
