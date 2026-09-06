import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Coins,
  ExternalLink,
  Fuel,
  Gauge,
  Factory,
  Leaf,
  Lightbulb,
  Database,
  Route,
  Ship,
  Sparkles,
  Target,
  Waves,
  Wind,
} from 'lucide-react'
import { completeOnboarding, getStoredUser } from '../lib/auth'

const problems = [
  {
    title: 'High Fuel Consumption',
    description: 'Predict inefficient operating conditions and recommend better vessel and speed strategies.',
    icon: Fuel,
    accent: 'green',
  },
  {
    title: 'Excessive Emissions',
    description: 'Optimize operations to reduce fuel usage and CO2 impact across every voyage.',
    icon: Leaf,
    accent: 'cyan',
  },
  {
    title: 'Inefficient Vessel Selection',
    description: 'Recommend the most suitable vessel for each voyage, cargo profile and route.',
    icon: Ship,
    accent: 'blue',
  },
  {
    title: 'Rising Operational Costs',
    description: 'Balance fuel consumption, voyage requirements and cost before the journey begins.',
    icon: Coins,
    accent: 'amber',
  },
  {
    title: 'Weather & Voyage Uncertainty',
    description: 'Use voyage and environmental factors to improve predictions and decisions.',
    icon: CloudSun,
    accent: 'cyan',
  },
  {
    title: 'Alternative Fuel Decisions',
    description: 'Compare cleaner fuel options such as LNG, methanol, hydrogen and ammonia.',
    icon: Wind,
    accent: 'green',
  },
]

type Policy = {
  name: string
  year: string
  target: string
  sector: string
  goal: string
  challenge: string
  solution: string
  impact: string
  source: string
}

// Keep policy facts in one source-backed collection so updates do not touch the presentation layer.
const policies: Policy[] = [
  {
    name: 'Harit Sagar Green Port Guidelines',
    year: '2023',
    target: 'Greener ports through cleaner energy, resource efficiency and lower emissions.',
    sector: 'Ports',
    goal: 'Guide major ports toward environmentally responsible operations and long-term decarbonization.',
    challenge: 'Port teams need to connect vessel calls, equipment, energy use and emissions into operational choices.',
    solution: 'GreenFleet turns vessel and voyage data into comparable fuel, emissions and cost scenarios for planning.',
    impact: 'More traceable port decisions and a clearer path from environmental guidelines to measurable operations.',
    source: 'https://shipmin.gov.in/en/content/harit-sagar-green-port-guidelines',
  },
  {
    name: 'Green Tug Transition Programme (GTTP)',
    year: '2023',
    target: 'A phased transition of harbour tugs at major ports to green technologies.',
    sector: 'Port craft',
    goal: 'Reduce emissions from port-side tug operations while enabling an orderly alternative-fuel transition.',
    challenge: 'Operators must compare fuel, cost, emissions, duty cycle and vessel suitability before investing.',
    solution: 'GreenFleet compares operating scenarios and recommends the vessel, speed and fuel choices that fit the job.',
    impact: 'Evidence-led tug transition plans with trade-offs visible to operators and port stakeholders.',
    source: 'https://shipmin.gov.in/en/division/ports-wing',
  },
  {
    name: 'Harit Nauka: Inland Vessel Green Transition Guidelines',
    year: '2023',
    target: 'A framework for cleaner inland vessels and greener inland-waterway operations.',
    sector: 'Inland waterways',
    goal: 'Support a lower-emission transition for inland water transport through guidance for vessels and operators.',
    challenge: 'Inland operators need practical comparisons across routes, cargo, vessel type, fuel and environmental conditions.',
    solution: 'GreenFleet combines voyage context and vessel data to estimate fuel, emissions and operational fit.',
    impact: 'A repeatable evidence base for selecting vessels and prioritizing cleaner operating strategies.',
    source: 'https://shipmin.gov.in/en/division/iwt-1',
  },
  {
    name: 'National Green Hydrogen Mission',
    year: '2023',
    target: 'Make India a global hub for green hydrogen production, use and export; initial outlay ₹19,744 crore.',
    sector: 'Hydrogen economy',
    goal: 'Accelerate green hydrogen supply, demand, infrastructure, standards, skills and innovation.',
    challenge: 'Fleet and port teams need decision support before new fuels become an operational commitment.',
    solution: 'GreenFleet creates a common comparison layer for fuel type, route, vessel capability, cost and emissions.',
    impact: 'Better-prepared adoption decisions as green hydrogen and its derivatives move from policy to operations.',
    source: 'https://mnre.gov.in/en/national-green-hydrogen-mission/',
  },
  {
    name: 'Green Hydrogen Shipping Pilot Projects',
    year: '2023',
    target: 'Shipping pilot projects supported under the Mission, with an outlay of ₹115 crore up to 2025-26.',
    sector: 'Shipping pilots',
    goal: 'Test green hydrogen applications in shipping and build evidence for future scale-up.',
    challenge: 'Pilots need consistent measurement of fuel performance, cost, route conditions and emissions impact.',
    solution: 'GreenFleet provides prediction and optimization workflows to compare a pilot against an operational baseline.',
    impact: 'Pilot learnings become structured, comparable evidence for the next investment or deployment decision.',
    source: 'https://mnre.gov.in/en/national-green-hydrogen-mission/',
  },
  {
    name: 'Maritime India Vision 2030',
    year: '2021',
    target: 'A roadmap for a more efficient, resilient and sustainable Indian maritime sector by 2030.',
    sector: 'Maritime ecosystem',
    goal: 'Advance ports, shipping, waterways and logistics through coordinated maritime-sector actions.',
    challenge: 'Roadmaps become difficult to execute when fleet-level data is disconnected from daily planning.',
    solution: 'GreenFleet links voyage data to predictions, recommendations and impact signals that teams can act on.',
    impact: 'A practical operating layer for translating sector roadmaps into repeatable fleet decisions.',
    source: 'https://shipmin.gov.in/en/content/maritime-india-vision-2030',
  },
  {
    name: 'Maritime Amrit Kaal Vision 2047',
    year: '2023',
    target: 'A long-term maritime roadmap for growth, competitiveness and sustainable development through 2047.',
    sector: 'Maritime ecosystem',
    goal: 'Shape a future-ready Indian maritime sector with stronger infrastructure, services and sustainability.',
    challenge: 'Long-term ambition needs short-cycle operational feedback on what is working across the fleet.',
    solution: 'GreenFleet makes fuel, emissions, cost and voyage choices visible at the point of decision.',
    impact: 'A measurable feedback loop between maritime ambition and everyday operational improvement.',
    source: 'https://shipmin.gov.in/en/content/maritime-amrit-kaal-vision-2047',
  },
]

function RouteMap() {
  return (
    <div className="solve-map" aria-hidden="true">
      <svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="solve-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#102326" />
            <stop offset="1" stopColor="#081113" />
          </linearGradient>
          <linearGradient id="solve-route" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#55d58a" stopOpacity="0" />
            <stop offset="0.48" stopColor="#53c8d2" stopOpacity="0.8" />
            <stop offset="1" stopColor="#55d58a" stopOpacity="0" />
          </linearGradient>
          <filter id="solve-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="1200" height="560" fill="url(#solve-ocean)" />
        <g className="solve-grid" stroke="#75d9d2" strokeOpacity="0.06" fill="none">
          <path d="M0 140H1200M0 280H1200M0 420H1200M200 0V560M400 0V560M600 0V560M800 0V560M1000 0V560" />
        </g>
        <g className="solve-land" fill="#1a3433" stroke="#2c5752" strokeOpacity="0.55">
          <path d="M94 126l45-22 38 9 22 33-17 21 12 42-35 25-31-18-30 10-34-34 12-37zM190 270l37 12 22 50-14 66-27 65-22-13-7-69-26-29 11-43z" />
          <path d="M441 111l42-25 53 14 28 37-12 32 26 26-27 32-39-3-19 38-32-12-7-52-40-21 11-39zM548 242l42 12 12 45-19 39-22 60-31-19-7-58-24-36z" />
          <path d="M664 115l55-24 43 20 23 35 43 11 8 34-50 21-13 38-44-7-25-35-47-14 15-37zM790 256l53-18 59 26 25 42-36 30-42-7-24 33-48-25-2-44z" />
          <path d="M1010 374l58-14 52 29 35 49-26 31-69-2-42-26-35 10-26-29z" />
        </g>
        <g className="solve-routes" fill="none" stroke="url(#solve-route)" strokeWidth="2">
          <path d="M213 176 C360 55 500 105 695 170 S930 260 1032 402" />
          <path d="M256 367 C390 300 500 365 595 294 S820 180 1012 198" />
          <path d="M595 294 C615 225 695 170 790 256" />
        </g>
        <g className="solve-points" fill="#55d58a" filter="url(#solve-glow)">
          <circle cx="213" cy="176" r="4" /><circle cx="695" cy="170" r="4" /><circle cx="1032" cy="402" r="4" /><circle cx="256" cy="367" r="4" /><circle cx="595" cy="294" r="4" /><circle cx="1012" cy="198" r="4" />
        </g>
        <g className="solve-vessels" fill="#8af1e0">
          <path d="M0-4l10 4-10 4 3-4z" transform="translate(400 100) rotate(18)" />
          <path d="M0-4l10 4-10 4 3-4z" transform="translate(830 232) rotate(25)" />
          <path d="M0-4l10 4-10 4 3-4z" transform="translate(500 333) rotate(-20)" />
        </g>
      </svg>
      <div className="solve-map-wash" />
    </div>
  )
}

const pipelineStages = [
  { id: 'voyage', label: 'Voyage Data', index: '01', icon: Ship },
  { id: 'prediction', label: 'AI Prediction', index: '02', icon: Sparkles },
  { id: 'optimization', label: 'Optimization Engine', index: '03', icon: Lightbulb },
  { id: 'recommendation', label: 'Smart Recommendation', index: '04', icon: CheckCircle2 },
  { id: 'impact', label: 'Cost + Emission Impact', index: '05', icon: Leaf },
]

function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState('optimization')

  return (
    <div className="intelligence-pipeline">
      <div className="pipeline-texture" aria-hidden="true" />
      <svg className="pipeline-track" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="pipeline-line" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#55d58a" stopOpacity="0.25" /><stop offset="0.48" stopColor="#53c8d2" stopOpacity="0.95" /><stop offset="1" stopColor="#55d58a" stopOpacity="0.45" /></linearGradient>
          <filter id="pipeline-line-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <path id="pipeline-path" d="M70 330 C190 90 330 110 430 300 S650 520 760 300 S1010 80 1135 300" />
          <path id="pipeline-mobile-path" d="M600 24 C540 120 660 180 600 275 S540 420 600 576" />
        </defs>
        <path className="pipeline-track-shadow" d="M70 330 C190 90 330 110 430 300 S650 520 760 300 S1010 80 1135 300" />
        <path className="pipeline-track-line" d="M70 330 C190 90 330 110 430 300 S650 520 760 300 S1010 80 1135 300" />
        <path className="pipeline-track-mobile" d="M600 24 C540 120 660 180 600 275 S540 420 600 576" />
        <circle className="pipeline-particle" r="7" fill="#8af1e0" filter="url(#pipeline-line-glow)"><animateMotion dur="7s" repeatCount="indefinite"><mpath href="#pipeline-path" /></animateMotion></circle>
        <circle className="pipeline-particle pipeline-particle-secondary" r="3" fill="#55d58a"><animateMotion dur="7s" begin="-3.5s" repeatCount="indefinite"><mpath href="#pipeline-path" /></animateMotion></circle>
        <circle className="pipeline-particle pipeline-particle-mobile" r="7" fill="#8af1e0" filter="url(#pipeline-line-glow)"><animateMotion dur="7s" repeatCount="indefinite"><mpath href="#pipeline-mobile-path" /></animateMotion></circle>
      </svg>

      <div className="pipeline-stages">
        {pipelineStages.map(({ id, label, index, icon: Icon }) => (
          <article key={id} className={`pipeline-stage pipeline-stage-${id} ${activeStage === id ? 'is-active' : ''}`} onMouseEnter={() => setActiveStage(id)} onFocus={() => setActiveStage(id)} tabIndex={0}>
            <div className="pipeline-stage-header"><div className="pipeline-stage-icon"><Icon size={17} /></div><div><span className="pipeline-stage-index">{index} / signal</span><h3>{label}</h3></div></div>
            {id === 'voyage' && <div className="pipeline-data-cloud"><span>Vessel</span><span>14.2 kn</span><span>12,480 nm</span><span>68k MT cargo</span><span>Weather</span><span>VLSFO</span></div>}
            {id === 'prediction' && <div className="pipeline-prediction"><div><span>Fuel consumption</span><strong>24.8 <small>MT/day</small></strong></div><div><span>CO2 output</span><strong className="cyan-text">76.9 <small>t/day</small></strong></div><div className="prediction-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>}
            {id === 'optimization' && <div className="pipeline-optimization"><svg viewBox="0 0 280 104" aria-hidden="true"><path className="route-option" d="M8 78 C60 18 105 20 150 65 S216 96 272 24" /><path className="route-option" d="M8 78 C68 70 102 82 145 53 S220 12 272 24" /><path className="route-option" d="M8 78 C65 45 105 45 148 54 S222 58 272 24" /><path className="route-optimal" d="M8 78 C65 45 105 45 148 54 S222 58 272 24" /><circle cx="8" cy="78" r="4" /><circle cx="272" cy="24" r="4" /></svg><div className="optimal-route-label"><span /> Optimal operating path <b>−8.6%</b></div></div>}
            {id === 'recommendation' && <div className="pipeline-recommendation"><div><span>Optimal vessel</span><strong>MV Meridian</strong></div><div><span>Optimal speed</span><strong>13.1 kn</strong></div><div><span>Fuel strategy</span><strong>Speed + trim</strong></div><div className="recommendation-saving"><span>Expected savings</span><strong>12.4%</strong></div></div>}
            {id === 'impact' && <div className="pipeline-impact"><div><strong>↓ 8.6%</strong><span>Fuel</span></div><div><strong>↓ 11.2%</strong><span>CO2</span></div><div><strong>↓ 9.4%</strong><span>Cost</span></div><div><strong>↑ 14%</strong><span>Efficiency</span></div></div>}
          </article>
        ))}
      </div>
      <div className="pipeline-caption"><span className="pipeline-caption-dot" /> Illustrative decision signal <span>Data moves from observation to action.</span></div>
    </div>
  )
}

export default function WhatWeSolve() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [selectedPolicy, setSelectedPolicy] = useState(0)

  function enterWorkspace() {
    completeOnboarding(user)
    navigate('/')
  }

  return (
    <div className="page-shell max-w-[1500px] mx-auto overflow-hidden">
      <section className="relative isolate min-h-[570px] flex items-end rounded-3xl border border-white/[0.08] overflow-hidden bg-[#0d1718] px-6 pb-8 pt-24 sm:px-10 sm:pb-12 lg:px-14 lg:pb-16 gf-enter">
        <RouteMap />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#55d58a]/25 bg-[#55d58a]/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7ce9a6]">
            <Waves size={13} /> Fleet intelligence, in motion
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">Turning Fleet Data Into Smarter, Greener Decisions.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#a9bab5] sm:text-lg">GreenFleet uses AI-powered prediction and optimization to reduce fuel consumption, emissions and operational costs across every voyage.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary group" onClick={enterWorkspace}>
              Enter Workspace <ArrowRight size={17} className="ml-2 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-2 px-1 text-xs text-[#7f918d]"><Route size={15} className="text-[#53c8d2]" /> From route signal to operational clarity</div>
          </div>
        </div>
      </section>

      <section className="mt-14 gf-enter gf-delay-1">
        <div className="mb-7 max-w-2xl"><p className="eyebrow mb-2">The decisions behind the data</p><h2 className="page-title">What we solve</h2><p className="muted mt-2">The pressure on modern fleets is connected. GreenFleet connects the signals so your team can act earlier.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {problems.map(({ title, description, icon: Icon, accent }) => (
            <article key={title} className="card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#55d58a]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,.24)]">
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${accent === 'green' ? 'border-[#55d58a]/20 bg-[#55d58a]/10 text-[#70e5a0]' : accent === 'cyan' ? 'border-[#53c8d2]/20 bg-[#53c8d2]/10 text-[#76dbe2]' : accent === 'amber' ? 'border-[#e7b86a]/20 bg-[#e7b86a]/10 text-[#e7b86a]' : 'border-[#6db3e8]/20 bg-[#6db3e8]/10 text-[#82c4f2]'}`}><Icon size={20} /></div>
              <h3 className="text-lg font-semibold text-[#edf5f1]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#899a96]">{description}</p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#55d58a] opacity-0 transition-opacity group-hover:opacity-100"></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 gf-enter gf-delay-2">
        <div className="mb-7"><p className="eyebrow mb-2">One connected operating loop</p><h2 className="page-title">How GreenFleet works</h2><p className="muted mt-2 max-w-2xl">Information travels through the GreenFleet intelligence engine, turning raw voyage signals into a decision your team can act on.</p></div>
        <IntelligencePipeline />
      </section>

      <section className="mt-20 gf-enter gf-delay-2">
        <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-end">
          <div>
            <p className="eyebrow mb-2">India policy lens</p>
            <h2 className="page-title">From Policy to Action</h2>
            <p className="muted mt-3 max-w-xl leading-6">Governments establish decarbonization targets, regulations, incentives and green-port and fuel initiatives. Fleet operators need practical tools to turn those priorities into operational decisions.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#53c8d2]/15 bg-[#102022]/70 p-4 text-sm text-[#b3c2be]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#53c8d2]/20 bg-[#53c8d2]/10 text-[#76dbe2]"><Database size={18} /></div>
            <div><p className="font-semibold text-[#e7f0ec]">Policy is the signal. Fleet data makes it actionable.</p><p className="mt-1 text-xs text-[#81928e]">India-focused initiatives, linked to operational decisions without inventing live metrics.</p></div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {policies.map((policy, index) => (
            <button
              key={policy.name}
              type="button"
              onClick={() => setSelectedPolicy(index)}
              className={`text-left rounded-2xl border p-5 transition-all duration-300 ${selectedPolicy === index ? 'border-[#55d58a]/45 bg-[#173329]/80 shadow-[0_14px_35px_rgba(0,0,0,.18)]' : 'border-white/[0.08] bg-[#101a1a]/70 hover:border-[#53c8d2]/30 hover:bg-[#142323]'}`}
            >
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7ce9a6]"><CalendarDays size={13} /> {policy.year}</span><span className="text-[10px] text-[#71827e]">{policy.sector}</span></div>
              <h3 className="mt-4 min-h-[3rem] text-base font-semibold leading-6 text-[#edf5f1]">{policy.name}</h3>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#8b9d98]">{policy.target}</p>
              <span className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#53c8d2]"></span>
            </button>
          ))}
        </div>

        <article className="mt-4 rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#172526] to-[#10191a] p-6 sm:p-8">
          <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="eyebrow mb-2">Selected initiative</p><h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{policies[selectedPolicy].name}</h3><p className="mt-2 text-sm text-[#899b96]">{policies[selectedPolicy].sector} · {policies[selectedPolicy].year}</p></div>
            <a className="btn-secondary shrink-0 text-sm" href={policies[selectedPolicy].source} target="_blank" rel="noreferrer">View Official Source <ExternalLink size={14} className="ml-2" /></a>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div><p className="policy-label"><Target size={13} /> Government Goal</p><p className="policy-copy">{policies[selectedPolicy].goal}</p></div>
            <div><p className="policy-label"><Factory size={13} /> Fleet / Port Challenge</p><p className="policy-copy">{policies[selectedPolicy].challenge}</p></div>
            <div><p className="policy-label"><Gauge size={13} /> How GreenFleet Helps</p><p className="policy-copy">{policies[selectedPolicy].solution}</p></div>
            <div><p className="policy-label"><Leaf size={13} /> Expected Impact</p><p className="policy-copy">{policies[selectedPolicy].impact}</p></div>
          </div>
        </article>

             </section>

      <section className="relative mt-16 overflow-hidden rounded-3xl border border-[#55d58a]/20 bg-gradient-to-br from-[#173329] via-[#122322] to-[#102022] p-8 sm:p-12 gf-enter gf-delay-3">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#53c8d2]/10 bg-[#53c8d2]/[0.04] blur-2xl" />
        <p className="eyebrow mb-3">The GreenFleet difference</p>
        <h2 className="relative max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">GreenFleet doesn&apos;t just show fleet data. It turns it into better decisions.</h2>
        <button className="btn-secondary relative mt-7" onClick={enterWorkspace}>
          Go to Dashboard <ArrowRight size={16} className="ml-2" />
        </button>
      </section>
    </div>
  )
}