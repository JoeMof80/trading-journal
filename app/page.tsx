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
  X,
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
import { Input } from "@/components/ui/input";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

// --- Toggle Group Component ---
function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider border transition-all duration-150
            ${
              value === opt
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// --- Bullet List Editor Component ---
function BulletListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const addItem = () => onChange([...items, ""]);

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs mt-0.5 select-none">
            •
          </span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder || "Add a point..."}
            className="h-8 text-sm flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit gap-1.5 h-8 text-xs mt-1"
        onClick={addItem}
      >
        <Plus className="h-3 w-3" />
        Add point
      </Button>
    </div>
  );
}

export default function TradeJournal() {
  const [trades, setTrades] = useState<Array<Schema["Trade"]["type"]>>([]);
  const [selectedTrade, setSelectedTrade] = useState<
    Schema["Trade"]["type"] | null
  >(null);

  // Review panel state
  const [timeframe, setTimeframe] = useState("1HR");
  const [grade, setGrade] = useState("A");
  const [pros, setPros] = useState<string[]>(["Trend alignment"]);
  const [cons, setCons] = useState<string[]>(["Higher timeframe resistance"]);

  useEffect(() => {
    // Real-time subscription to your Amplify Cloud Sandbox
    const sub = client.models.Trade.observeQuery().subscribe({
      next: (data) => setTrades([...data.items]),
      error: (err) => console.error("Cloud Connection Error:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // Reset review panel state when a new trade is selected
  const handleSelectTrade = (trade: Schema["Trade"]["type"]) => {
    setSelectedTrade(trade);
    setTimeframe("1HR");
    setGrade("A");
    setPros(["Trend alignment"]);
    setCons(["Higher timeframe resistance"]);
  };

  // Quick function to seed your sandbox with data
  const createTrade = async () => {
    try {
      const { data, errors } = await client.models.Trade.create({
        symbol: "GBP/USD",
        side: "Buy",
        price: 1.36498,
        stopLoss: 1.37317,
        takeProfit: 1.34587,
        quantity: 0.25,
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

  console.log("Current Trades in State:", trades);

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
              <TableHead>Order</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Stop Loss</TableHead>
              <TableHead>Take Profit</TableHead>
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
                  onClick={() => handleSelectTrade(trade)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>{trade.side}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.timeframe}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.price}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.stopLoss || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trade.takeProfit || "N/A"}
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

            {/* TIMEFRAME — Toggle Group */}
            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Timeframe
                </span>
              </div>
              <ToggleGroup
                options={["15MIN", "1HR", "4HR"]}
                value={timeframe}
                onChange={setTimeframe}
              />
            </div>

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

            {/* PROS — Editable Bullet List */}
            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  PROS
                </span>
              </div>
              <BulletListEditor
                items={pros}
                onChange={setPros}
                placeholder="Add a pro..."
              />
            </div>

            {/* CONS — Editable Bullet List */}
            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  CONS
                </span>
              </div>
              <BulletListEditor
                items={cons}
                onChange={setCons}
                placeholder="Add a con..."
              />
            </div>

            {/* GRADE — Toggle Group */}
            <div className="flex flex-col gap-2 border-b py-4">
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  GRADE
                </span>
              </div>
              <ToggleGroup
                options={["A+", "A", "B"]}
                value={grade}
                onChange={setGrade}
              />
            </div>

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
