# DNA

DNA turns user-approved data signals into a private, portable identity profile and friend-compatibility experience. It is being built for the Vana Cup.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Vercel Node.js 22 runtime
- Vana SDK integration planned for the live data flow

## Local development

Requirements:

- Node.js 22
- pnpm 9 or 10

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
5. Create DNA's app identity in [Vana Account](https://account.vana.org/developers) using that exact URL.
6. Add the variables below in Vercel Project Settings → Environment Variables and redeploy.

Copy `.env.example` for the required names:

```text
VANA_APP_URL=https://your-production-domain
VANA_APP_PRIVATE_KEY=0x...
VANA_ENV=production
VANA_NETWORK=moksha
```

Never commit the real private key. Keep `VANA_NETWORK=moksha` until the full approval and paid-read flow passes on testnet.
