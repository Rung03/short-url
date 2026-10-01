import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PALETTE, formatDay, formatNumber } from '../format.js'

const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 12 }

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <span>{formatDay(label)}</span>
      <strong>{formatNumber(payload[0].value)} ครั้ง</strong>
    </div>
  )
}

export function DailyChart({ data, height = 240 }) {
  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#clicksFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="chart-tooltip">
      <span>{item.label}</span>
      <strong>{formatNumber(item.clicks)} ครั้ง</strong>
    </div>
  )
}

// Donut chart with a legend; `colors` pins a color to a category name.
export function DonutCard({ title, items, label, colors }) {
  const total = items.reduce((sum, item) => sum + item.clicks, 0)
  const data = items.map((item, i) => ({
    ...item,
    label: label(item.name),
    color: colors?.[item.name] ?? PALETTE[i % PALETTE.length],
  }))

  return (
    <section className="card">
      <h2>{title}</h2>
      {total === 0 ? (
        <p className="muted">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="donut">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="clicks"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{formatNumber(total)}</strong>
              <span>ครั้ง</span>
            </div>
          </div>
          <ul className="legend">
            {data.map((d) => (
              <li key={d.name}>
                <span className="legend-dot" style={{ background: d.color }} />
                <span className="legend-label">{d.label}</span>
                <span className="legend-value">
                  {formatNumber(d.clicks)} <span className="muted">· {Math.round((d.clicks / total) * 100)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function TopLinkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const link = payload[0].payload
  return (
    <div className="chart-tooltip">
      <span>{link.originalUrl}</span>
      <strong>{formatNumber(link.clickCount)} ครั้ง</strong>
    </div>
  )
}

// Horizontal bars of the most-opened links; clicking a bar opens its stats.
export function TopLinksChart({ links }) {
  const navigate = useNavigate()
  const data = links.map((link) => ({ ...link, code: `/${link.shortCode}` }))

  return (
    <div className="chart" style={{ height: Math.max(160, data.length * 44 + 16) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="code"
            width={88}
            tick={{ ...AXIS_TICK, fill: 'var(--text)', fontFamily: 'var(--mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TopLinkTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
          <Bar
            dataKey="clickCount"
            fill="var(--accent)"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            cursor="pointer"
            onClick={(entry) => navigate(`/stats/${entry.id}`)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KpiTile({ label, value, hint }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}
