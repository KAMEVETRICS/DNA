import type { CSSProperties } from "react";
import Link from "next/link";

import { ENTRY_CAMPAIGNS, type EntryCampaignId } from "@/lib/entry-campaigns";
import { getDnaSource } from "@/lib/sources";

type EntryLandingProps = {
  campaignId: EntryCampaignId;
};

export function EntryLanding({ campaignId }: EntryLandingProps) {
  const campaign = ENTRY_CAMPAIGNS[campaignId];
  const source = getDnaSource(campaign.sourceId);
  const style = { "--entry": source.color } as CSSProperties;

  return (
    <main className="entry-page" style={style}>
      <nav className="entry-nav shell" aria-label="DNA navigation">
        <Link className="brand" href="/" aria-label="DNA home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>DNA</span>
        </Link>
        <Link className="entry-back" href="/">All DNA paths <span aria-hidden="true">↗</span></Link>
      </nav>

      <section className="entry-hero shell">
        <div className="entry-copy">
          <div className="entry-eyebrow"><span /> {campaign.eyebrow}</div>
          <h1>{campaign.headlineBefore}<br /><em>{campaign.headlineEmphasis}</em></h1>
          <p>{campaign.description}</p>
          <div className="entry-actions">
            <Link className="entry-primary" href={`/?entry=${campaign.id}#start`}>
              Choose {source.name} <span aria-hidden="true">↓</span>
            </Link>
            <a
              className="entry-secondary"
              href="https://app.vana.org/sources"
              target="_blank"
              rel="noreferrer"
            >
              {campaign.syncLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="entry-disclosure">No source is connected by opening this page. You choose, then approve in Vana.</p>
        </div>

        <aside className="entry-signal-card" aria-label={`${campaign.label} preview`}>
          <div className="entry-card-meta"><span>DNA / {campaign.label.toUpperCase()}</span><span>PRIVATE BY DEFAULT</span></div>
          <div className="entry-orb"><span>{source.mark}</span><i /><i /><i /></div>
          <div className="entry-card-label">YOUR FIRST SIGNAL</div>
          <strong>{source.name}</strong>
          <p>{campaign.promise}</p>
          <div className="entry-card-status"><span>01</span><b>Connect one source</b><em>Vana approval required</em></div>
        </aside>
      </section>

      <section className="entry-steps-wrap">
        <div className="entry-steps shell">
          <article><span>01</span><h2>Sync</h2><p>Make sure {source.name} is ready in the Vana app on Mainnet.</p></article>
          <article><span>02</span><h2>Choose</h2><p>Select {source.name} in DNA. It is never preconnected for you.</p></article>
          <article><span>03</span><h2>Reveal</h2><p>Approve the read, get your verified DNA, then invite someone.</p></article>
        </div>
      </section>
    </main>
  );
}
