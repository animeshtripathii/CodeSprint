import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  FolderGit2,
  Search,
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  Code2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  Lock,
  Globe
} from 'lucide-react';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

function GithubIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Shell: '#89e051',
  Vue: '#41b883',
};

export default function RepositoriesPage() {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  const ghUsername = user?.githubUsername || (user?.email ? user.email.split('@')[0] : 'animeshtripathii');

  const fetchRepos = () => {
    setLoading(true);
    fetch(`https://api.github.com/users/${ghUsername}/repos?sort=updated&per_page=100`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch repositories');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRepos(data);
        } else {
          setRepos([]);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Could not load GitHub repositories');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRepos();
  }, [ghUsername]);

  const copyRepoUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Repository URL copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter repos
  const languages = ['All', ...new Set(repos.map(r => r.language).filter(Boolean))];

  const filteredRepos = repos.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesLang = selectedLang === 'All' || r.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto' }}>
        
        {/* Animated Canvas Background */}
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.65} color="rgba(255,255,255,0.15)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

        {/* Header Bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 7, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <FolderGit2 size={18} color="#818cf8" />
            </div>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>GitHub Repositories</h1>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Connected as <span style={{ color: '#34d399', fontWeight: 600 }}>@{ghUsername}</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchRepos}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </header>

        {/* Content Container */}
        <div style={{ padding: '24px 28px', position: 'relative', zIndex: 10 }}>

          {/* User GitHub Hero Bar */}
          <div className="liquid-glass" style={{
            borderRadius: 20, padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #5e6ad2, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#fff',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                <GithubIcon size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>@{ghUsername}</h2>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 8px', borderRadius: 99 }}>
                    Active
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  Displaying {repos.length} public GitHub repositories
                </div>
              </div>
            </div>

            <a
              href={`https://github.com/${ghUsername}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                background: '#ffffff', color: '#060709', fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,255,255,0.3)', transition: 'all 0.2s'
              }}
            >
              <span>View Profile on GitHub</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Search & Language Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: 240, position: 'relative', display: 'flex', alignItems: 'center'
            }}>
              <Search size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                placeholder="Search repositories by name or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '0.85rem', outline: 'none'
                }}
              />
            </div>

            {/* Language Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={15} color="rgba(255,255,255,0.5)" />
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(20, 24, 38, 0.9)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none', cursor: 'pointer'
                }}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang} style={{ background: '#121622', color: '#fff' }}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repositories Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="liquid-glass" style={{ borderRadius: 16, height: 150, opacity: 0.5, animation: 'pulse 1.5s infinite alternate' }} />
              ))}
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="liquid-glass" style={{ borderRadius: 20, padding: 48, textAlign: 'center' }}>
              <FolderGit2 size={36} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, margin: 0 }}>No Repositories Found</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {search ? 'Try clearing your search filters' : 'No public repositories available for this account.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {filteredRepos.map(repo => (
                <div
                  key={repo.id}
                  className="liquid-glass"
                  style={{
                    borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column',
                    justify: 'space-between', minHeight: 160, transition: 'transform 0.2s, border-color 0.2s'
                  }}
                >
                  <div>
                    {/* Title & Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <Link
                        to={`/repositories/${repo.owner.login}/${repo.name}`}
                        style={{
                          fontSize: '0.95rem', fontWeight: 700, color: '#818cf8', textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                      >
                        <GithubIcon size={14} color="#818cf8" />
                        <span>{repo.name}</span>
                      </Link>

                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600, color: repo.private ? '#fb7185' : 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.12)', padding: '2px 7px', borderRadius: 99,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {repo.private ? <Lock size={10} /> : <Globe size={10} />}
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 14px 0',
                      lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Footer Meta Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {repo.language && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: LANGUAGE_COLORS[repo.language] || '#818cf8'
                            }} />
                            <span>{repo.language}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                          <Star size={12} color="#f59e0b" />
                          <span>{repo.stargazers_count}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                          <GitFork size={12} color="rgba(255,255,255,0.5)" />
                          <span>{repo.forks_count}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Link
                          to={`/repositories/${repo.owner.login}/${repo.name}`}
                          title="Explore File Tree"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                            background: 'rgba(94,106,210,0.2)', border: '1px solid rgba(94,106,210,0.4)',
                            color: '#818cf8', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none'
                          }}
                        >
                          <FolderGit2 size={12} />
                          <span>Tree</span>
                        </Link>

                        <button
                          title="Copy Repository URL"
                          onClick={() => copyRepoUrl(repo.html_url, repo.id)}
                          style={{
                            padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {copiedId === repo.id ? <CheckCircle2 size={13} color="#34d399" /> : <Copy size={13} />}
                        </button>

                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open on GitHub"
                          style={{
                            padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
