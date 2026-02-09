"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Shadcn UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 1. Safe Configuration
if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs);
}

const client = generateClient<Schema>();

// 2. Mock Data for Local Development
const MOCK_TRADES: Array<Schema["Trade"]["type"]> = [
  {
    id: "1",
    symbol: "BTC",
    side: "Buy",
    price: 65000,
    quantity: 0.5,
    type: "Limit",
    timestamp: new Date().toISOString(),
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    symbol: "ETH",
    side: "Sell",
    price: 3500,
    quantity: 2.0,
    type: "Market",
    timestamp: new Date().toISOString(),
    createdAt: "",
    updatedAt: "",
  },
];

export default function App() {
  const [trades, setTrades] = useState<Array<Schema["Trade"]["type"]>>([]);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    // 1. Check if the model actually exists on the client
    const hasDataModel = client.models?.Trade;

    if (!hasDataModel) {
      console.warn("Amplify Data model 'Trade' is undefined. Using mock data.");
      setTrades(MOCK_TRADES);
      setIsLocal(true);
      return;
    }

    // 2. Only subscribe if the model is defined
    const sub = client.models.Trade.observeQuery().subscribe({
      next: (data) => {
        setTrades([...data.items]);
        setIsLocal(false);
      },
      error: (err) => {
        console.error("Subscription error:", err);
        setTrades(MOCK_TRADES);
        setIsLocal(true);
      },
    });

    return () => sub.unsubscribe();
  }, []);

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Trade History</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isLocal ? "Viewing Local Mock Data" : "Live Webhook Data"}
            </p>
          </div>
          {isLocal && (
            <Badge
              variant="outline"
              className="border-yellow-500 text-yellow-600"
            >
              Offline Mode
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-bold">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.side === "Buy" ? "default" : "destructive"
                        }
                        className={
                          trade.side === "Buy"
                            ? "bg-green-600 hover:bg-green-600"
                            : ""
                        }
                      >
                        {trade.side}
                      </Badge>
                    </TableCell>
                    <TableCell>${trade.price}</TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell className="capitalize">{trade.type}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground flex justify-between">
            <span>Tracking {trades.length} trades.</span>
            <span>Mode: {isLocal ? "Mock" : "Amplify Cloud"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
