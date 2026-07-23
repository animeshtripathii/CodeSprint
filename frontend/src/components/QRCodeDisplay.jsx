import React, { useState } from 'react';
import { FiCopy, FiCheck, FiDownload, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QrIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export default function QRCodeDisplay({ teamCode, teamName, hackathonTitle, inviteUrl }) {
  const [copied, setCopied] = useState(false);
  const targetUrl = inviteUrl || `${window.location.origin}/join-team?code=${teamCode}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}&color=1b68ff&bgcolor=0a0e1a`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamCode);
    toast.success('Team Code copied!');
  };

  return (
    <div className="qr-ticket-box text-center">
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-left">
          <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider flex items-center gap-1">
            <QrIcon /> Official Pass & Ticket
          </span>
          <h4 className="text-white font-bold text-lg mt-1" style={{ color: '#fff' }}>{teamName || 'Team Pass'}</h4>
          {hackathonTitle && <p className="text-xs text-slate-400">{hackathonTitle}</p>}
        </div>
        <div className="badge-glow" style={{ padding: '4px 10px', background: 'rgba(27,104,255,0.2)', border: '1px solid rgba(27,104,255,0.4)', borderRadius: 20, fontSize: '0.75rem', color: '#60a5fa' }}>
          Active Pass
        </div>
      </div>

      <div className="relative inline-block my-4 p-4" style={{ background: '#0a0e1a', borderRadius: 16, border: '1px solid rgba(27,104,255,0.3)', boxShadow: '0 0 30px rgba(27,104,255,0.2)' }}>
        <img 
          src={qrApiUrl} 
          alt={`QR Code for ${teamCode}`} 
          style={{ width: 180, height: 180, borderRadius: 12, margin: '0 auto', display: 'block' }} 
        />
        <div className="text-xs text-slate-400 mt-3 font-mono">
          SCAN TO JOIN TEAM
        </div>
      </div>

      <div className="my-3">
        <span className="text-xs text-slate-400 block mb-1">TEAM ACCESS CODE</span>
        <div className="flex items-center justify-center gap-2">
          <span className="code-badge-lg">{teamCode}</span>
          <button 
            onClick={handleCopyCode} 
            className="btn-glass btn-sm"
            title="Copy Code"
            style={{ padding: '8px 12px' }}
          >
            <FiCopy />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5">
        <button 
          onClick={handleCopyLink} 
          className="btn-blue-glow w-full justify-center text-sm"
        >
          {copied ? <FiCheck /> : <FiShare2 />} {copied ? 'Link Copied!' : 'Share Invite Link'}
        </button>
      </div>
    </div>
  );
}
