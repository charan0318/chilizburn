export const dynamic = "force-static";

export default function FAQPage() {
  const faqs = [
    {
      question: "What is ChilizBurn?",
      answer: (
        <>
          ChilizBurn is a <span className="text-red-500 font-semibold">community-built dashboard</span> that provides <span className="text-red-500 font-semibold">real-time transparency</span> for CHZ token burns on the Chiliz blockchain. It tracks and displays burn data as part of Chiliz's deflationary strategy.
        </>
      ),
    },
    {
      question: "What is Chiliz (CHZ)?",
      answer: (
        <>
          Chiliz is a <span className="text-red-500 font-semibold">blockchain platform</span> dedicated to <span className="text-red-500 font-semibold">sports and entertainment (SportFi)</span>. It powers <span className="text-red-500 font-semibold">70+ official Fan Tokens</span> for major sports teams including PSG, Barcelona, Juventus, and Manchester City. CHZ is the native token of the Chiliz Chain.
        </>
      ),
    },
    {
      question: "Why does Chiliz burn CHZ tokens?",
      answer: (
        <>
          Chiliz implements a deflationary strategy called <span className="text-red-500 font-semibold">'Chiliz 2030.'</span> To create <span className="text-red-500 font-semibold">scarcity</span> and incentivize ecosystem growth, <span className="text-red-500 font-semibold">10% of all proceeds</span> from Fan Token transactions and marketplace activities are used to buy CHZ from the open market and permanently burn them.
        </>
      ),
    },
    {
      question: "How does the burn mechanism work?",
      answer: (
        <>
          Fan Token transactions generate revenue. <span className="text-red-500 font-semibold">10% of this revenue</span> is allocated for CHZ buybacks. CHZ tokens are purchased from the open market and then sent to the <span className="text-red-500 font-semibold">zero address</span> (0x000000000000000000000000000000000000dead), <span className="text-red-500 font-semibold">permanently removing them from circulation</span>. This creates alignment between sports partners, Fan Token holders, and the CHZ ecosystem.
        </>
      ),
    },
    {
      question: "When was the most recent burn?",
      answer: (
        <>
          You can check the <span className="text-red-500 font-semibold">latest burn data</span> on this dashboard. All burns are <span className="text-red-500 font-semibold">verified on-chain</span> and can be independently confirmed via the Chiliz Chain Explorer.
        </>
      ),
    },
    {
      question: "How can I verify burns are real?",
      answer: (
        <>
          All burns are <span className="text-red-500 font-semibold">on-chain verified</span> using the zero address. You can view <span className="text-red-500 font-semibold">transaction hashes</span> on the Chiliz Chain Explorer, independently verify that tokens were sent to the zero address, and check burn amounts and dates directly on the blockchain.
        </>
      ),
    },
    {
      question: "Is ChilizBurn an official Chiliz site?",
      answer: (
        <>
          No, ChilizBurn is a <span className="text-red-500 font-semibold">community-made dashboard</span> created by enthusiasts to provide transparent, real-time tracking of CHZ burns. The <span className="text-red-500 font-semibold">burn data itself is official</span> and verified on-chain.
        </>
      ),
    },
    {
      question: "What is a token burn?",
      answer: (
        <>
          A token burn is when cryptocurrency is <span className="text-red-500 font-semibold">permanently removed from circulation</span> by sending it to a <span className="text-red-500 font-semibold">non-recoverable address (zero address)</span>. This reduces the total supply and increases scarcity of the remaining tokens.
        </>
      ),
    },
    {
      question: "Why should I care about burns?",
      answer: (
        <>
          Burning <span className="text-red-500 font-semibold">reduces token supply</span>, which can impact token economics and scarcity. For Chiliz, burns align <span className="text-red-500 font-semibold">ecosystem growth</span> (more Fan Token activity) with <span className="text-red-500 font-semibold">CHZ value appreciation</span>, creating incentive alignment across all participants.
        </>
      ),
    },
  ];

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(130deg,rgba(13,21,34,0.95)_0%,rgba(10,16,25,0.95)_45%,rgba(6,11,18,0.95)_100%)] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
        <p className="text-[11px] uppercase tracking-[0.24em] text-red-500">Frequently Asked Questions</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">
          ChilizBurn FAQ
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Common questions about CHZ burns, the Chiliz ecosystem, and the ChilizBurn dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-2xl border border-white/10 bg-[linear-gradient(160deg,rgba(17,23,34,0.95)_0%,rgba(10,15,24,0.95)_45%,rgba(8,12,19,0.95)_100%)] p-5 transition-colors hover:border-rose-500/30"
          >
            <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-100 transition-colors group-hover:text-rose-400">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
