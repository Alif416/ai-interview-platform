import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const scoreColor = s => s >= 8 ? 'var(--lc-easy)' : s >= 6 ? 'var(--lc-medium)' : 'var(--lc-hard)'

/* ════════════════════════════════════════════════════════════════════
   SCORE TREND CHART
   Shows raw scores + rolling-average overlay.
   Toggle: by attempt index  ↔  by calendar date.
   ════════════════════════════════════════════════════════════════════ */
function ScoreTrendChart({ evaluations, scoreTrend }) {
  const [mode, setMode] = useState('attempt') // 'attempt' | 'date'
  const [hovered, setHovered] = useState(null)

  const W = 620
  const H = 190
  const pad = { top: 20, right: 20, bottom: 36, left: 38 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const yScale = v => pad.top + plotH - (v / 10) * plotH
  const gridLines = [0, 2, 4, 6, 8, 10]

  // ── Rolling average helper ────────────────────────────────────────
  const rollingAvg = (arr, win = 5) =>
    arr.map((_, i) => {
      const slice = arr.slice(Math.max(0, i - win + 1), i + 1)
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })

  // ── Data for each mode ────────────────────────────────────────────
  const attemptData = evaluations.map((e, i) => ({ label: String(i + 1), score: e.score, meta: e }))
  const dateData = scoreTrend.map(d => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: d.avgScore,
    meta: d,
  }))

  const points = mode === 'attempt' ? attemptData : dateData
  if (!points.length) return null

  const xScale = i => pad.left + (i / Math.max(points.length - 1, 1)) * plotW
  const rawScores = points.map(p => p.score)
  const avgScores = rollingAvg(rawScores)

  const polylineRaw = rawScores.map((s, i) => `${xScale(i)},${yScale(s)}`).join(' ')
  const polylineAvg = avgScores.map((s, i) => `${xScale(i)},${yScale(s)}`).join(' ')

  // X-axis labels: show first, last, and up to 6 evenly spaced
  const showLabel = i => {
    if (points.length <= 7) return true
    const step = Math.floor((points.length - 1) / 5)
    return i === 0 || i === points.length - 1 || i % step === 0
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>Score Trend</p>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--lc-border)', fontSize: '11px' }}
        >
          {[['attempt', 'By Attempt'], ['date', 'By Date']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => { setMode(val); setHovered(null) }}
              style={{
                padding: '3px 10px',
                backgroundColor: mode === val ? 'var(--lc-orange-dim)' : 'transparent',
                color: mode === val ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2" style={{ fontSize: '10px', color: 'var(--lc-muted)' }}>
        <span className="flex items-center gap-1.5">
          <span style={{ display: 'inline-block', width: 20, height: 2, backgroundColor: 'var(--lc-orange)' }} />
          Raw score
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: 'inline-block', width: 20, height: 2, backgroundColor: 'var(--lc-blue, #60a5fa)', opacity: 0.8 }} />
          5-pt rolling avg
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {gridLines.map(v => (
          <g key={v}>
            <line x1={pad.left} y1={yScale(v)} x2={W - pad.right} y2={yScale(v)}
              stroke="var(--lc-border)" strokeWidth="1" />
            <text x={pad.left - 6} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="var(--lc-muted)">{v}</text>
          </g>
        ))}

        {/* Area fill */}
        {rawScores.length > 1 && (
          <polygon
            points={`${xScale(0)},${yScale(0)} ${polylineRaw} ${xScale(rawScores.length - 1)},${yScale(0)}`}
            fill="rgba(255,161,22,0.06)"
          />
        )}

        {/* Raw score line */}
        {rawScores.length > 1 && (
          <polyline points={polylineRaw} fill="none"
            stroke="var(--lc-orange)" strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.7" />
        )}

        {/* Rolling average line */}
        {avgScores.length > 1 && (
          <polyline points={polylineAvg} fill="none"
            stroke="#60a5fa" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Dots */}
        {rawScores.map((s, i) => (
          <circle key={i}
            cx={xScale(i)} cy={yScale(s)}
            r={hovered === i ? 6 : 3.5}
            fill={scoreColor(s)} stroke="var(--lc-bg)" strokeWidth="1.5"
            style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (!showLabel(i)) return null
          return (
            <text key={i} x={xScale(i)} y={H - 4}
              textAnchor="middle" fontSize="8.5" fill="var(--lc-muted)">
              {p.label}
            </text>
          )
        })}

        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const p = points[hovered]
          const cx = xScale(hovered)
          const cy = yScale(p.score)
          const bW = 120, bH = mode === 'attempt' ? 50 : 38
          const bx = Math.min(Math.max(cx - bW / 2, pad.left), W - pad.right - bW)
          const by = cy - bH - 10 < pad.top ? cy + 10 : cy - bH - 10
          return (
            <g>
              <rect x={bx} y={by} width={bW} height={bH} rx="5"
                fill="var(--lc-surface-2)" stroke="var(--lc-border)" strokeWidth="1" />
              <text x={bx + bW / 2} y={by + 14} textAnchor="middle" fontSize="10"
                fill="var(--lc-text)" fontWeight="600">
                {p.score}/10 {mode === 'attempt' && p.meta?.grade ? `· ${p.meta.grade}` : ''}
              </text>
              {mode === 'attempt' && (
                <text x={bx + bW / 2} y={by + 28} textAnchor="middle" fontSize="9" fill="var(--lc-text-3)">
                  {p.meta?.topic}
                </text>
              )}
              <text x={bx + bW / 2} y={by + (mode === 'attempt' ? 42 : 28)} textAnchor="middle"
                fontSize="8.5" fill="var(--lc-muted)">
                {mode === 'attempt'
                  ? new Date(p.meta?.createdAt).toLocaleDateString()
                  : `${p.meta?.count} attempt${p.meta?.count !== 1 ? 's' : ''}`}
              </text>
            </g>
          )
        })()}
      </svg>
      <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--lc-muted)', marginTop: '-2px' }}>
        {mode === 'attempt' ? 'Attempt #' : 'Date'}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TOPIC STRENGTH & WEAKNESS BREAKDOWN
   Each topic card is expandable and shows trend arrow + pills.
   ════════════════════════════════════════════════════════════════════ */
function TopicBreakdown({ byTopic }) {
  const [expanded, setExpanded] = useState(null)

  if (!byTopic.length) return null

  const trendIcon = (trend) => {
    if (trend > 0.5) return { icon: '↑', color: 'var(--lc-easy)', label: 'Improving' }
    if (trend < -0.5) return { icon: '↓', color: 'var(--lc-hard)', label: 'Declining' }
    return { icon: '→', color: 'var(--lc-text-3)', label: 'Stable' }
  }

  // Classify topic as strength or weakness based on avgScore
  const globalAvg = byTopic.reduce((a, t) => a + t.avgScore, 0) / byTopic.length

  return (
    <div className="flex flex-col gap-2">
      {byTopic.map(t => {
        const isOpen = expanded === t.topic
        const { icon, color: trendColor, label: trendLabel } = trendIcon(t.trend)
        const isStrength = t.avgScore >= globalAvg

        return (
          <div key={t.topic}
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
          >
            {/* Header row — always visible */}
            <button
              onClick={() => setExpanded(isOpen ? null : t.topic)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              {/* Strength / Weakness indicator */}
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isStrength ? 'var(--lc-easy)' : 'var(--lc-hard)',
                }}
              />

              {/* Topic name */}
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--lc-text)' }}>
                {t.topic}
              </span>

              {/* Attempt count */}
              <span style={{ fontSize: '11px', color: 'var(--lc-muted)', marginRight: 8 }}>
                {t.count}x
              </span>

              {/* Trend */}
              <span style={{ fontSize: '12px', fontWeight: 700, color: trendColor, marginRight: 8 }}
                title={trendLabel}>
                {icon} {t.trend !== 0 ? (t.trend > 0 ? `+${t.trend}` : t.trend) : ''}
              </span>

              {/* Score bar */}
              <div style={{ width: 80 }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: scoreColor(t.avgScore) }}>
                    {t.avgScore}/10
                  </span>
                </div>
                <div style={{ height: 3, backgroundColor: 'var(--lc-surface-3)', borderRadius: 99 }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${(t.avgScore / 10) * 100}%`,
                    backgroundColor: scoreColor(t.avgScore),
                  }} />
                </div>
              </div>

              {/* Chevron */}
              <svg
                style={{
                  width: 14, height: 14, color: 'var(--lc-muted)', flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div
                className="px-4 pb-4 flex flex-col gap-3 border-t"
                style={{ borderColor: 'var(--lc-border)', backgroundColor: 'var(--lc-surface-2)' }}
              >
                <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Strengths */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--lc-easy)' }}>
                      ✓ Strengths
                    </p>
                    {t.strengths.length ? (
                      <div className="flex flex-col gap-1.5">
                        {t.strengths.map((s, i) => (
                          <div key={i}
                            className="text-xs px-2 py-1.5 rounded-lg leading-snug"
                            style={{
                              backgroundColor: 'rgba(0,184,163,0.08)',
                              border: '1px solid rgba(0,184,163,0.2)',
                              color: 'var(--lc-text-2)',
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '11px', color: 'var(--lc-muted)' }}>No data yet</p>
                    )}
                  </div>

                  {/* Improvements */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--lc-medium)' }}>
                      ↗ Areas to Improve
                    </p>
                    {t.improvements.length ? (
                      <div className="flex flex-col gap-1.5">
                        {t.improvements.map((s, i) => (
                          <div key={i}
                            className="text-xs px-2 py-1.5 rounded-lg leading-snug"
                            style={{
                              backgroundColor: 'rgba(255,192,30,0.08)',
                              border: '1px solid rgba(255,192,30,0.2)',
                              color: 'var(--lc-text-2)',
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '11px', color: 'var(--lc-muted)' }}>No data yet</p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 pt-1" style={{ fontSize: '11px', color: 'var(--lc-muted)' }}>
                  <span>Best: <strong style={{ color: 'var(--lc-easy)' }}>{t.bestScore}/10</strong></span>
                  <span>Trend: <strong style={{ color: trendColor }}>{trendLabel} ({t.trend > 0 ? '+' : ''}{t.trend})</strong></span>
                  <span
                    className="lc-badge"
                    style={{
                      backgroundColor: isStrength ? 'rgba(0,184,163,0.12)' : 'rgba(239,68,68,0.12)',
                      color: isStrength ? 'var(--lc-easy)' : 'var(--lc-hard)',
                      fontSize: '10px',
                    }}
                  >
                    {isStrength ? 'Strength' : 'Needs work'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INTERVIEWER ACTIVITY STATS
   Session status donut + weekly bar chart + recent sessions table.
   ════════════════════════════════════════════════════════════════════ */
const STATUS_COLOR = {
  COMPLETED:   '#00b8a3',
  IN_PROGRESS: '#ffa116',
  SCHEDULED:   '#60a5fa',
  CANCELLED:   '#ef4444',
}
const STATUS_LABEL = {
  COMPLETED: 'Completed', IN_PROGRESS: 'In Progress',
  SCHEDULED: 'Scheduled', CANCELLED: 'Cancelled',
}

function DonutChart({ byStatus, total }) {
  const R = 52, cx = 70, cy = 70, stroke = 14
  const circ = 2 * Math.PI * R
  const statuses = Object.keys(STATUS_COLOR)
  let offset = 0

  const segments = statuses.map(s => {
    const pct = total ? byStatus[s] / total : 0
    const seg = { status: s, pct, offset, len: pct * circ }
    offset += pct * circ
    return seg
  })

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="var(--lc-surface-3)" strokeWidth={stroke} />
      {/* Segments */}
      {segments.filter(s => s.pct > 0).map(s => (
        <circle key={s.status} cx={cx} cy={cy} r={R} fill="none"
          stroke={STATUS_COLOR[s.status]} strokeWidth={stroke}
          strokeDasharray={`${s.len} ${circ - s.len}`}
          strokeDashoffset={circ / 4 - s.offset}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      ))}
      {/* Centre text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700"
        fill="var(--lc-text)">{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9"
        fill="var(--lc-muted)">sessions</text>
    </svg>
  )
}

function WeeklyBar({ sessionsOverTime }) {
  if (!sessionsOverTime.length) return null

  const W = 500, H = 100
  const pad = { top: 8, right: 8, bottom: 28, left: 28 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom

  const maxCount = Math.max(...sessionsOverTime.map(w => w.total), 1)
  const barW = Math.min(32, (plotW / sessionsOverTime.length) - 4)

  const xCenter = i => pad.left + (i + 0.5) * (plotW / sessionsOverTime.length)
  const yTop = count => pad.top + plotH - (count / maxCount) * plotH
  const barH = count => (count / maxCount) * plotH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Y grid at 0 and max */}
      {[0, Math.ceil(maxCount / 2), maxCount].map(v => (
        <g key={v}>
          <line x1={pad.left} y1={pad.top + plotH - (v / maxCount) * plotH}
            x2={W - pad.right} y2={pad.top + plotH - (v / maxCount) * plotH}
            stroke="var(--lc-border)" strokeWidth="1" />
          <text x={pad.left - 4} y={pad.top + plotH - (v / maxCount) * plotH + 4}
            textAnchor="end" fontSize="8" fill="var(--lc-muted)">{v}</text>
        </g>
      ))}

      {/* Bars */}
      {sessionsOverTime.map((w, i) => (
        <g key={w.week}>
          {/* Stack: completed, in_progress, scheduled, cancelled */}
          {['CANCELLED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].reduce((acc, s) => {
            const prev = acc.yUsed
            const h = w.total ? ((w[s] || 0) / maxCount) * plotH : 0
            acc.els.push(
              <rect key={s}
                x={xCenter(i) - barW / 2}
                y={pad.top + plotH - prev - h}
                width={barW} height={Math.max(h, 0)}
                fill={STATUS_COLOR[s]} rx="1"
              />
            )
            acc.yUsed += h
            return acc
          }, { els: [], yUsed: 0 }).els}

          {/* X label */}
          <text x={xCenter(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--lc-muted)">
            {new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        </g>
      ))}
    </svg>
  )
}

function InterviewerStats({ stats }) {
  const { totalSessions, uniqueCandidates, completionRate, byStatus, sessionsOverTime, recentSessions } = stats

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top stat cards ────────────────────────────────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        {[
          { label: 'Total Sessions', value: totalSessions, sub: 'hosted' },
          { label: 'Unique Candidates', value: uniqueCandidates, sub: 'interviewed' },
          { label: 'Completion Rate', value: `${completionRate}%`, sub: 'sessions completed', color: completionRate >= 70 ? 'var(--lc-easy)' : completionRate >= 40 ? 'var(--lc-medium)' : 'var(--lc-hard)' },
          { label: 'Completed', value: byStatus.COMPLETED, sub: 'finished sessions', color: 'var(--lc-easy)' },
        ].map(c => (
          <div key={c.label}
            className="flex flex-col gap-1 p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
          >
            <p style={{ fontSize: '11px', color: 'var(--lc-muted)', fontWeight: 500 }}>{c.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1, color: c.color || 'var(--lc-text)' }}>
              {c.value}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--lc-text-3)' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Donut + weekly bar ────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'auto 1fr' }}>

        {/* Donut */}
        <div
          className="rounded-xl border p-4 flex flex-col items-center gap-3"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <p className="text-sm font-semibold self-start" style={{ color: 'var(--lc-text)' }}>By Status</p>
          <DonutChart byStatus={byStatus} total={totalSessions} />
          <div className="flex flex-col gap-1.5">
            {Object.keys(STATUS_COLOR).map(s => (
              <div key={s} className="flex items-center gap-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLOR[s], flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--lc-text-3)' }}>{STATUS_LABEL[s]}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lc-text-2)', marginLeft: 'auto' }}>
                  {byStatus[s]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly bar chart */}
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>Sessions per Week</p>
            <div className="flex items-center gap-3" style={{ fontSize: '10px' }}>
              {Object.keys(STATUS_COLOR).map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: STATUS_COLOR[s], display: 'inline-block' }} />
                  <span style={{ color: 'var(--lc-muted)' }}>{STATUS_LABEL[s]}</span>
                </span>
              ))}
            </div>
          </div>
          {sessionsOverTime.length
            ? <WeeklyBar sessionsOverTime={sessionsOverTime} />
            : <p style={{ fontSize: '12px', color: 'var(--lc-muted)', textAlign: 'center', paddingTop: 24 }}>No weekly data yet</p>
          }
        </div>
      </div>

      {/* ── Recent sessions table ─────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <div className="px-5 py-3 border-b"
          style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>Recent Sessions</p>
        </div>
        <div className="grid px-5 py-2 border-b text-xs font-medium"
          style={{
            gridTemplateColumns: '1fr 140px 80px 120px',
            color: 'var(--lc-text-3)', borderColor: 'var(--lc-border)',
            backgroundColor: 'var(--lc-surface-2)',
          }}>
          <span>Session</span><span>Candidate</span><span>Level</span><span>Status</span>
        </div>
        {recentSessions.map(s => (
          <div key={s.id} className="grid px-5 py-3 border-b items-center"
            style={{ gridTemplateColumns: '1fr 140px 80px 120px', borderColor: 'var(--lc-border)' }}>
            <div>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--lc-text-2)' }}>{s.title}</p>
              <p style={{ fontSize: '10px', color: 'var(--lc-muted)', marginTop: 1 }}>
                {new Date(s.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--lc-text-3)' }}>{s.candidate?.name || '—'}</p>
            <span
              className="lc-badge"
              style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)', fontSize: '10px' }}>
              {s.level}
            </span>
            <span
              className="lc-badge"
              style={{
                backgroundColor: STATUS_COLOR[s.status] + '22',
                color: STATUS_COLOR[s.status],
                fontSize: '10px',
              }}>
              {STATUS_LABEL[s.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STAT CARD (shared)
   ════════════════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, color }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl border"
      style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
      <p style={{ fontSize: '11px', color: 'var(--lc-muted)', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: color || 'var(--lc-text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--lc-text-3)' }}>{sub}</p>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ROOT COMPONENT — tabs: Candidate  |  Interviewer
   ════════════════════════════════════════════════════════════════════ */
export default function PerformanceChart() {
  const { user } = useAuth()
  const isInterviewer = user?.role === 'INTERVIEWER' || user?.role === 'ADMIN'

  const [activeView, setActiveView] = useState('candidate')
  const [candData, setCandData] = useState(null)
  const [intData, setIntData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const requests = [api.get('/performance')]
    if (isInterviewer) requests.push(api.get('/performance/interviewer'))

    Promise.all(requests)
      .then(([candRes, intRes]) => {
        setCandData(candRes.data.data)
        if (intRes) setIntData(intRes.data.data)
      })
      .catch(() => setError('Failed to load performance data.'))
      .finally(() => setLoading(false))
  }, [isInterviewer])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--lc-muted)' }}>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
          </svg>
          <span style={{ fontSize: '13px' }}>Loading performance data…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
        <p style={{ fontSize: '13px', color: 'var(--lc-error)' }}>{error}</p>
      </div>
    )
  }

  const { evaluations, stats, byTopic, byLevel, scoreTrend } = candData

  const trendColor = stats.trend > 0 ? 'var(--lc-easy)' : stats.trend < 0 ? 'var(--lc-hard)' : 'var(--lc-text-3)'
  const trendLabel = stats.trend > 0 ? `+${stats.trend}` : `${stats.trend}`

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* ── View toggle (only when user is also interviewer/admin) ── */}
      {isInterviewer && (
        <div className="flex border-b" style={{ borderColor: 'var(--lc-border)' }}>
          {[['candidate', 'My Practice Stats'], ['interviewer', 'Interviewer Activity']].map(([id, lbl]) => (
            <button key={id}
              onClick={() => setActiveView(id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderBottomColor: activeView === id ? 'var(--lc-orange)' : 'transparent',
                color: activeView === id ? 'var(--lc-text)' : 'var(--lc-text-3)',
                backgroundColor: 'transparent',
              }}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* ══ CANDIDATE VIEW ══════════════════════════════════════════ */}
      {activeView === 'candidate' && (
        <>
          {!evaluations.length ? (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '360px' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--lc-orange-dim)', border: '1px solid rgba(255,161,22,0.3)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--lc-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--lc-text)', marginBottom: 4 }}>No data yet</p>
                <p style={{ fontSize: '13px', color: 'var(--lc-text-3)' }}>
                  Submit answers in the AI Interview tab to track your progress here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                <StatCard label="Total Attempts" value={stats.totalAttempts} sub="questions answered" />
                <StatCard label="Average Score" value={`${stats.averageScore}/10`} sub="across all topics" color={scoreColor(stats.averageScore)} />
                <StatCard label="Best Score" value={`${stats.bestScore}/10`} sub="personal best" color="var(--lc-easy)" />
                <StatCard label="Trend" value={trendLabel} sub="recent vs. early avg" color={trendColor} />
              </div>

              {/* Score trend chart */}
              <div className="rounded-xl border p-5"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
                <ScoreTrendChart evaluations={evaluations} scoreTrend={scoreTrend} />
              </div>

              {/* Topic strength & weakness */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--lc-text)' }}>
                  Topic Strengths &amp; Weaknesses
                  <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--lc-muted)', marginLeft: 8 }}>
                    click a topic to expand
                  </span>
                </p>
                <TopicBreakdown byTopic={byTopic} />
              </div>

              {/* By Level */}
              <div className="rounded-xl border p-5"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--lc-text)' }}>By Level</p>
                <div className="flex flex-col gap-3">
                  {byLevel.map(l => (
                    <div key={l.level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="lc-badge"
                          style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)', fontSize: '11px' }}>
                          {l.level}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--lc-text-3)' }}>
                          {l.count} attempt{l.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(l.avgScore) }}>
                        {l.avgScore}/10
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent attempts */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
                <div className="px-5 py-3 border-b"
                  style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>Recent Attempts</p>
                </div>
                <div className="grid px-5 py-2 border-b text-xs font-medium"
                  style={{
                    gridTemplateColumns: '1fr 80px 80px 100px',
                    color: 'var(--lc-text-3)', borderColor: 'var(--lc-border)',
                    backgroundColor: 'var(--lc-surface-2)',
                  }}>
                  <span>Question</span><span>Topic</span><span>Level</span>
                  <span style={{ textAlign: 'right' }}>Score</span>
                </div>
                {[...evaluations].reverse().slice(0, 10).map(e => (
                  <div key={e.id} className="grid px-5 py-3 border-b"
                    style={{ gridTemplateColumns: '1fr 80px 80px 100px', borderColor: 'var(--lc-border)' }}>
                    <span className="text-xs truncate pr-4" style={{ color: 'var(--lc-text-2)' }} title={e.question}>
                      {e.question}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--lc-text-3)' }}>{e.topic}</span>
                    <span className="lc-badge text-xs self-start"
                      style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)', fontSize: '10px', padding: '1px 6px' }}>
                      {e.level}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(e.score), textAlign: 'right' }}>
                      {e.score}/10
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ══ INTERVIEWER VIEW ════════════════════════════════════════ */}
      {activeView === 'interviewer' && intData && (
        <InterviewerStats stats={intData} />
      )}
    </div>
  )
}
