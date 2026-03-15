interface ChartData {
  type: string;
  xAxis: { data: string[] };
  yAxis: { type: string };
  series: Array<{ data: number[] }>;
}

export function SimpleChart({ data }: { data: ChartData }) {
  if (!data?.series?.[0]?.data) return null;

  const values = data.series[0].data.map(Number);
  const labels = data.xAxis.data;
  const maxValue = Math.max(...values);
  const width = 240;
  const height = 150;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.type === 'bar') {
    const barWidth = chartWidth / values.length;
    return (
      <svg width={width} height={height} className="bg-gray-700">
        {values.map((value, i) => {
          const barHeight = (value / maxValue) * chartHeight;
          return (
            <g key={i}>
              <rect
                x={padding.left + i * barWidth + barWidth * 0.1}
                y={padding.top + chartHeight - barHeight}
                width={barWidth * 0.8}
                height={barHeight}
                fill="#60a5fa"
              />
              <text
                x={padding.left + i * barWidth + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#d1d5db"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (data.type === 'line') {
    const points = values
      .map((value, i) => {
        const x = padding.left + (i / (values.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="bg-gray-700">
        <polyline
          points={points}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
        />
        {values.map((value, i) => {
          const x = padding.left + (i / (values.length - 1)) * chartWidth;
          const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="#60a5fa" />
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#d1d5db"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return null;
}
