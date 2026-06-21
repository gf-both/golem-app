import { useComputedProfile } from '../../hooks/useActiveProfile'
import AboutSystemButton from '../ui/AboutSystemButton'

export default function CareerAlignmentDetail() {
  const profile = useComputedProfile()

  if (!profile?.dob) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:12, opacity:.5, padding:40, textAlign:'center' }}>
        <div style={{ fontSize:40 }}>🧭</div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--gold)' }}>Complete your profile to see Career Alignment</div>
        <div style={{ fontSize:11, color:'var(--muted-foreground)', maxWidth:300 }}>Add your birth date in Settings to generate your career alignment map.</div>
      </div>
    )
  }

  const alignments = getCareerAlignments(profile)

  return (
    <div style={{ padding:'24px 28px', overflowY:'auto', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gold)' }}>
          Career Alignment — {profile.name || 'Your Profile'}
        </div>
        <AboutSystemButton systemName="Career" />
      </div>

      <Section title="Work Style" icon="◈">
        <div style={{ fontSize:13, lineHeight:1.7, color:'var(--muted-foreground)' }}>
          {alignments.hdWorkStyle}
        </div>
      </Section>

      <Section title="Best Role Types" icon="🎯">
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {alignments.bestRoles.map((role, i) => (
            <Chip key={i} label={role} />
          ))}
        </div>
      </Section>

      <Section title="Ideal Environment" icon="🌿">
        <div style={{ fontSize:13, lineHeight:1.7, color:'var(--muted-foreground)' }}>
          {alignments.environment}
        </div>
      </Section>

      <Section title="Ideal Collaborators" icon="🤝">
        <div style={{ fontSize:13, lineHeight:1.7, color:'var(--muted-foreground)' }}>
          {alignments.collaborators}
        </div>
      </Section>

      <Section title={`Life Path ${profile.lifePath} Career Theme`} icon="∞">
        <div style={{ fontSize:13, lineHeight:1.7, color:'var(--muted-foreground)' }}>
          {alignments.lifePathCareer}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--foreground)', opacity:.7 }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function Chip({ label }) {
  return (
    <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(201,168,76,.08)', border:'1px solid rgba(201,168,76,.2)', fontSize:11, color:'var(--gold)', fontFamily:"'Cinzel',serif", letterSpacing:'.06em' }}>
      {label}
    </div>
  )
}

function getCareerAlignments(profile) {
  const hdType = profile.hdType || 'Generator'
  const lifePath = profile.lifePath || 7

  const hdWorkStyles = {
    'Generator': 'You are built for sustained, satisfying work. Your sacral energy responds to what lights you up — when work feels right, you can outwork anyone. Best when you respond to opportunities rather than initiating. Mastery comes from repetition and depth.',
    'Manifesting Generator': "You are a multi-passionate, fast-moving force. You can do multiple things simultaneously and pivot quickly. Skip steps others can't — your gut knows. Best when you trust your response and don't wait for permission.",
    'Projector': 'You are a systems reader and guide. Your gift is seeing the big picture and how to improve it. Not built for grinding — you work best in short, focused bursts with adequate rest. Wait for recognition and invitations before advising.',
    'Manifestor': "You are built to initiate. When inspiration strikes, act — don't wait for approval. Inform others before you move to avoid resistance. Your impact is in starting things others carry forward.",
    'Reflector': 'You are a rare mirror of your environment. Monthly cycles of sampling and reflecting before deciding are natural for you. Your wisdom comes from taking in everything around you. Work environments matter enormously — choose people who inspire you.',
  }

  const hdRoles = {
    'Generator': ['Builder', 'Craftsperson', 'Specialist', 'Executor', 'Operator'],
    'Manifesting Generator': ['Entrepreneur', 'Creative Director', 'Multi-hyphenate', 'Pioneer', 'Innovator'],
    'Projector': ['Strategist', 'Consultant', 'Coach', 'Director', 'Advisor', 'Systems Thinker'],
    'Manifestor': ['Founder', 'Visionary', 'Creative Lead', 'Department Head', 'Initiator'],
    'Reflector': ['Culture Keeper', 'Evaluator', 'Judge', 'Community Steward', 'Ambassador'],
  }

  const hdEnvironments = {
    'Generator': 'Structured work with clear outcomes. Teams that value consistent output and mastery. Industries: craft, technology, health, education.',
    'Manifesting Generator': 'Fast-paced environments with room to pivot. Startup culture, creative industries, entrepreneurship. Avoid bureaucratic structures.',
    'Projector': 'Low-volume, high-quality work environments. Advisory and consulting roles. Avoid energy-intensive open offices. Best with recognition and respect built in.',
    'Manifestor': 'Independence and authority. Best as a founder, lead, or in roles with minimal approval chains. Needs freedom to act without constant sign-off.',
    'Reflector': 'Beautiful, high-integrity environments with inspiring people. Cyclical work rhythms. Avoid high-pressure, fast-moving cultures.',
  }

  const lifePathCareers = {
    1: "Leadership, innovation, entrepreneurship. You are here to pioneer — roles where you set direction and build what doesn't exist yet.",
    2: 'Partnership, diplomacy, support. You excel as a behind-the-scenes force: counselor, mediator, collaborator. Best when supporting visionary leadership.',
    3: 'Communication, creativity, expression. Writing, speaking, performance, creative direction. You energize teams and make ideas irresistible.',
    4: 'Building, systems, foundations. Engineering, architecture, management, operations. You create structures that outlast you.',
    5: 'Versatility, connection, adventure. Sales, marketing, journalism, exploration. You thrive with variety and human connection.',
    6: 'Service, beauty, community. Teaching, healing, design, care work. You create harmony and make others feel at home.',
    7: 'Research, depth, mastery. Philosophy, data, strategy, spirituality. You need solitude to produce your best work.',
    8: 'Executive, power, results. Finance, leadership, entrepreneurship. You are built for high stakes and large-scale impact.',
    9: 'Wisdom, completion, humanity. Counseling, art, philanthropy, global work. You synthesize and complete cycles.',
    11: "Inspiration, vision, illumination. Creative and spiritual leadership. You channel insight others can't access.",
    22: 'Master Building. Large-scale systems, infrastructure, global movements. The biggest dreams, most practical execution.',
  }

  return {
    hdWorkStyle: hdWorkStyles[hdType] || hdWorkStyles['Generator'],
    bestRoles: hdRoles[hdType] || hdRoles['Generator'],
    environment: hdEnvironments[hdType] || hdEnvironments['Generator'],
    collaborators: `As a ${hdType}, you pair best with ${hdType === 'Projector' ? 'Generators and Manifesting Generators who provide energy for your guidance' : hdType === 'Generator' ? 'Projectors who can guide your energy and Manifestors who can initiate for you' : hdType === 'Manifestor' ? 'Generators who sustain what you initiate and Projectors who refine your vision' : 'diverse types who benefit from your unique perspective'}.`,
    lifePathCareer: lifePathCareers[lifePath] || lifePathCareers[7],
  }
}
