import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getBurnByHash } from "@/services/burns";

interface TxPageProps {
  params: Promise<{ hash: string }>;
}

export default async function TxDetailsPage({ params }: TxPageProps) {
  const { hash } = await params;
  const burn = await getBurnByHash(hash);

  if (!burn) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold text-zinc-100">Transaction Detail</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="TX Hash" value={burn.txHash} className="sm:col-span-2" />
        <Card title="Block Number" value={burn.blockNumber.toString()} />
        <Card title="Timestamp" value={new Date(burn.timestamp).toUTCString()} />
        <Card title="From" value={burn.from} />
        <Card title="To" value={burn.to} />
        <Card title="Amount Burned" value={`${burn.amountChz.toLocaleString()} CHZ`} />
        <Card title="Gas Fee" value={`${burn.gasFeeChz} CHZ`} />
      </div>
    </section>
  );
}
