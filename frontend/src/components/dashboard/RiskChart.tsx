"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendData {
  date: string;
  score: number;
}

export function RiskChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRiskTrends() {
      try {
        // Fetch data from the FastAPI backend endpoint. Added default org_id for now.
        const response = await fetch('http://localhost:8000/api/v1/dashboard/trends?org_id=default');
        if (!response.ok) {
          throw new Error('Failed to fetch risk trends');
        }
        
        const result = await response.json();
        
        // Parse the two arrays { dates: [], scores: [] } back into an array of objects
        const formattedData = result.dates.map((date: string, index: number) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: result.scores[index]
        }));
        
        setData(formattedData);
      } catch (error) {
        console.error("Error loading risk trends:", error);
        // Fallback or empty state could go here
      } finally {
        setLoading(false);
      }
    }

    fetchRiskTrends();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--card-foreground)",
            }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Risk Score"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorScore)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
