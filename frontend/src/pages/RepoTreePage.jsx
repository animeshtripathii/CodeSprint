import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileImage,
  File,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Star,
  GitFork,
  ExternalLink,
  Copy,
  CheckCircle2,
  Code2,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Compass,
  ArrowUp,
  ArrowDown
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

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'html', 'css'].includes(ext)) {
    return <FileCode size={15} color="#818cf8" />;
  }
  if (['json', 'yaml', 'yml', 'toml', 'env'].includes(ext)) {
    return <FileJson size={15} color="#f59e0b" />;
  }
  if (['md', 'txt', 'rtf', 'doc'].includes(ext)) {
    return <FileText size={15} color="#34d399" />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) {
    return <FileImage size={15} color="#ec4899" />;
  }
  return <File size={15} color="rgba(255,255,255,0.5)" />;
}

// Convert flat tree array from GitHub API into nested tree nodes
function buildNestedTree(items) {
  const root = [];
  const map = {};

  items.forEach(item => {
    const parts = item.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, idx) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = idx === parts.length - 1 && item.type === 'blob';

      if (!map[currentPath]) {
        const node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          size: item.size || 0,
          children: isFile ? null : []
        };
        map[currentPath] = node;
        currentLevel.push(node);
      }

      if (!isFile && map[currentPath]) {
        currentLevel = map[currentPath].children;
      }
    });
  });

  return root;
}

// Recursive File Tree Node Item for Explorer View
function TreeNode({ node, level = 0, onSelectFile, selectedFilePath, filterQuery }) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isFolder = node.type === 'folder';
  const isSelected = selectedFilePath === node.path;

  if (filterQuery && node.name.toLowerCase().indexOf(filterQuery.toLowerCase()) === -1 && isFolder && !node.children?.some(c => c.name.toLowerCase().includes(filterQuery.toLowerCase()))) {
    return null;
  }

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          } else {
            onSelectFile(node);
          }
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px 5px ' + (level * 16 + 10) + 'px',
          borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem',
          fontWeight: isSelected ? 600 : 400,
          background: isSelected ? 'rgba(94, 106, 210, 0.25)' : 'transparent',
          color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
          borderLeft: isSelected ? '2px solid #818cf8' : '2px solid transparent',
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        {isFolder ? (
          <>
            {isOpen ? <ChevronDown size={14} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.5)" />}
            {isOpen ? <FolderOpen size={15} color="#fbbf24" /> : <Folder size={15} color="#fbbf24" />}
          </>
        ) : (
          <>
            <span style={{ width: 14 }} />
            {getFileIcon(node.name)}
          </>
        )}
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.name}</span>
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedFilePath={selectedFilePath}
              filterQuery={filterQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Interactive Canvas Node Tree Graph View ── */
function CanvasNodeGraph({ flatTree, repoName, onSelectFile, selectedFile, fileContent, fileLoading }) {
  const containerRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);

  // Hierarchical Node Positioning Logic
  useEffect(() => {
    if (!flatTree || flatTree.length === 0) return;

    const rootId = 'ROOT';
    const nodeList = [];
    const linkList = [];

    // Group items by parent directory path
    const childrenMap = {};
    flatTree.forEach(item => {
      const parts = item.path.split('/');
      const parentPath = parts.slice(0, -1).join('/') || rootId;
      if (!childrenMap[parentPath]) childrenMap[parentPath] = [];
      childrenMap[parentPath].push(item);
    });

    let currentY = 50;

    // Traverse recursively to layout child nodes next to their parent
    function layoutNodeChildren(parentId, parentLevel) {
      const children = childrenMap[parentId] || [];

      children.forEach(child => {
        const parts = child.path.split('/');
        const name = parts[parts.length - 1];
        const isFolder = child.type === 'tree';

        const x = parentLevel * 280 + 50;
        const y = currentY;
        currentY += 85;

        nodeList.push({
          id: child.path,
          name,
          path: child.path,
          type: isFolder ? 'folder' : 'file',
          x,
          y,
          level: parentLevel
        });

        // Link ONLY if parent is a real folder in the repository
        if (parentId !== rootId) {
          linkList.push({
            source: parentId,
            target: child.path
          });
        }

        if (isFolder && childrenMap[child.path]) {
          layoutNodeChildren(child.path, parentLevel + 1);
        }
      });
    }

    layoutNodeChildren(rootId, 0);

    setNodes(nodeList);
    setLinks(linkList);
  }, [flatTree, repoName]);

  // Handle Mouse Wheel Scrolling on Canvas
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl + wheel
      const zoomDelta = e.deltaY > 0 ? -0.06 : 0.06;
      setZoom(z => Math.min(Math.max(z + zoomDelta, 0.25), 2));
    } else {
      // Scroll vertically & horizontally
      setPan(p => ({
        x: p.x - e.deltaX * 0.8,
        y: p.y - e.deltaY * 0.8
      }));
    }
  };

  // Center/Fit all nodes in screen
  const handleFitToScreen = () => {
    if (nodes.length === 0) return;
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));

    const contentWidth = maxX - minX + 300;
    const contentHeight = maxY - minY + 200;

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const newZoom = Math.min(
      Math.max(0.3, Math.min(containerWidth / contentWidth, containerHeight / contentHeight)),
      1.0
    );

    setZoom(newZoom);
    setPan({
      x: 40 - minX * newZoom,
      y: 40 - minY * newZoom
    });
    toast.success('Tree view centered');
  };

  // Handle Node Drag
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      setDragOffset({
        x: (e.clientX / zoom) - targetNode.x,
        y: (e.clientY / zoom) - targetNode.y
      });
    }
  };

  // Canvas Pan & Node Mouse Move
  const handleMouseMove = (e) => {
    if (draggingNodeId) {
      const newX = (e.clientX / zoom) - dragOffset.x;
      const newY = (e.clientY / zoom) - dragOffset.y;

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 65;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden',
        background: '#050507', cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none'
      }}
    >
      {/* Scroll & View Controls floating widget */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, zIndex: 40, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(18, 22, 34, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 12, padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2))}
          style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.25))}
          style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <button
          onClick={handleFitToScreen}
          style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(94, 106, 210, 0.25)', border: '1px solid rgba(94, 106, 210, 0.4)', color: '#818cf8', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
          title="Center All Nodes"
        >
          <Compass size={13} />
          <span>Fit All</span>
        </button>

        <button
          onClick={() => setPan(p => ({ ...p, y: p.y + 150 }))}
          style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Scroll Up"
        >
          <ArrowUp size={14} />
        </button>

        <button
          onClick={() => setPan(p => ({ ...p, y: p.y - 150 }))}
          style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}
          title="Scroll Down"
        >
          <ArrowDown size={14} />
        </button>

        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, padding: '0 6px' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Main Canvas Workspace Container */}
      <div style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0', position: 'absolute', inset: 0, transition: isPanning || draggingNodeId ? 'none' : 'transform 0.1s ease-out'
      }}>
        {/* SVG Dotted Branch Connector Lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 8000, height: 10000, pointerEvents: 'none', zIndex: 1 }}>
          <defs>
            <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {links.map((link, idx) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);

            if (!sourceNode || !targetNode) return null;

            const fromX = sourceNode.x + NODE_WIDTH;
            const fromY = sourceNode.y + NODE_HEIGHT / 2;
            const toX = targetNode.x;
            const toY = targetNode.y + NODE_HEIGHT / 2;

            const deltaX = Math.abs(toX - fromX) / 2;
            const pathD = `M ${fromX} ${fromY} C ${fromX + deltaX} ${fromY}, ${toX - deltaX} ${toY}, ${toX} ${toY}`;

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#branchGrad)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  style={{ animation: 'dashFlow 20s linear infinite' }}
                />
                <circle cx={toX} cy={toY} r={3} fill="#818cf8" />
              </g>
            );
          })}
        </svg>

        {/* Render Canvas Draggable Nodes */}
        {nodes.map(node => {
          const isFolder = node.type === 'folder';
          const isSelected = selectedFile?.path === node.path;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={() => {
                if (!isFolder) {
                  onSelectFile(node);
                  setPreviewOpen(true);
                }
              }}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                zIndex: isSelected ? 20 : 10,
                background: isSelected ? 'rgba(30, 36, 56, 0.95)' : 'rgba(16, 20, 32, 0.88)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isSelected ? '#818cf8' : isFolder ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.14)'}`,
                boxShadow: isSelected ? '0 0 20px rgba(129, 140, 248, 0.4)' : '0 10px 24px rgba(0, 0, 0, 0.6)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: isFolder ? 'grab' : 'pointer',
                transition: draggingNodeId === node.id ? 'none' : 'box-shadow 0.2s, border-color 0.2s'
              }}
            >
              {/* Icon */}
              <div style={{
                padding: 7, borderRadius: 8,
                background: isFolder ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isFolder ? <Folder size={18} color="#fbbf24" /> : getFileIcon(node.name)}
              </div>

              {/* Node Name & Type Badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 600, color: '#fff',
                  textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
                }}>
                  {node.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: isFolder ? '#fbbf24' : 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  {isFolder ? 'Folder Node' : 'File Node'}
                </div>
              </div>

              <Move size={13} color="rgba(255,255,255,0.3)" />
            </div>
          );
        })}
      </div>

      {/* Slide-over Code Preview Drawer when clicking a File Node on Canvas */}
      {previewOpen && selectedFile && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, zIndex: 100,
          background: 'rgba(12, 14, 22, 0.96)', backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '-20px 0 50px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              {getFileIcon(selectedFile.name)}
              <span>{selectedFile.path}</span>
            </div>

            <button
              onClick={() => setPreviewOpen(false)}
              style={{ padding: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Code Body */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {fileLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Loading content...
              </div>
            ) : (
              <pre style={{
                margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem',
                lineHeight: 1.6, color: '#e2e8f0', whiteSpace: 'pre-wrap'
              }}>
                <code>{fileContent}</code>
              </pre>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dashFlow { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

export default function RepoTreePage() {
  const { owner, repo } = useParams();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('explorer');
  const [repoDetails, setRepoDetails] = useState(null);
  const [flatTree, setFlatTree] = useState([]);
  const [nestedTree, setNestedTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treeSearch, setTreeSearch] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRepoData = async () => {
    setLoading(true);
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoRes.ok) throw new Error('Repository not found');
      const repoData = await repoRes.json();
      setRepoDetails(repoData);

      const defaultBranch = repoData.default_branch || 'main';
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
      
      let treeData = [];
      if (treeRes.ok) {
        const result = await treeRes.json();
        treeData = result.tree || [];
      } else {
        const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
        if (contentsRes.ok) {
          const contents = await contentsRes.json();
          treeData = contents.map(c => ({
            path: c.name,
            type: c.type === 'dir' ? 'tree' : 'blob',
            size: c.size
          }));
        }
      }

      setFlatTree(treeData);
      const structured = buildNestedTree(treeData);
      setNestedTree(structured);

      const readmeNode = treeData.find(t => t.path.toLowerCase() === 'readme.md');
      if (readmeNode) {
        handleSelectFile({ name: readmeNode.path, path: readmeNode.path, type: 'file' });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch repository tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (owner && repo) {
      fetchRepoData();
    }
  }, [owner, repo]);

  const handleSelectFile = async (node) => {
    setSelectedFile(node);
    setFileLoading(true);
    setFileContent('');

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${node.path}`);
      if (!res.ok) throw new Error('Could not fetch file content');
      const data = await res.json();

      if (data.content) {
        const decoded = atob(data.content.replace(/\n/g, ''));
        setFileContent(decoded);
      } else if (data.download_url) {
        const rawRes = await fetch(data.download_url);
        const text = await rawRes.text();
        setFileContent(text);
      } else {
        setFileContent('// Binary or unreadable file preview');
      }
    } catch (err) {
      console.error(err);
      setFileContent('// Unable to load file content from GitHub API.');
    } finally {
      setFileLoading(false);
    }
  };

  const copyCode = () => {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    toast.success('File content copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.65} color="rgba(255,255,255,0.15)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

        {/* Top Header Navigation */}
        <header style={{
          zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/repositories')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700 }}>
              <GithubIcon size={16} color="#818cf8" />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{owner}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color: '#fff' }}>{repo}</span>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', padding: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}>
            <button
              onClick={() => setViewMode('explorer')}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                background: viewMode === 'explorer' ? '#ffffff' : 'transparent',
                color: viewMode === 'explorer' ? '#060709' : 'rgba(255,255,255,0.6)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
              }}
            >
              <Layers size={13} />
              <span>File Explorer</span>
            </button>

            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                background: viewMode === 'graph' ? '#ffffff' : 'transparent',
                color: viewMode === 'graph' ? '#060709' : 'rgba(255,255,255,0.6)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
              }}
            >
              <Sparkles size={13} color={viewMode === 'graph' ? '#060709' : '#ffffff'} />
              <span>Canvas Node Tree</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {repoDetails && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} color="#f59e0b" /> {repoDetails.stargazers_count}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <GitFork size={13} color="rgba(255,255,255,0.5)" /> {repoDetails.forks_count}
                </span>
              </div>
            )}

            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                background: '#ffffff', color: '#060709', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none'
              }}
            >
              <span>GitHub</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {viewMode === 'graph' ? (
          <CanvasNodeGraph
            flatTree={flatTree}
            repoName={repo}
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
            fileContent={fileContent}
            fileLoading={fileLoading}
          />
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', zIndex: 10 }}>
            {/* Left Panel: GitHub File Tree */}
            <div style={{
              width: 310, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10, 12, 19, 0.85)', backdropFilter: 'blur(16px)',
              display: 'flex', flexDirection: 'column', height: '100%'
            }}>
              <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 10 }} />
                  <input
                    type="text"
                    placeholder="Filter tree files..."
                    value={treeSearch}
                    onChange={e => setTreeSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px 6px 30px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontSize: '0.78rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
                {loading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                    <div>Loading file tree...</div>
                  </div>
                ) : nestedTree.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    No files found in tree.
                  </div>
                ) : (
                  nestedTree.map(node => (
                    <TreeNode
                      key={node.path}
                      node={node}
                      onSelectFile={handleSelectFile}
                      selectedFilePath={selectedFile?.path}
                      filterQuery={treeSearch}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: File Code Viewer */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'rgba(5, 5, 7, 0.95)' }}>
              {selectedFile ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(14, 18, 28, 0.8)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                      {getFileIcon(selectedFile.name)}
                      <span>{selectedFile.path}</span>
                    </div>

                    <button
                      onClick={copyCode}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {copied ? <CheckCircle2 size={13} color="#34d399" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative' }}>
                    {fileLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                        Loading file contents...
                      </div>
                    ) : (
                      <pre style={{
                        margin: 0, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                        fontSize: '0.83rem', lineHeight: 1.6, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                      }}>
                        <code>{fileContent}</code>
                      </pre>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                  <Code2 size={42} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, margin: '0 0 6px 0' }}>Select a file to preview</h3>
                  <p style={{ fontSize: '0.82rem', maxWidth: 360, margin: 0 }}>
                    Click any file from the GitHub repository tree on the left panel to view its code and contents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
