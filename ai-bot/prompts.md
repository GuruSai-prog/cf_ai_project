# PROMPTS.md

 
I used AI  for suggestions, snippets, and clarifications during development.

Below are a few sample prompts I used.

---

### 1. TypeScript typing help
**Prompt I used:**

"I have a function that ingests a JSON file and returns an array of FAQ items.  
The shape is `{question: string, answer: string}`.  
Can you give me a clean TypeScript type for this?"

---

### 2. Small utility snippet
**Prompt I used:**

"Write a small helper function that chunks an array into batches of N elements."

**AI suggested snippet:**

```ts
export function chunk<T>(arr: T[], size: number) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

---

### 3. Sample tools.ts code
**Prompt I used:**
 "Can you show me a minimal example of a TypeScript tool definition using `tool()` with a simple input schema and an `execute` function that returns a string?"


### 4. commands to test vector embeddings
**Prompt I used:**
"What are some example Wrangler CLI commands I can use to list vectors in a Vectorize index and sanity check that my embeddings were ingested correctly?"


### 5. Rephrase readme file
**Prompt I used:**
"Here is a rough README paragraph describing how to run my Cloudflare Worker locally. Please rewrite it so it’s shorter, clearer, and more readable without changing the meaning."
