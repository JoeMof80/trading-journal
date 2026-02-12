"use client";

import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Standard UI Icons
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
  Plus,
  Trash2,
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
    // Real-time subscription to your Amplify Cloud Sandbox
    const sub = client.models.Trade.observeQuery().subscribe({
      next: (data) => setTrades([...data.items]),
      error: (err) => console.error("Cloud Connection Error:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // Quick function to seed your sandbox with data
  const createTrade = async () => {
    try {
      const { data, errors } = await client.models.Trade.create({
        symbol: "BTC/USDT",
        side: "Buy",
        price: 68500.25,
        quantity: 0.1,
        type: "Limit",
        timeframe: "1HR",
        timestamp: new Date().toISOString(),
      });

      if (errors) console.error("Create Trade Error:", errors);
      else console.log("Trade created successfully:", data);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const deleteTrade = async (id: string, e: React.MouseEvent) => {
    // Prevent the row's onClick (opening the sheet) from firing
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this trade?")) return;

    try {
      await client.models.Trade.delete({ id });
      console.log("Trade deleted:", id);
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

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
    return (
      <div className="flex flex-col gap-1 border-b py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-sm truncate">{value || "N/A"}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              navigator.clipboard.writeText(value?.toString() || "");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tighter">TRADES</h1>
        <Button onClick={createTrade} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Test Trade
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground"
                >
                  No trades found in sandbox. Click "Add Test Trade" to begin.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => (
                <TableRow
                  key={trade.id}
                  onClick={() => setSelectedTrade(trade)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>{trade.side}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.timeframe}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {trade.price}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => deleteTrade(trade.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md overflow-y-auto p-6"
        >
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="text-xl font-bold uppercase">
              Trade Review
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col">
            <DataField label="METHOD" value="Fibonacci" icon={Settings} />
            <DataField
              label="TIMEFRAME"
              value={selectedTrade?.timeframe}
              icon={Clock}
            />
            <DataField
              label="SYMBOL"
              value={selectedTrade?.symbol}
              icon={Tag}
            />
            <DataField
              label="ORDER"
              value={selectedTrade?.side}
              icon={ShoppingCart}
            />
            <DataField
              label="ENTRY PRICE"
              value={selectedTrade?.price}
              icon={ArrowUpCircle}
            />
            <DataField
              label="STOP LOSS"
              value={selectedTrade?.stopLoss || "Calculated or Hardcoded"}
              icon={ArrowDownCircle}
            />
            <DataField
              label="TAKE PROFIT"
              value={selectedTrade?.takeProfit || "Calculated or Hardcoded"}
              icon={TrendingUp}
            />

            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  PROS
                </span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Trend alignment</li>
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
              <div className="aspect-video w-full bg-muted flex items-center justify-center border rounded-sm">
                <span className="text-xs text-muted-foreground">
                  Chart Image Placeholder
                </span>
              </div>
            </div>

            <DataField
              label="SYSTEM ID"
              value={selectedTrade?.id}
              icon={Fingerprint}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
