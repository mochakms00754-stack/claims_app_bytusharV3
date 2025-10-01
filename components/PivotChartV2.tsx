import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { PivotTable } from '../types';

interface PivotChartProps {
    data: PivotTable;
    title: string;
    isHorizontal?: boolean;
}

const formatAxisTick = (tickItem: number) => {
    if (tickItem >= 10000000) return `${(tickItem / 10000000).toFixed(1)}Cr`;
    if (tickItem >= 100000) return `${(tickItem / 100000).toFixed(1)}L`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}K`;
    return tickItem.toLocaleString('en-IN');
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
                <p className="font-bold text-card-foreground">{label}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.fill }}>
                        {pld.name}: {Number(pld.value).toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const PivotChartV2 = React.forwardRef<HTMLDivElement, PivotChartProps>(({ data, title, isHorizontal = false }, ref) => {
    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-4">Not enough data to display chart.</p>;
    }

    const categoryKey = Object.keys(data[0] || {})[0];

    const verticalLayout = (
        <BarChart data={data} margin={{ top: 5, right: 5, left: 25, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={categoryKey} angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" orientation="left" stroke="rgb(var(--color-primary))" tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tickFormatter={(val) => val.toLocaleString('en-IN')} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ bottom: 0 }}/>
            <Bar yAxisId="left" dataKey="Claim_Amount" fill="rgb(var(--color-primary))" name="Claim Amount" />
            <Bar yAxisId="left" dataKey="Settled_Amount" fill="rgb(var(--color-secondary))" name="Settled Amount" />
            <Bar yAxisId="right" dataKey="Rows" fill="#10b981" name="Claim Count" />
        </BarChart>
    );

    const horizontalLayout = (
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 100, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" xAxisId="left" orientation="bottom" stroke="rgb(var(--color-primary))" tickFormatter={formatAxisTick} tick={{ fontSize: 12 }} />
            <XAxis type="number" xAxisId="right" orientation="top" stroke="#10b981" tickFormatter={(val) => val.toLocaleString('en-IN')} tick={{ fontSize: 12 }}>
                 <Label value="Claim Count" offset={0} position="insideTop" dy={-15} />
            </XAxis>
            <YAxis type="category" dataKey={categoryKey} width={120} interval={0} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ bottom: -5 }} />
            <Bar xAxisId="left" dataKey="Claim_Amount" fill="rgb(var(--color-primary))" name="Claim Amount" />
            <Bar xAxisId="left" dataKey="Settled_Amount" fill="rgb(var(--color-secondary))" name="Settled Amount" />
            <Bar xAxisId="right" dataKey="Rows" fill="#10b981" name="Claim Count" />
        </BarChart>
    );

    return (
        <div className="chart-container-for-pdf bg-card" style={{ width: '100%', height: 450 }} ref={ref}>
             <ResponsiveContainer>
                {isHorizontal ? horizontalLayout : verticalLayout}
            </ResponsiveContainer>
        </div>
    );
});

export default PivotChartV2;