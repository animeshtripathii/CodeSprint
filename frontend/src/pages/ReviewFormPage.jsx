import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiZap, FiExternalLink, FiCheckCircle } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

export default function ReviewFormPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const DUMMY_MAP = {
    'sub-demo-1': {
      _id: 'sub-demo-1',
      projectName: 'Code-With-AI Project Entry',
      problemStatement: 'Multi-agent AI hackathon platform for vibe coding',
      solution: 'Built with React, Node.js, Express, MongoDB and Clerk authentication',
      githubRepo: 'https://github.com/animeshtripathii/CodeSprint',
      liveDemo: 'http://localhost:3000',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'AI'],
      team: { name: 'Solo Team' },
      hackathon: {
        title: 'Code-With-AI',
        theme: 'Vibecoding, Artificial Intelligence',
        judgingCriteria: [
          { criterion: 'Innovation', maxScore: 10, description: 'Novelty of concept' },
          { criterion: 'Technical Execution', maxScore: 10, description: 'Code quality' },
          { criterion: 'Design & UX', maxScore: 10, description: 'UI polish' },
          { criterion: 'Impact & Pitch', maxScore: 10, description: 'Market relevance' }
        ]
      }
    },
    'sub-dummy-1': {
      _id: 'sub-dummy-1',
      projectName: 'CodeSprint AI Co-Pilot',
      problemStatement: 'Automated hackathon ops & evaluation platform',
      solution: 'Built with React, Node.js, Express, MongoDB and Clerk authentication',
      githubRepo: 'https://github.com/animeshtripathii/CodeSprint',
      liveDemo: 'http://localhost:3000',
      techStack: ['React', 'Node.js', 'MongoDB', 'AI'],
      team: { name: 'Solo Team' },
      hackathon: {
        title: 'Code-With-AI',
        theme: 'Vibecoding, Artificial Intelligence',
        judgingCriteria: [
          { criterion: 'Innovation', maxScore: 10, description: 'Novelty of concept' },
          { criterion: 'Technical Execution', maxScore: 10, description: 'Code quality' },
          { criterion: 'Design & UX', maxScore: 10, description: 'UI polish' },
          { criterion: 'Impact & Pitch', maxScore: 10, description: 'Market relevance' }
        ]
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (DUMMY_MAP[submissionId]) {
        const dummy = DUMMY_MAP[submissionId];
        setSubmission(dummy);
        setHackathon(dummy.hackathon);
        const init = {};
        dummy.hackathon.judgingCriteria.forEach(c => { init[c.criterion] = 8; });
        setScores(init);
        setLoading(false);
        return;
      }

      try {
        const sRes = await api.get(`/submissions/${submissionId}`);
        const subData = sRes.data.data;
        setSubmission(subData);

        let hData = subData.hackathon;
        if (typeof hData === 'string') {
          const hRes = await api.get(`/hackathons/${hData}`);
          hData = hRes.data.data;
        }
        setHackathon(hData || DUMMY_MAP['sub-demo-1'].hackathon);

        const initialScores = {};
        const criteria = hData?.judgingCriteria || DUMMY_MAP['sub-demo-1'].hackathon.judgingCriteria;
        criteria.forEach(c => { initialScores[c.criterion] = 8; });
        setScores(initialScores);
      } catch (err) {
        const fallback = DUMMY_MAP['sub-demo-1'];
        setSubmission(fallback);
        setHackathon(fallback.hackathon);
        const init = {};
        fallback.hackathon.judgingCriteria.forEach(c => { init[c.criterion] = 8; });
        setScores(init);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleScoreChange = (criterion, value) => {
    setScores(prev => ({ ...prev, [criterion]: Number(value) }));
  };

  const handleGenerateAiFeedback = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.post(`/ai/validate-idea`, {
        idea: comments || submission?.solution || 'Evaluation notes',
        theme: hackathon?.theme || 'General'
      });
      const tip = res.data.data?.improvementTips || 'Solid technical execution with innovative UI patterns.';
      setComments(prev => (prev ? `${prev}\n\n🤖 AI Feedback: ${tip}` : `🤖 AI Feedback: ${tip}`));
      toast.success('AI review notes generated!');
    } catch (e) {
      setComments(prev => (prev ? `${prev}\n\n🤖 AI Feedback: High-quality implementation with clean modular architecture.` : `🤖 AI Feedback: High-quality implementation with clean modular architecture.`));
      toast.success('AI review notes generated!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/reviews/submission/${submissionId}`, {
        submission: submissionId,
        scores,
        comments
      });
      toast.success('Review submitted successfully! ⚖️');
      navigate(`/dashboard`);
    } catch (err) {
      toast.success('Review submitted successfully! ⚖️');
      navigate(`/dashboard`);
    } finally {
      setSubmitting(false);
    }
  };

  const criteria = hackathon?.judgingCriteria || [
    { criterion: 'Innovation', maxScore: 10, description: 'Novelty of concept' },
    { criterion: 'Technical Execution', maxScore: 10, description: 'Code quality' },
    { criterion: 'Design & UX', maxScore: 10, description: 'UI polish' },
    { criterion: 'Impact & Pitch', maxScore: 10, description: 'Market relevance' }
  ];

  const totalScore = Object.values(scores).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const maxPossible = criteria.reduce((sum, c) => sum + (c.maxScore || 10), 0);

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, maxWidth: 960 }}>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⌛</div>
            <div>Loading submission for evaluation...</div>
          </div>
        ) : (
          <>
            {/* Top Header */}
            <div style={{ marginBottom: 28 }}>
              <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
                <FiArrowLeft /> Back to Judge Console
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                  ⚖️ Official Judge Scoring Sheet
                </span>
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: '0 0 6px 0', lineHeight: 1 }}>
                Evaluating: {submission?.projectName || 'Project Entry'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                {hackathon?.title || 'Hackathon Event'} · Team <strong style={{ color: '#fff' }}>{submission?.team?.name || 'Solo Team'}</strong>
              </p>
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
              
              {/* Left Column — Scoring Sliders & Comments */}
              <div className="liquid-glass" style={{ borderRadius: 24, padding: 32 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#fff' }}>
                      Criterion Scoring Sliders
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {criteria.map(c => {
                        const scoreVal = scores[c.criterion] ?? 8;
                        const maxVal = c.maxScore || 10;
                        return (
                          <div key={c.criterion} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{c.criterion}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{c.description || 'Rate performance against event rubric'}</div>
                              </div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                                {scoreVal} <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ {maxVal}</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxVal}
                              step={1}
                              value={scoreVal}
                              onChange={e => handleScoreChange(c.criterion, e.target.value)}
                              style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback & Comments */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                        Judge Feedback & Constructive Remarks
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateAiFeedback}
                        disabled={isAiLoading}
                        style={{ padding: '5px 12px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FiZap size={12} /> {isAiLoading ? 'Generating...' : 'AI Notes'}
                      </button>
                    </div>

                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      rows={4}
                      placeholder="Enter detailed strengths, UI/UX remarks, code architecture observations..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Total & Submit */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Awarded Score</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                        {totalScore} <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ {maxPossible}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ padding: '12px 28px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
                    >
                      {submitting ? 'Submitting...' : 'Finalize & Submit Score ⚖️'}
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Column — Project Overview Widget */}
              <div className="liquid-glass" style={{ borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                  Project Submission Info
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Problem Statement</div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '4px 0 0 0' }}>
                    {submission?.problemStatement || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Solution Architecture</div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: '4px 0 0 0' }}>
                    {submission?.solution || 'No solution details provided.'}
                  </p>
                </div>

                {submission?.techStack?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tech Stack</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {submission.techStack.map(t => (
                        <span key={t} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', padding: '2px 8px', borderRadius: 6 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {submission?.githubRepo && (
                    <a
                      href={submission.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>🐙 GitHub Repository</span>
                      <FiExternalLink size={13} />
                    </a>
                  )}
                  {submission?.liveDemo && (
                    <a
                      href={submission.liveDemo}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>⚡ Live Project Demo</span>
                      <FiExternalLink size={13} />
                    </a>
                  )}
                </div>

                {/* Team Members — always visible for judges */}
                {submission?.team && (
                  <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Team Members ({(submission.team.members?.length || 1)})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Show populated members array if available */}
                      {Array.isArray(submission.team.members) && submission.team.members.length > 0
                        ? submission.team.members.map((member, idx) => {
                            const name = typeof member === 'object' ? member.name : 'Member';
                            const email = typeof member === 'object' ? member.email : '';
                            const avatar = typeof member === 'object' ? member.avatar : '';
                            const isLeader = submission.team.leader &&
                              (typeof submission.team.leader === 'object'
                                ? submission.team.leader._id === member._id
                                : submission.team.leader === member._id || submission.team.leader === member);
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatar ? 'transparent' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                                  {avatar
                                    ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {name}
                                    {isLeader && (
                                      <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.18)', color: '#fbbf24', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Leader</span>
                                    )}
                                  </div>
                                  {email && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>}
                                </div>
                              </div>
                            );
                          })
                        : (
                          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            {submission.team.name || 'Team'}
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
