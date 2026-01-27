import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '../types';

export const RechartsWrapper: React.FC<{ data: Sale[] }> = ({ data }) => {
  // Aggregate sales by date
  const chartData = React.useMemo(() => {
    const map = new Map<string, number>();
    // Sort oldest first for chart
    const sorted = [...data].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      map.set(date, (map.get(date) || 0) + s.total);
    });
    
    return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
  }, [data]);

  if (chartData.length === 0) return <div className="text-center w-full">No chart data</div>;

  return (
    <div className="w-full h-[300px] p-4">
        <h3 className="font-bold mb-4">အရောင်း ဂရပ် (Sales Trend)</h3>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
            <XAxis dataKey="date" stroke="#000" tick={{fontSize: 12}} />
            <YAxis stroke="#000" tick={{fontSize: 12}} />
            <Tooltip 
                contentStyle={{ 
                    borderRadius: '8px', 
                    border: '2px solid black', 
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' 
                }} 
            />
            <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#FFADE7" strokeWidth={3} />
        </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};