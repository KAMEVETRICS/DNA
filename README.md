# DNA

DNA turns user-approved data signals into a private, portable identity profile and friend-compatibility experience. Built for the Vana Cup.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Vercel Node.js 22 runtime
- `@opendatalabs/vana-sdk` direct-data flow on **mainnet**

## Live Vana flow

DNA requests real connectors through Vana, one source per approval:

| Source | Scopes |
|--------|--------|
| ChatGPT | `chatgpt.memories` |
| Spotify | `spotify.savedTracks` |
| YouTube | `youtube.history`, `youtube.subscriptions` |
| GitHub | `github.profile`, `github.contributions`, `github.repositories` |
| LinkedIn | `linkedin.profile`, `linkedin.skills`, `linkedin.experience` |
| Instagram | `instagram.profile`, `instagram.following` |

The browser opens Vana's approval page. DNA's server creates and polls the request, performs the paid read from escrow, and converts the approved payload into aggregate identity scores. Raw history is not returned to the interface or persisted by DNA.

API routes bind each request to an HTTP-only browser session and prevent repeat reads after completion. Multi-source DNA requires separate approvals (protocol limitation: one source per access request).

Verified profiles stay in the browser (`localStorage`) as aggregates only. Invite links encode aggregate traits so two people can compute compatibility without sharing raw data.

## Cup checklist

1. Register app identity on **Mainnet** at [Vana Account Developers](https://account.vana.org/developers) with App URL `https://dna-vana.vercel.app`
2. Fund **mainnet escrow** (USDC.e)
3. Set Vercel env: `VANA_APP_URL`, `VANA_APP_PRIVATE_KEY`, `VANA_ENV=production`, `VANA_NETWORK=mainnet`
4. Complete Cup listing (name, **logo**, website) on [builders.vana.org](https://builders.vana.org)
5. End-to-end: user syncs a source in the Vana app on **Mainnet**, approves DNA, paid read succeeds → Goal

## Local development

Requirements:

- Node.js 22
- pnpm 9 or 10

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For local testing against testnet, set `VANA_NETWORK=moksha` and use a testnet app identity + faucet funds. Cup scoring only counts **mainnet** reads.

## Validation

```bash
pnpm lint
pnpm build
```

## Vercel deployment

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as **Next.js**.
3. Set the Node.js version to **22.x**.
4. Deploy once to obtain the stable production URL.
5. Create DNA's app identity in [Vana Account](https://account.vana.org/developers) using that exact URL on **Mainnet**.
6. Add the variables from `.env.example` in Vercel Project Settings → Environment Variables and redeploy.

Never commit the real private key.
