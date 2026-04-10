# GTBP MCP Server — Setup Guide

## What this does
Lets Claude query your GTBP price finder directly from the terminal or Claude Desktop.

You can ask Claude things like:
- "What's the cheapest price for Nike Air Max 90 right now?"
- "Show me price history for Jordan 1 Chicago"
- "What's trending on GTBP today?"

---

## Step 1 — Install dependencies

```bash
cd mcp-server
npm install
```

---

## Step 2 — Get your Supabase anon key

1. Go to your Supabase dashboard
2. Click **Project Settings** → **API**
3. Copy the **anon / public** key

---

## Step 3 — Add the MCP server to Claude Desktop

Open this file in a text editor:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add the GTBP server inside `"mcpServers"`:

```json
{
  "mcpServers": {
    "gtbp": {
      "command": "node",
      "args": ["/FULL/PATH/TO/gtbp-price-finder/mcp-server/index.mjs"],
      "env": {
        "GTBP_SUPABASE_KEY": "your-supabase-anon-key-here"
      }
    }
  }
}
```

Replace:
- `/FULL/PATH/TO/` with the actual path (run `pwd` in the mcp-server folder to get it)
- `your-supabase-anon-key-here` with the key from Step 2

---

## Step 4 — Restart Claude Desktop

Quit and reopen Claude Desktop. You should see a hammer icon (🔨) in the chat — that means tools are loaded.

---

## Tools available

| Tool | What it does |
|---|---|
| `search_product` | Identify a product by name or SKU |
| `get_prices` | Live prices across 30+ retailers, ranked by total cost |
| `get_price_history` | 30-day price history for a product |
| `get_trending` | Currently trending items |

---

## Troubleshooting

- **No hammer icon**: Check the config file path and JSON syntax
- **API errors**: Double-check your `GTBP_SUPABASE_KEY`
- **"command not found: node"**: Install Node.js from nodejs.org (v18+)
