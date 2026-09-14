# Chatbot Agent Example

This project demonstrates how to build an intelligent, stateful LLM chatbot powered by the Autonomous Lifecycle Protocol (ALP).

## Features
- **Fallback Workflows**: Automatically escalates complex queries from the front-line support agent to a deep researcher agent.
- **Long-term Memory**: Persists user preferences across sessions.
- **Agent Roles**: Demonstrates precise agent configuration using `.alp/agents.alp`.

## Usage
Run the mock server to see the ALP orchestration in action:
```bash
npx tsx src/index.ts
```
