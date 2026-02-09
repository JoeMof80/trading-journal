"use client";

import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Icons
import {
  Check,
  Copy,
  Settings,
  Clock,
  Tag,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Camera,
  Fingerprint,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

export default function TradeJournal() {
  const [trades, setTrades] = useState<Array<Schema["Trade"]["type"]>>([]);
  const [selectedTrade, setSelectedTrade] = useState<
    Schema["Trade"]["type"] | null
  >(null);

  useEffect(() => {
    const hasDataModel = client.models?.Trade;
    if (!hasDataModel) return;
    const sub = client.models.Trade.observeQuery().subscribe({
      next: (data) => setTrades([...data.items]),
    });
    return () => sub.unsubscribe();
  }, []);

  const DataField = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: any;
    icon: any;
  }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(value?.toString() || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex flex-col gap-1 border-b py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-sm truncate">{value}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">Trade Review</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              key={trade.id}
              onClick={() => setSelectedTrade(trade)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{trade.symbol}</TableCell>
              <TableCell>{trade.side}</TableCell>
              <TableCell className="text-right font-mono">
                {trade.price}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md overflow-y-auto p-6"
        >
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="text-xl font-bold">Trade Review</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col">
            <DataField label="METHOD" value="VWAP REJECTION" icon={Settings} />
            <DataField label="TIMEFRAME" value="15M" icon={Clock} />
            <DataField
              label="SYMBOL"
              value={selectedTrade?.symbol || ""}
              icon={Tag}
            />
            <DataField
              label="ORDER"
              value={`${selectedTrade?.side} ${selectedTrade?.type}`}
              icon={ShoppingCart}
            />
            <DataField
              label="ENTRY PRICE"
              value={selectedTrade?.price || ""}
              icon={ArrowUpCircle}
            />
            <DataField label="STOP LOSS" value="64100" icon={ArrowDownCircle} />
            <DataField label="TAKE PROFIT" value="68000" icon={TrendingUp} />

            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  PROS
                </span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Trend alignment</li>
                <li>Volume support</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  CONS
                </span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Higher timeframe resistance</li>
              </ul>
            </div>

            <DataField label="GRADE" value="A" icon={Award} />

            <div className="flex flex-col gap-3 py-4 border-b">
              <div className="flex items-center gap-2">
                <Camera className="h-3 w-3" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  SCREENSHOTS
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="aspect-video w-full bg-muted flex items-center justify-center border rounded-sm">
                  <span className="text-xs text-muted-foreground">
                    Chart Image
                  </span>
                </div>
              </div>
            </div>

            <DataField
              label="SYSTEM ID"
              value={selectedTrade?.id || ""}
              icon={Fingerprint}
            />
          </div>

          <div className="mt-6">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setSelectedTrade(null)}
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
