import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "./api.js";
import { useBoardSocket } from "./useSocket.js";
import Toolbar from "./components/Toolbar.jsx";
import Board from "./components/Board.jsx";
import IssueDetail from "./components/IssueDetail.jsx";
import PendingPanel from "./components/PendingPanel.jsx";
import RoadblocksPanel from "./components/RoadblocksPanel.jsx";
import LinksPanel from "./components/LinksPanel.jsx";
import ConnectorOverlay from "./components/ConnectorOverlay.jsx";

function getAuthor() {
  return localStorage.getItem("voc-board-author") || "";
}

const emptyBoard = { issues: [], notes: {}, pending: [], appliedLog: [], links: [], roadblocks: {} };

export default function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState(getAuthor);
  const [axisKey, setAxisKey] = useState("stage");
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null | 'pending' | 'roadblocks' | 'links'
  const [connected, setConnected] = useState(false);
  const [offscreenLinks, setOffscreenLinks] = useState([]);

  useEffect(() => {
    api.getBoard().then(setBoard).catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem("voc-board-author", author);
  }, [author]);

  useBoardSocket(
    useCallback((data) => {
      setBoard(data);
      setConnected(true);
    }, [])
  );

  const issuesById = useMemo(() => {
    const map = {};
    for (const i of board.issues) map[i.id] = i;
    return map;
  }, [board.issues]);

  const handleMove = useCallback(
    (issueId, toValue) => {
      api.moveIssue(issueId, axisKey, toValue, author || "anonymous").then(setBoard).catch(console.error);
    },
    [axisKey, author]
  );

  const handleOpen = useCallback((issue) => setSelectedIssueId(issue.id), []);
  const handleJumpTo = useCallback((issueId) => setSelectedIssueId(issueId), []);

  const handleAddNote = useCallback((issueId, text, who) => {
    api.addNote(issueId, text, who || "anonymous").then(setBoard).catch(console.error);
  }, []);

  const handleDeleteNote = useCallback((issueId, noteId) => {
    api.deleteNote(issueId, noteId).then(setBoard).catch(console.error);
  }, []);

  const handleSync = useCallback(async () => {
    const res = await api.sync();
    setBoard(res.board);
    return res;
  }, []);

  const handleToggleRoadblock = useCallback((issueId, reason) => {
    const promise =
      reason === null ? api.clearRoadblock(issueId) : api.setRoadblock(issueId, reason, author || "anonymous");
    promise.then(setBoard).catch(console.error);
  }, [author]);

  const handleAddLink = useCallback((fromId, toId, type, label, who) => {
    api.addLink(fromId, toId, type, label, who || "anonymous").then(setBoard).catch(console.error);
  }, []);

  const handleDeleteLink = useCallback((linkId) => {
    api.deleteLink(linkId).then(setBoard).catch(console.error);
  }, []);

  const selectedIssue = issuesById[selectedIssueId] || null;

  const spotlightLinks = useMemo(
    () =>
      selectedIssueId
        ? board.links.filter((l) => l.fromId === selectedIssueId || l.toId === selectedIssueId)
        : [],
    [board.links, selectedIssueId]
  );

  const spotlightRelatedIds = useMemo(() => {
    const set = new Set();
    for (const l of spotlightLinks) {
      set.add(l.fromId === selectedIssueId ? l.toId : l.fromId);
    }
    return set;
  }, [spotlightLinks, selectedIssueId]);

  return (
    <div className="app">
      <Toolbar
        search={search}
        onSearch={setSearch}
        author={author || "anonymous"}
        onAuthorChange={setAuthor}
        axisKey={axisKey}
        onAxisChange={setAxisKey}
        pendingCount={board.pending.length}
        onOpenPending={() => setActivePanel("pending")}
        roadblockCount={Object.keys(board.roadblocks).length}
        onOpenRoadblocks={() => setActivePanel("roadblocks")}
        linkCount={board.links.length}
        onOpenLinks={() => setActivePanel("links")}
        connected={connected}
      />
      <div className="board-viewport">
        <Board
          issues={board.issues}
          notes={board.notes}
          links={board.links}
          roadblocks={board.roadblocks}
          search={search}
          axisKey={axisKey}
          onMove={handleMove}
          onOpen={handleOpen}
          spotlightId={selectedIssueId}
          spotlightRelatedIds={spotlightRelatedIds}
        />
        <ConnectorOverlay
          spotlightId={selectedIssueId}
          relatedLinks={spotlightLinks}
          onOffscreen={setOffscreenLinks}
        />
      </div>
      {selectedIssue && (
        <IssueDetail
          key={selectedIssue.id}
          issue={selectedIssue}
          notes={board.notes[selectedIssue.id]}
          links={board.links}
          roadblock={board.roadblocks[selectedIssue.id]}
          author={author || "anonymous"}
          issuesById={issuesById}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onToggleRoadblock={handleToggleRoadblock}
          onAddLink={handleAddLink}
          onDeleteLink={handleDeleteLink}
          onJumpTo={handleJumpTo}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
      {activePanel === "pending" && (
        <PendingPanel
          pending={board.pending}
          appliedLog={board.appliedLog}
          onSync={handleSync}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "roadblocks" && (
        <RoadblocksPanel
          roadblocks={board.roadblocks}
          issuesById={issuesById}
          onJumpTo={(id) => {
            setActivePanel(null);
            setSelectedIssueId(id);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "links" && (
        <LinksPanel
          links={board.links}
          issuesById={issuesById}
          onJumpTo={(id) => {
            setActivePanel(null);
            setSelectedIssueId(id);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}
