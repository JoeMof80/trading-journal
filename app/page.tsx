"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  // 1. Change state to hold Trades instead of Todos
  const [trades, setTrades] = useState<Array<Schema["Trade"]["type"]>>([]);

  // 2. Observe the Trade model for real-time updates
  useEffect(() => {
    const sub = client.models.Trade.observeQuery().subscribe({
      next: (data) => setTrades([...data.items]),
    });
    return () => sub.unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <main>
      <h1>Trade History</h1>
      <p>Webhook Data from Chrome Extension</p>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Type</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {trades
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .map((trade) => (
              <tr key={trade.id}>
                <td>
                  <strong>{trade.symbol}</strong>
                </td>
                <td style={{ color: trade.side === "Buy" ? "green" : "red" }}>
                  {trade.side}
                </td>
                <td>{trade.price}</td>
                <td>{trade.quantity}</td>
                <td>{trade.type}</td>
                <td>{new Date(trade.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {trades.length === 0 && <p>Waiting for webhooks...</p>}

      <div style={{ marginTop: "20px", fontSize: "0.8rem" }}>
        🥳 Tracking {trades.length} live trades via AWS Amplify.
      </div>
    </main>
  );
}
